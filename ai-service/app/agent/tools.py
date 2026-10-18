"""Tools Coach can call.

Rules enforced here in code (not left to the model):
- The user id comes from ToolContext (the verified service token). No tool accepts one.
- Arguments are validated with Pydantic; unknown fields are rejected.
- Numbers returned to the model are computed from the database.
- log_session runs only if the player asked to log something, and can be undone for 5 minutes.
- update_game and delete_session never write: they create a card the player must Confirm.
- At most MAX_WRITES writes per message.
"""

import logging
import re
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta, timezone
from typing import Any, Awaitable, Callable, Literal

from bson import ObjectId
from pydantic import BaseModel, ConfigDict, Field, ValidationError

from app.clients.core_api import CoreApiClient, CoreApiError
from app.domain import analytics, game_resolver
from app.domain.timeutil import PERIODS, format_minutes, period_range, previous_range, session_day
from app.errors import AppError
from app.llm.gemini_client import ToolSpec
from app.repositories.actions import ActionRepository
from app.repositories.library import GameRepository, SessionRepository
from app.repositories.memories import MEMORY_KINDS, MemoryRepository
from app.security import ServiceContext
from app.services.plan_service import PlanService

logger = logging.getLogger("kairo.tools")

MAX_WRITES = 3
UNDO_WINDOW = timedelta(minutes=5)
CONFIRM_WINDOW = timedelta(minutes=15)
MAX_MEMORIES = 50
LOG_INTENT = re.compile(r"\b(log|logs|logged|logging|record|recorded|track|tracked|add|added|save|played)\b", re.I)
STATUSES = ("Playing", "Completed", "Backlog", "Dropped")
MOODS = ("Focused", "Tilted", "Relaxed", "Tryhard", "Casual")


class ToolError(Exception):
    """A problem the model should read and react to (e.g. ask the player)."""


@dataclass
class ToolContext:
    service: ServiceContext
    today: date
    now: datetime
    recent_user_messages: list[str]
    games: GameRepository
    sessions: SessionRepository
    memories: MemoryRepository
    actions: ActionRepository
    plans: PlanService
    core: CoreApiClient
    progress: Any = None          # ProgressService (Phase 4)
    recommendations: Any = None   # RecommendationService (Phase 4)
    action_cards: list[dict] = field(default_factory=list)
    effects: dict = field(default_factory=lambda: {"sessionsAdded": [], "sessionsDeleted": [], "gamesUpdated": [], "plansChanged": False, "memoriesChanged": False, "goalsChanged": False})
    stats: list[dict] | None = None
    writes: int = 0

    @property
    def user_id(self) -> str:
        return self.service.user_id


# ------------------------------------------------------------------ helpers
def game_summary(game: dict) -> dict:
    notes = str(game.get("notes") or "")
    return {
        "id": str(game["_id"]),
        "title": game.get("title"),
        "genre": game.get("genre"),
        "platform": game.get("platform"),
        "status": game.get("status"),
        "progressPercent": game.get("progress", 0),
        "playtimeHours": game.get("playtime", 0),
        "rating": game.get("rating", 0),
        "achievements": f"{game.get('achievementsEarned', 0)}/{game.get('totalAchievements', 0)}",
        "playerNotes": notes[:200],
    }


def session_summary(doc: dict) -> dict:
    day = session_day(doc.get("date"))
    return {
        "id": str(doc["_id"]),
        "game": doc.get("game"),
        "date": day.isoformat() if day else None,
        "durationMinutes": doc.get("duration", 0),
        "result": doc.get("result") or None,
        "mood": doc.get("mood") or None,
        "kills": doc.get("kills", 0),
        "deaths": doc.get("deaths", 0),
        "assists": doc.get("assists", 0),
        "rankBefore": doc.get("rankBefore") or None,
        "rankAfter": doc.get("rankAfter") or None,
    }


def parse_date(value: str | None, ctx: ToolContext, name: str) -> date | None:
    if value in (None, ""):
        return None
    try:
        return date.fromisoformat(value)
    except ValueError:
        raise ToolError(f"{name} must be YYYY-MM-DD")


