"""Streaks, XP, levels, badges and challenges, all derived from real records.

Nothing here is stored as a running counter: progression is recomputed from
sessions, games, goals and challenges each time, so it can never drift or be
gamed by editing a number, and it stays correct after an undo or a delete.
"""

from collections import defaultdict
from datetime import date, timedelta

from app.domain.timeutil import format_minutes, session_day

# ----------------------------------------------------------------------- XP
SESSION_BASE_XP = 10
SESSION_MAX_XP = 50
COMPLETED_GAME_XP = 200
GOAL_MET_XP = 100

LEVEL_TITLES = [(1, "Rookie"), (3, "Adventurer"), (5, "Veteran"), (8, "Elite"), (12, "Legend")]


def session_xp(minutes: int) -> int:
    return min(SESSION_MAX_XP, SESSION_BASE_XP + max(0, int(minutes)) // 5)


def xp_for_level(level: int) -> int:
    """Total XP needed to reach a level: 0, 100, 300, 600, 1000, 1500, ..."""
    return 50 * level * (level - 1)


def level_for_xp(xp: int) -> int:
    level = 1
    while xp_for_level(level + 1) <= xp:
        level += 1
    return level


def level_title(level: int) -> str:
    title = LEVEL_TITLES[0][1]
    for threshold, name in LEVEL_TITLES:
        if level >= threshold:
            title = name
    return title


def _minutes(doc: dict) -> int:
    try:
        return max(0, int(round(float(doc.get("duration") or 0))))
    except (TypeError, ValueError):
        return 0


# ------------------------------------------------------------------ streaks
def played_days(sessions: list[dict]) -> set[date]:
    return {d for d in (session_day(s.get("date")) for s in sessions) if d is not None}


def streaks(days: set[date], today: date) -> dict:
    """Current streak survives until the end of today even if today isn't logged yet."""
    start = today if today in days else today - timedelta(days=1)
    current = 0
    day = start
    while day in days:
        current += 1
        day -= timedelta(days=1)

    longest, run, previous = 0, 0, None
    first_reached: dict[int, date] = {}
    for day in sorted(days):
        run = run + 1 if previous and day - previous == timedelta(days=1) else 1
        longest = max(longest, run)
        for target in (7, 30):
            if run >= target and target not in first_reached:
                first_reached[target] = day
        previous = day
    return {
        "current": current,
        "longest": longest,
        "playedToday": today in days,
        "atRisk": current > 0 and today not in days,
        "reached": first_reached,
    }


def last_days(days: set[date], today: date, count: int = 7) -> list[dict]:
    out = []
    for offset in range(count - 1, -1, -1):
        day = today - timedelta(days=offset)
        out.append({"label": day.strftime("%a")[0], "date": day.isoformat(), "logged": day in days})
    return out


def consistent_weeks(days: set[date], today: date, target_days: int) -> tuple[int, date | None]:
    """Most consecutive full weeks (Mon-Sun) with at least `target_days` played, and when 4 in a row was first hit."""
    if not days:
        return 0, None
    first_monday = min(days) - timedelta(days=min(days).weekday())
    this_monday = today - timedelta(days=today.weekday())
    best, run, fourth = 0, 0, None
    monday = first_monday
    while monday < this_monday:  # only finished weeks count
        played = sum(1 for i in range(7) if monday + timedelta(days=i) in days)
        run = run + 1 if played >= target_days else 0
        best = max(best, run)
        if run >= 4 and fourth is None:
            fourth = monday + timedelta(days=6)
        monday += timedelta(days=7)
    return best, fourth


# ------------------------------------------------------------------- badges
BADGES = [
    ("first_session", "First Blood", "Log your first session"),
    ("streak_7", "Week Warrior", "Reach a 7-day streak"),
    ("marathon", "Marathon", "Log a single session of 3h or more"),
    ("goal_getter", "Goal Getter", "Meet 3 goals"),
    ("completionist", "Completionist", "Mark 5 games as Completed"),
    ("genre_explorer", "Genre Explorer", "Have games from 5 different genres in your library"),
    ("clockwork", "Clockwork", "Play 4+ days a week, 4 weeks in a row"),
    ("streak_30", "Unbreakable", "Reach a 30-day streak"),
]


def badges(sessions: list[dict], games: list[dict], goals_met: int, streak: dict, consistency_best: int, clockwork_date: date | None) -> list[dict]:
    days = sorted(played_days(sessions))
    long_days = sorted(d for d in (session_day(s.get("date")) for s in sessions if _minutes(s) >= 180) if d)
    completed = sum(1 for g in games if g.get("status") == "Completed")
    genres = {str(g.get("genre", "")).strip().lower() for g in games if g.get("genre")}

    facts = {
        "first_session": (len(sessions), 1, days[0] if days else None),
        "streak_7": (streak["longest"], 7, streak["reached"].get(7)),
        "marathon": (len(long_days), 1, long_days[0] if long_days else None),
        "goal_getter": (goals_met, 3, None),
        "completionist": (completed, 5, None),
        "genre_explorer": (len(genres), 5, None),
        "clockwork": (consistency_best, 4, clockwork_date),
        "streak_30": (streak["longest"], 30, streak["reached"].get(30)),
    }
    out = []
    for code, name, description in BADGES:
        progress, target, earned_on = facts[code]
        earned = progress >= target
        out.append({
            "code": code,
            "name": name,
            "description": description,
            "earned": earned,
            "earnedAt": earned_on.isoformat() if earned and earned_on else None,
            "progress": min(progress, target),
            "target": target,
        })
    return out


# --------------------------------------------------------------- challenges
METRICS = ("long_session", "total_minutes", "active_days", "distinct_games", "backlog_minutes")


def challenge_progress(rule: dict, sessions: list[dict]) -> int:
    start, end = date.fromisoformat(rule["startDate"]), date.fromisoformat(rule["endDate"])
    window = [s for s in sessions if (d := session_day(s.get("date"))) and start <= d <= end]
    metric = rule["metric"]
    if metric == "long_session":
        return sum(1 for s in window if _minutes(s) >= rule["minDuration"])
    if metric == "total_minutes":
        return sum(_minutes(s) for s in window)
    if metric == "active_days":
        return len({session_day(s.get("date")) for s in window})
    if metric == "distinct_games":
        return len({str(s.get("game", "")).strip().lower() for s in window})
    if metric == "backlog_minutes":
        titles = {t.lower() for t in rule.get("gameTitles", [])}
        return sum(_minutes(s) for s in window if str(s.get("game", "")).strip().lower() in titles)
    return 0


def describe_rule(rule: dict) -> str:
    """Exact, data-true description. Coach may write the title, never the numbers."""
    metric, target = rule["metric"], rule["target"]
    if metric == "long_session":
        return f"Log {target} session{'s' if target > 1 else ''} of at least {format_minutes(rule['minDuration'])}"
    if metric == "total_minutes":
        return f"Play {format_minutes(target)} in total"
    if metric == "active_days":
        return f"Play on {target} different days"
    if metric == "distinct_games":
        return f"Play {target} different games"
    if metric == "backlog_minutes":
        return f"Play {format_minutes(target)} of a Backlog game ({', '.join(rule.get('gameTitles', [])[:3])})"
    return "Complete the challenge"


DEFAULT_TITLES = {
    "long_session": "Deep Focus",
    "total_minutes": "Push the Pace",
    "active_days": "Steady Hands",
    "distinct_games": "Variety Pack",
    "backlog_minutes": "Backlog Breaker",
}


def suggest_challenge(sessions: list[dict], games: list[dict], active_metrics: set[str], today: date) -> dict | None:
    """Picks the most useful challenge for this player from their last two weeks of data."""
    recent = [s for s in sessions if (d := session_day(s.get("date"))) and today - timedelta(days=13) <= d <= today]
    last_week = [s for s in recent if session_day(s.get("date")) >= today - timedelta(days=6)]
    avg = sum(_minutes(s) for s in recent) / len(recent) if recent else 0
    week_minutes = sum(_minutes(s) for s in last_week)
    week_days = len({session_day(s.get("date")) for s in last_week})
    games_played = len({str(s.get("game", "")).lower() for s in recent})
    backlog = [g.get("title") for g in games if g.get("status") == "Backlog" and g.get("title")]

    candidates: list[tuple[str, dict, int]] = []
    if recent and avg < 45:
        candidates.append(("long_session", {"target": 1, "minDuration": 90}, 120))
    if backlog:
        candidates.append(("backlog_minutes", {"target": 30, "gameTitles": backlog[:5]}, 100))
    if week_days < 4:
        candidates.append(("active_days", {"target": min(7, max(3, week_days + 1))}, 150))
    if games_played <= 1 and len(games) >= 3:
        candidates.append(("distinct_games", {"target": 3}, 120))
    goal = max(120, int(round(week_minutes * 1.1 / 30.0)) * 30)
    candidates.append(("total_minutes", {"target": goal}, 150))
    candidates.append(("long_session", {"target": 1, "minDuration": 120}, 120))

    for metric, params, xp in candidates:
        if metric in active_metrics:
            continue
        rule = {"metric": metric, **params, "startDate": today.isoformat(), "endDate": (today + timedelta(days=6)).isoformat()}
        return {"rule": rule, "xp": xp, "title": DEFAULT_TITLES[metric], "description": describe_rule(rule)}
    return None


def challenge_view(challenge: dict, sessions: list[dict], today: date) -> dict:
    rule = challenge["rule"]
    progress = challenge_progress(rule, sessions)
    completed = progress >= rule["target"]
    status = "completed" if completed else ("expired" if today > date.fromisoformat(rule["endDate"]) else "active")
    return {
        "_id": str(challenge["_id"]),
        "title": challenge["title"],
        "description": challenge.get("description") or describe_rule(rule),
        "flavor": challenge.get("flavor", ""),
        "progress": min(progress, rule["target"]),
        "target": rule["target"],
        "unit": "minutes" if rule["metric"] in ("total_minutes", "backlog_minutes") else "count",
        "xp": challenge["xp"],
        "expiresAt": rule["endDate"],
        "status": status,
    }


# -------------------------------------------------------------------- summary
def build_progression(sessions: list[dict], games: list[dict], goal_views: list[dict], challenge_views: list[dict], today: date, consistency_target: int) -> dict:
    days = played_days(sessions)
    streak = streaks(days, today)
    best_weeks, clockwork_date = consistent_weeks(days, today, 4)
    goals_met = sum(1 for g in goal_views if g["status"] == "met")
    completed_games = [g for g in games if g.get("status") == "Completed"]
    finished_challenges = [c for c in challenge_views if c["status"] == "completed"]

    events = []
    for s in sessions:
        day = session_day(s.get("date"))
        if day:
            events.append({"label": f"Logged {format_minutes(_minutes(s))} of {s.get('game', 'a game')}", "xp": session_xp(_minutes(s)), "date": day.isoformat()})
    xp = sum(e["xp"] for e in events)
    xp += COMPLETED_GAME_XP * len(completed_games) + GOAL_MET_XP * goals_met + sum(c["xp"] for c in finished_challenges)
    for c in finished_challenges:
        events.append({"label": f'Completed "{c["title"]}"', "xp": c["xp"], "date": today.isoformat()})

    level = level_for_xp(xp)
    monday = today - timedelta(days=today.weekday())
    this_week_days = sum(1 for i in range(7) if monday + timedelta(days=i) in days)

    recent = sorted(events, key=lambda e: e["date"], reverse=True)[:6]
    return {
        "level": level,
        "title": level_title(level),
        "xp": xp,
        "levelStartXp": xp_for_level(level),
        "nextLevelXp": xp_for_level(level + 1),
        "streak": {"current": streak["current"], "longest": streak["longest"], "playedToday": streak["playedToday"], "atRisk": streak["atRisk"], "days": last_days(days, today)},
        "consistency": {"daysPlayed": this_week_days, "target": consistency_target},
        "badges": badges(sessions, games, goals_met, streak, best_weeks, clockwork_date),
        "challenges": challenge_views,
        "recentXp": [{**e, "_id": f"xp-{i}"} for i, e in enumerate(recent)],
        "xpRules": {
            "session": f"{SESSION_BASE_XP} XP + 1 per 5 minutes (max {SESSION_MAX_XP})",
            "completedGame": COMPLETED_GAME_XP,
            "goalMet": GOAL_MET_XP,
        },
    }


def daily_minutes(sessions: list[dict]) -> dict[date, int]:
    totals: dict[date, int] = defaultdict(int)
    for s in sessions:
        day = session_day(s.get("date"))
        if day:
            totals[day] += _minutes(s)
    return totals