async def resolve_game(ctx: ToolContext, query: str) -> dict:
    games = await ctx.games.list_for_user(ctx.user_id)
    if not games:
        raise ToolError("The player's library is empty. Suggest adding the game on the Library page first.")
    result = game_resolver.resolve(query, games)
    if result["match"]:
        return result["match"]
    if result["candidates"]:
        options = ", ".join(c["game"]["title"] for c in result["candidates"])
        raise ToolError(f"'{query}' is ambiguous. Ask the player which one they mean: {options}.")
    raise ToolError(f"No game matching '{query}' is in the player's library.")


def use_write(ctx: ToolContext) -> None:
    if ctx.writes >= MAX_WRITES:
        raise ToolError("Too many changes in one message. Ask the player to continue in the next message.")
    ctx.writes += 1


def card(action: dict) -> dict:
    """The action card shown in chat (same shape the React ActionCard expects)."""
    out = {"_id": action["_id"], "type": action["type"], "status": action["status"], "title": action["title"], "details": action["details"]}
    if action.get("undoUntil"):
        out["undoUntil"] = action["undoUntil"]
    if action.get("expiresAt"):
        out["expiresAt"] = action["expiresAt"]
    return out


# ----------------------------------------------------------------- arg models
class Args(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class GetLibraryArgs(Args):
    status: Literal["Playing", "Completed", "Backlog", "Dropped"] | None = None
    search: str | None = Field(default=None, max_length=100)


class FindGameArgs(Args):
    query: str = Field(min_length=1, max_length=100)


class GetSessionsArgs(Args):
    game: str | None = Field(default=None, max_length=100)
    start_date: str | None = None
    end_date: str | None = None
    limit: int = Field(default=20, ge=1, le=50)


class GetStatsArgs(Args):
    period: Literal[PERIODS]  # type: ignore[valid-type]
    game: str | None = Field(default=None, max_length=100)


class LogSessionArgs(Args):
    game: str = Field(min_length=1, max_length=100)
    duration_minutes: int = Field(ge=1, le=1440)
    date: str | None = None
    result: Literal["Win", "Loss", "Draw"] | None = None
    mood: Literal["Focused", "Tilted", "Relaxed", "Tryhard", "Casual"] | None = None
    kills: int | None = Field(default=None, ge=0, le=10000)
    deaths: int | None = Field(default=None, ge=0, le=10000)
    assists: int | None = Field(default=None, ge=0, le=10000)
    add_to_playtime: bool = True
    log_unlisted_game: bool = False


class UpdateGameArgs(Args):
    game: str = Field(min_length=1, max_length=100)
    status: Literal["Playing", "Completed", "Backlog", "Dropped"] | None = None
    progress: int | None = Field(default=None, ge=0, le=100)
    rating: float | None = Field(default=None, ge=0, le=10)
    playtime_hours: float | None = Field(default=None, ge=0, le=100000)
    achievements_earned: int | None = Field(default=None, ge=0, le=100000)
    notes: str | None = Field(default=None, max_length=1000)


class DeleteSessionArgs(Args):
    session_id: str = Field(pattern=r"^[a-f0-9]{24}$")


class SaveMemoryArgs(Args):
    kind: Literal["preference", "context", "struggle", "goal"]
    text: str = Field(min_length=3, max_length=200)


class CreatePlanArgs(Args):
    game: str = Field(min_length=1, max_length=100)
    end_date: str
    daily_minutes: int = Field(ge=15, le=480)
    estimated_hours: float | None = Field(default=None, gt=0, le=500)
    estimate_source: Literal["user", "model_estimate"] = "user"


class NoArgs(Args):
    pass


class CreateGoalArgs(Args):
    type: Literal["weekly_playtime", "active_days", "weekly_sessions"]
    target: float = Field(gt=0, le=100)
    end_date: str | None = None


class RecommendArgs(Args):
    liked_games: list[str] = Field(default_factory=list, max_length=4)
    mood: str = Field(default="", max_length=200)
    platform: Literal["PC", "PS5", "PS4", "Xbox", "Switch", "Mobile"] | None = None


# ------------------------------------------------------------------ handlers
async def get_library(ctx: ToolContext, args: GetLibraryArgs) -> dict:
    games = await ctx.games.list_for_user(ctx.user_id)
    if args.status:
        games = [g for g in games if g.get("status") == args.status]
    if args.search:
        needle = args.search.lower()
        games = [g for g in games if needle in str(g.get("title", "")).lower() or needle in str(g.get("genre", "")).lower()]
    return {"count": len(games), "games": [game_summary(g) for g in games[:50]]}


async def find_game(ctx: ToolContext, args: FindGameArgs) -> dict:
    games = await ctx.games.list_for_user(ctx.user_id)
    result = game_resolver.resolve(args.query, games)
    return {
        "match": game_summary(result["match"]) if result["match"] else None,
        "candidates": [{"title": c["game"].get("title"), "id": str(c["game"]["_id"]), "score": c["score"]} for c in result["candidates"]],
    }


async def _canonical_title(ctx: ToolContext, game: str) -> str:
    games = await ctx.games.list_for_user(ctx.user_id)
    match = game_resolver.resolve(game, games)["match"]
    return match["title"] if match else game


def _filter_game(sessions: list[dict], title: str) -> list[dict]:
    wanted = title.strip().lower()
    return [doc for doc in sessions if str(doc.get("game", "")).strip().lower() == wanted]


async def get_sessions(ctx: ToolContext, args: GetSessionsArgs) -> dict:
    start = parse_date(args.start_date, ctx, "start_date")
    end = parse_date(args.end_date, ctx, "end_date") or ctx.today
    if start is None:
        start = end - timedelta(days=29)
    if start > end:
        raise ToolError("start_date must be before end_date")
    if (end - start).days > 366:
        raise ToolError("Choose a range of one year or less")
    sessions = await ctx.sessions.list_between(ctx.user_id, start, end)
    title = None
    if args.game:
        title = await _canonical_title(ctx, args.game)
        sessions = _filter_game(sessions, title)
    return {
        "range": {"start": start.isoformat(), "end": end.isoformat()},
        "game": title,
        "totalFound": len(sessions),
        "sessions": [session_summary(doc) for doc in sessions[: args.limit]],
    }


async def get_stats(ctx: ToolContext, args: GetStatsArgs) -> dict:
    if args.period == "all_time":
        sessions = await ctx.sessions.list_between(ctx.user_id, None, None)
    else:
        start, end = period_range(args.period, ctx.today)
        prev = previous_range(args.period, ctx.today)
        sessions = await ctx.sessions.list_between(ctx.user_id, min(start, prev[0]) if prev else start, end)
    title = None
    if args.game:
        title = await _canonical_title(ctx, args.game)
        sessions = _filter_game(sessions, title)
    stats = analytics.period_stats(sessions, args.period, ctx.today)
    if len(stats["current"].get("byDay", [])) > 14:
        stats["current"]["byDay"] = []  # keep the model's context small for long periods
    ctx.stats = analytics.stat_chips(stats)
    stats["game"] = title
    stats["today"] = ctx.today.isoformat()
    return stats


async def log_session(ctx: ToolContext, args: LogSessionArgs) -> dict:
    if not any(LOG_INTENT.search(text) for text in ctx.recent_user_messages):
        raise ToolError("The player hasn't asked to log a session. Ask them before logging anything.")
    day = parse_date(args.date, ctx, "date") or ctx.today
    if day > ctx.today:
        raise ToolError("Sessions can't be logged in the future.")
    if day < ctx.today - timedelta(days=365):
        raise ToolError("Sessions older than a year can't be logged here.")

    game_id = None
    games = await ctx.games.list_for_user(ctx.user_id)
    result = game_resolver.resolve(args.game, games)
    if result["match"]:
        title, game_id = result["match"]["title"], str(result["match"]["_id"])
    elif result["candidates"]:
        options = ", ".join(c["game"]["title"] for c in result["candidates"])
        raise ToolError(f"'{args.game}' is ambiguous. Ask the player which one: {options}.")
    elif args.log_unlisted_game:
        title = args.game
    else:
        raise ToolError(
            f"'{args.game}' isn't in the player's library. Ask whether to log it anyway "
            "(then call again with log_unlisted_game=true) or add it on the Library page first."
        )

    use_write(ctx)
    kills, deaths, assists = args.kills or 0, args.deaths or 0, args.assists or 0
    payload = {
        "game": title,
        "duration": args.duration_minutes,
        "date": day.isoformat(),
        "kills": kills,
        "deaths": deaths,
        "assists": assists,
        "result": args.result or "",
        "mood": args.mood or "",
    }
    add_playtime = game_id if (args.add_to_playtime and game_id) else None
    try:
        response = await ctx.core.create_session(ctx.user_id, payload, add_playtime)
    except CoreApiError as exc:
        raise ToolError(f"Saving failed: {exc.message}")

    session = response.get("session") or {}
    hours = round(args.duration_minutes / 60, 2) if add_playtime else 0
    details = [
        {"label": "Game", "value": title},
        {"label": "Duration", "value": format_minutes(args.duration_minutes)},
        {"label": "Date", "value": day.strftime("%b %d")},
    ]
    if args.result:
        details.append({"label": "Result", "value": args.result})
    if hours:
        details.append({"label": "Game playtime", "value": f"+{hours:g}h"})
    action = await ctx.actions.create(ctx.user_id, {
        "type": "log_session",
        "status": "done",
        "title": "Session logged",
        "details": details,
        "payload": {"sessionId": str(session.get("_id", "")), "gameId": game_id, "playtimeHours": hours},
        "undoUntil": ctx.now + UNDO_WINDOW,
        "createdAt": ctx.now,
    })
    ctx.action_cards.append(card(action))
    ctx.effects["sessionsAdded"].append(session)
    if response.get("game"):
        ctx.effects["gamesUpdated"].append(response["game"])
    return {
        "saved": True,
        "session": {"game": title, "durationMinutes": args.duration_minutes, "date": day.isoformat()},
        "addedToGamePlaytimeHours": hours,
        "note": "Already saved. The player can press Undo on the card within 5 minutes.",
    }


async def update_game(ctx: ToolContext, args: UpdateGameArgs) -> dict:
    game = await resolve_game(ctx, args.game)
    requested = {
        "status": ("Status", args.status, game.get("status")),
        "progress": ("Progress", args.progress, game.get("progress", 0)),
        "rating": ("Rating", args.rating, game.get("rating", 0)),
        "playtime": ("Playtime (h)", args.playtime_hours, game.get("playtime", 0)),
        "achievementsEarned": ("Achievements", args.achievements_earned, game.get("achievementsEarned", 0)),
        "notes": ("Notes", args.notes, game.get("notes", "")),
    }
    changes, details = {}, []
    for key, (label, new, old) in requested.items():
        if new is None or new == old:
            continue
        changes[key] = new
        if key == "notes":
            details.append({"label": label, "value": "updated"})
        else:
            suffix = "%" if key == "progress" else ""
            details.append({"label": label, "value": f"{old}{suffix} → {new}{suffix}"})
    if not changes:
        raise ToolError("Nothing to change: the game already has those values.")

    use_write(ctx)
    action = await ctx.actions.create(ctx.user_id, {
        "type": "update_game",
        "status": "pending",
        "title": f"Update {game.get('title')}",
        "details": details,
        "payload": {"gameId": str(game["_id"]), "changes": changes, "gameTitle": game.get("title")},
        "expiresAt": ctx.now + CONFIRM_WINDOW,
        "createdAt": ctx.now,
    })
    ctx.action_cards.append(card(action))
    return {"status": "awaiting_confirmation", "changes": details, "note": "NOT applied yet. Tell the player to press Confirm on the card."}


async def delete_session(ctx: ToolContext, args: DeleteSessionArgs) -> dict:
    session = await ctx.sessions.get_owned(ctx.user_id, args.session_id)
    if session is None:
        raise ToolError("No session with that id. Use get_sessions to find the right one.")
    use_write(ctx)
    summary = session_summary(session)
    action = await ctx.actions.create(ctx.user_id, {
        "type": "delete_session",
        "status": "pending",
        "title": "Delete session",
        "details": [
            {"label": "Game", "value": str(summary["game"])},
            {"label": "Duration", "value": format_minutes(summary["durationMinutes"])},
            {"label": "Date", "value": summary["date"] or "-"},
        ],
        "payload": {"sessionId": summary["id"]},
        "expiresAt": ctx.now + CONFIRM_WINDOW,
        "createdAt": ctx.now,
    })
    ctx.action_cards.append(card(action))
    return {"status": "awaiting_confirmation", "note": "NOT deleted yet. Tell the player to press Confirm on the card."}


async def save_memory(ctx: ToolContext, args: SaveMemoryArgs) -> dict:
    existing = await ctx.memories.list_for_user(ctx.user_id, limit=MAX_MEMORIES)
    if any(m.get("text", "").strip().lower() == args.text.lower() for m in existing):
        return {"saved": False, "reason": "Already remembered."}
    if len(existing) >= MAX_MEMORIES:
        return {"saved": False, "reason": "Memory is full. The player can delete old memories from the Memory panel."}
    await ctx.memories.add(ctx.user_id, args.kind, args.text, ctx.now)
    ctx.effects["memoriesChanged"] = True
    return {"saved": True}


async def create_quest_plan(ctx: ToolContext, args: CreatePlanArgs) -> dict:
    game = await resolve_game(ctx, args.game)
    end = parse_date(args.end_date, ctx, "end_date")
    try:
        plan = await ctx.plans.create(
            ctx.user_id, str(game["_id"]), end, args.daily_minutes, args.estimated_hours,
            args.estimate_source if args.estimated_hours else None, ctx.today, ctx.now,
        )
    except AppError as exc:
        raise ToolError(exc.message)
    ctx.effects["plansChanged"] = True
    return {
        "created": True,
        "game": plan["gameTitle"],
        "startDate": plan["startDate"],
        "endDate": plan["endDate"],
        "dailyMinutes": plan["dailyMinutes"],
        "estimate": plan["estimate"],
        "feasibility": plan["feasibility"],
        "days": len(plan["milestones"]),
        "note": "The full day-by-day plan is on the Goals page.",
    }


async def get_quest_plans(ctx: ToolContext, args: NoArgs) -> dict:
    plans = await ctx.plans.list(ctx.user_id, ctx.today)
    return {
        "plans": [
            {
                "game": p["gameTitle"],
                "endDate": p["endDate"],
                "progressPercent": p["progressPercent"],
                "playedMinutes": p["playedMinutes"],
                "neededMinutes": p["neededMinutes"],
                "feasibility": p["feasibility"],
                "missedDays": sum(1 for m in p["milestones"] if m["status"] == "missed"),
                "today": next((m for m in p["milestones"] if m["date"] == ctx.today.isoformat()), None),
                "estimate": p["estimate"],
            }
            for p in plans
        ]
    }


async def get_goals(ctx: ToolContext, args: NoArgs) -> dict:
    views = await ctx.progress.goal_views(ctx.user_id, ctx.today)
    return {"goals": [v for v in views if v["status"] == "active" or v["endDate"] >= (ctx.today - timedelta(days=14)).isoformat()],
            "note": "weekly_playtime values are minutes."}


async def create_goal(ctx: ToolContext, args: CreateGoalArgs) -> dict:
    end = parse_date(args.end_date, ctx, "end_date") or ctx.today + timedelta(days=6 - ctx.today.weekday())
    try:
        goal = await ctx.progress.create_goal(ctx.user_id, args.type, args.target, end, ctx.today, ctx.now)
    except AppError as exc:
        raise ToolError(exc.message)
    ctx.effects["goalsChanged"] = True
    return {"created": True, "goal": goal, "note": "It counts sessions from Monday of this week. weekly_playtime target was given in hours."}


async def recommend_games(ctx: ToolContext, args: RecommendArgs) -> dict:
    try:
        result = await ctx.recommendations.recommend(ctx.user_id, args.liked_games, args.mood, args.platform)
    except AppError as exc:
        raise ToolError(exc.message)
    return {
        "basedOn": result["likedGames"],
        "recommendations": [
            {k: r[k] for k in ("title", "genres", "platforms", "released", "estHours", "match", "reasons")} for r in result["recommendations"][:5]
        ],
        "note": "estHours is RAWG's community average, an estimate. More options and comparison are on the Discover page.",
    }


# ---------------------------------------------------------------- registry
@dataclass(frozen=True)
class Tool:
    spec: ToolSpec
    args_model: type[Args]
    handler: Callable[[ToolContext, Any], Awaitable[dict]]


def _schema(properties: dict, required: list[str] | None = None) -> dict:
    return {"type": "object", "properties": properties, "required": required or []}


DATE = {"type": "string", "description": "YYYY-MM-DD"}

TOOLS: list[Tool] = [
    Tool(ToolSpec("get_library", "List the player's games with status, progress, playtime (hours) and rating.", _schema({
        "status": {"type": "string", "enum": list(STATUSES)},
        "search": {"type": "string", "description": "Filter by words in the title or genre"},
    })), GetLibraryArgs, get_library),
    Tool(ToolSpec("find_game", "Find which game in the player's library they mean. Returns a match or candidates to ask about.", _schema({
        "query": {"type": "string", "description": "What the player called the game"},
    }, ["query"])), FindGameArgs, find_game),
    Tool(ToolSpec("get_sessions", "List logged sessions (newest first). Defaults to the last 30 days.", _schema({
        "game": {"type": "string"},
        "start_date": DATE,
        "end_date": DATE,
        "limit": {"type": "integer", "minimum": 1, "maximum": 50},
    })), GetSessionsArgs, get_sessions),
    Tool(ToolSpec("get_stats", "Playtime statistics for a period with a comparison to the previous period. Use for any question about totals, trends, consistency or progress.", _schema({
        "period": {"type": "string", "enum": list(PERIODS)},
        "game": {"type": "string", "description": "Only this game"},
    }, ["period"])), GetStatsArgs, get_stats),
    Tool(ToolSpec("log_session", "Save a gaming session the player asked you to log. Runs immediately; the player can undo it.", _schema({
        "game": {"type": "string"},
        "duration_minutes": {"type": "integer", "minimum": 1, "maximum": 1440},
        "date": {**DATE, "description": "YYYY-MM-DD, defaults to today"},
        "result": {"type": "string", "enum": ["Win", "Loss", "Draw"]},
        "mood": {"type": "string", "enum": list(MOODS)},
        "kills": {"type": "integer", "minimum": 0},
        "deaths": {"type": "integer", "minimum": 0},
        "assists": {"type": "integer", "minimum": 0},
        "add_to_playtime": {"type": "boolean", "description": "Also add the duration to the game's playtime. Default true."},
        "log_unlisted_game": {"type": "boolean", "description": "Only true if the player confirmed logging a game that isn't in their library"},
    }, ["game", "duration_minutes"])), LogSessionArgs, log_session),
    Tool(ToolSpec("update_game", "Propose changes to a game in the library. Shows the player a Confirm card; nothing changes until they confirm.", _schema({
        "game": {"type": "string"},
        "status": {"type": "string", "enum": list(STATUSES)},
        "progress": {"type": "integer", "minimum": 0, "maximum": 100},
        "rating": {"type": "number", "minimum": 0, "maximum": 10},
        "playtime_hours": {"type": "number", "minimum": 0},
        "achievements_earned": {"type": "integer", "minimum": 0},
        "notes": {"type": "string"},
    }, ["game"])), UpdateGameArgs, update_game),
    Tool(ToolSpec("delete_session", "Propose deleting one session (get its id from get_sessions). Shows a Confirm card.", _schema({
        "session_id": {"type": "string"},
    }, ["session_id"])), DeleteSessionArgs, delete_session),
    Tool(ToolSpec("save_memory", "Remember a lasting, useful fact the player shared (preference, goal, recurring struggle). Never save sensitive personal data.", _schema({
        "kind": {"type": "string", "enum": list(MEMORY_KINDS)},
        "text": {"type": "string", "description": "One short sentence"},
    }, ["kind", "text"])), SaveMemoryArgs, save_memory),
    Tool(ToolSpec("create_quest_plan", "Create a day-by-day plan to finish a game by a deadline.", _schema({
        "game": {"type": "string"},
        "end_date": DATE,
        "daily_minutes": {"type": "integer", "minimum": 15, "maximum": 480},
        "estimated_hours": {"type": "number", "description": "Total hours to finish. Use the player's number if they gave one."},
        "estimate_source": {"type": "string", "enum": ["user", "model_estimate"], "description": "model_estimate if YOU guessed the length"},
    }, ["game", "end_date", "daily_minutes"])), CreatePlanArgs, create_quest_plan),
    Tool(ToolSpec("get_quest_plans", "The player's quest plans with real progress from their sessions.", _schema({})), NoArgs, get_quest_plans),
    Tool(ToolSpec("get_goals", "The player's goals (weekly playtime, active days, sessions) with progress measured from their sessions.", _schema({})), NoArgs, get_goals),
    Tool(ToolSpec("create_goal", "Create a goal for the player. weekly_playtime target is in HOURS; active_days in days (1-7); weekly_sessions in sessions.", _schema({
        "type": {"type": "string", "enum": ["weekly_playtime", "active_days", "weekly_sessions"]},
        "target": {"type": "number"},
        "end_date": {**DATE, "description": "YYYY-MM-DD, defaults to this Sunday"},
    }, ["type", "target"])), CreateGoalArgs, create_goal),
    Tool(ToolSpec("recommend_games", "Recommend new games similar to ones the player loved (uses the RAWG database, excludes games they own).", _schema({
        "liked_games": {"type": "array", "items": {"type": "string"}, "description": "Titles they loved; leave empty to use their top-rated and completed games"},
        "mood": {"type": "string", "description": "e.g. 'under 20 hours', 'short'"},
        "platform": {"type": "string", "enum": ["PC", "PS5", "PS4", "Xbox", "Switch", "Mobile"]},
    })), RecommendArgs, recommend_games),
]

REGISTRY = {tool.spec.name: tool for tool in TOOLS}
SPECS = [tool.spec for tool in TOOLS]


def to_jsonable(value: Any) -> Any:
    if isinstance(value, ObjectId):
        return str(value)
    if isinstance(value, datetime):
        return value.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")
    if isinstance(value, date):
        return value.isoformat()
    if isinstance(value, dict):
        return {k: to_jsonable(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [to_jsonable(v) for v in value]
    return value


async def execute(name: str, raw_args: dict, ctx: ToolContext) -> dict:
    """Runs one tool call. Never raises: errors go back to the model as data."""
    tool = REGISTRY.get(name)
    if tool is None:
        return {"ok": False, "error": f"Unknown tool '{name}'."}
    try:
        args = tool.args_model.model_validate(raw_args or {})
    except ValidationError as exc:
        first = exc.errors()[0]
        where = ".".join(str(p) for p in first.get("loc", []))
        return {"ok": False, "error": f"Invalid arguments ({where}: {first.get('msg')})."}
    try:
        data = await tool.handler(ctx, args)
        return {"ok": True, "data": to_jsonable(data)}
    except ToolError as exc:
        return {"ok": False, "error": str(exc)}
    except Exception:
        logger.exception("Tool %s failed request_id=%s", name, ctx.service.request_id)
        return {"ok": False, "error": "Internal error while running the tool."}
