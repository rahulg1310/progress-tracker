"""In-memory stand-ins so unit tests need neither MongoDB, Express nor a Gemini key."""

from datetime import date, datetime, time, timedelta, timezone

from bson import ObjectId

from app.clients.core_api import CoreApiError
from app.llm.gemini_client import ChatTurn, LlmError, ModelStep, ToolCall


def _oid(value):
    try:
        return ObjectId(value)
    except Exception:
        return None


class FakeStore:
    def __init__(self):
        self.conversations: list[dict] = []
        self.messages: list[dict] = []
        self.memories: list[dict] = []
        self.games: list[dict] = []
        self.sessions: list[dict] = []
        self.actions: list[dict] = []
        self.plans: list[dict] = []

    # helpers for tests
    def add_game(self, user_id, title, **fields):
        doc = {"_id": ObjectId(), "user": ObjectId(user_id), "title": title, "genre": "RPG", "platform": "PC", "status": "Playing",
               "progress": 0, "playtime": 0, "rating": 0, "achievementsEarned": 0, "totalAchievements": 0, "notes": "",
               "colorAccent": "#ffffff", "createdAt": datetime.now(timezone.utc), **fields}
        self.games.append(doc)
        return doc

    def add_session(self, user_id, game, minutes, day: str, **fields):
        doc = {"_id": ObjectId(), "user": ObjectId(user_id), "game": game, "duration": minutes,
               "date": datetime.fromisoformat(day).replace(tzinfo=timezone.utc), "createdAt": datetime.now(timezone.utc), **fields}
        self.sessions.append(doc)
        return doc


class FakeConversationRepo:
    def __init__(self, store: FakeStore):
        self.store = store

    async def create(self, user_id, title, now):
        doc = {"_id": ObjectId(), "user": ObjectId(user_id), "title": title, "createdAt": now, "updatedAt": now, "lastMessageAt": now}
        self.store.conversations.append(doc)
        return doc

    async def get_owned(self, user_id, conversation_id):
        oid = _oid(conversation_id)
        return next((c for c in self.store.conversations if c["_id"] == oid and c["user"] == ObjectId(user_id)), None)

    async def list_for_user(self, user_id, limit=50):
        docs = [c for c in self.store.conversations if c["user"] == ObjectId(user_id)]
        return sorted(docs, key=lambda c: c["lastMessageAt"], reverse=True)[:limit]

    async def touch(self, user_id, conversation_id, when):
        for c in self.store.conversations:
            if c["_id"] == conversation_id and c["user"] == ObjectId(user_id):
                c["lastMessageAt"] = when
                return c
        return None

    async def delete_owned(self, user_id, conversation_id):
        conv = await self.get_owned(user_id, conversation_id)
        if conv is None:
            return False
        self.store.conversations.remove(conv)
        self.store.messages = [m for m in self.store.messages if m["conversation"] != conv["_id"]]
        return True


class FakeMessageRepo:
    def __init__(self, store: FakeStore):
        self.store = store

    async def add(self, user_id, conversation_id, role, text, now, actions=None, stats=None):
        doc = {"_id": ObjectId(), "conversation": conversation_id, "user": ObjectId(user_id), "role": role, "text": text, "createdAt": now}
        if actions:
            doc["actions"] = actions
        if stats:
            doc["stats"] = stats
        self.store.messages.append(doc)
        return doc

    async def set_action_status(self, user_id, message_id, action_id, status):
        for m in self.store.messages:
            if m["_id"] == message_id and m["user"] == ObjectId(user_id):
                m["actions"] = [{**a, "status": status} if a["_id"] == action_id else a for a in m.get("actions", [])]

    async def recent(self, user_id, conversation_id, limit):
        docs = [m for m in self.store.messages if m["conversation"] == conversation_id and m["user"] == ObjectId(user_id)]
        return docs[-limit:]

    async def list_for_conversation(self, user_id, conversation_id, limit=200):
        docs = [m for m in self.store.messages if m["conversation"] == conversation_id and m["user"] == ObjectId(user_id)]
        return docs[:limit]


class FakeMemoryRepo:
    def __init__(self, store: FakeStore):
        self.store = store

    async def list_for_user(self, user_id, limit=50):
        return [m for m in self.store.memories if m["user"] == ObjectId(user_id)][:limit]

    async def add(self, user_id, kind, text, now):
        doc = {"_id": ObjectId(), "user": ObjectId(user_id), "kind": kind, "text": text, "createdAt": now}
        self.store.memories.append(doc)
        return doc

    async def delete_owned(self, user_id, memory_id):
        oid = _oid(memory_id)
        for m in self.store.memories:
            if m["_id"] == oid and m["user"] == ObjectId(user_id):
                self.store.memories.remove(m)
                return True
        return False


class FakeGameRepo:
    def __init__(self, store: FakeStore):
        self.store = store

    async def list_for_user(self, user_id):
        return [g for g in self.store.games if g["user"] == ObjectId(user_id)]

    async def get_owned(self, user_id, game_id):
        oid = _oid(game_id)
        return next((g for g in self.store.games if g["_id"] == oid and g["user"] == ObjectId(user_id)), None)


class FakeSessionRepo:
    def __init__(self, store: FakeStore):
        self.store = store

    async def list_between(self, user_id, start, end):
        out = []
        for s in self.store.sessions:
            if s["user"] != ObjectId(user_id):
                continue
            day = s["date"].date()
            if (start is None or day >= start) and (end is None or day <= end):
                out.append(s)
        return sorted(out, key=lambda s: s["date"], reverse=True)

    async def get_owned(self, user_id, session_id):
        oid = _oid(session_id)
        return next((s for s in self.store.sessions if s["_id"] == oid and s["user"] == ObjectId(user_id)), None)


class FakeActionRepo:
    def __init__(self, store: FakeStore):
        self.store = store

    async def create(self, user_id, doc):
        doc = {**doc, "_id": ObjectId(), "user": ObjectId(user_id)}
        self.store.actions.append(doc)
        return doc

    async def get_owned(self, user_id, action_id):
        oid = _oid(action_id)
        return next((a for a in self.store.actions if a["_id"] == oid and a["user"] == ObjectId(user_id)), None)

    async def claim(self, user_id, action_id, from_status, to_status, now, deadline_field):
        action = await self.get_owned(user_id, action_id)
        if action is None or action["status"] != from_status:
            return None
        if deadline_field and not (action.get(deadline_field) and action[deadline_field] > now):
            return None
        action["status"] = to_status
        return dict(action)

    async def finish(self, user_id, action_id, status, now, result=None):
        for a in self.store.actions:
            if a["_id"] == action_id and a["user"] == ObjectId(user_id):
                a["status"] = status
                if result is not None:
                    a["result"] = result

    async def attach(self, user_id, action_ids, conversation_id, message_id):
        for a in self.store.actions:
            if a["_id"] in action_ids and a["user"] == ObjectId(user_id):
                a["conversation"], a["message"] = conversation_id, message_id


class FakePlanRepo:
    def __init__(self, store: FakeStore):
        self.store = store

    async def create(self, user_id, doc):
        doc = {**doc, "_id": ObjectId(), "user": ObjectId(user_id)}
        self.store.plans.append(doc)
        return doc

    async def list_for_user(self, user_id):
        return [p for p in self.store.plans if p["user"] == ObjectId(user_id)]

    async def count_for_user(self, user_id):
        return len(await self.list_for_user(user_id))

    async def get_owned(self, user_id, plan_id):
        oid = _oid(plan_id)
        return next((p for p in self.store.plans if p["_id"] == oid and p["user"] == ObjectId(user_id)), None)

    async def replace_schedule(self, user_id, plan, now):
        stored = await self.get_owned(user_id, str(plan["_id"]))
        stored.update({k: plan[k] for k in ("schedule", "dailyMinutes", "adjustmentNote", "version")})

    async def delete_owned(self, user_id, plan_id):
        plan = await self.get_owned(user_id, plan_id)
        if plan is None:
            return False
        self.store.plans.remove(plan)
        return True


class FakeCore:
    """Behaves like Express /internal: checks ownership and writes to the fake store."""

    def __init__(self, store: FakeStore):
        self.store = store
        self.calls: list[tuple] = []
        self.fail_with: CoreApiError | None = None

    def _check(self):
        if self.fail_with:
            raise self.fail_with

    async def create_session(self, user_id, session, add_playtime_game_id):
        self.calls.append(("create_session", user_id, session, add_playtime_game_id))
        self._check()
        game = None
        if add_playtime_game_id:
            game = next((g for g in self.store.games if str(g["_id"]) == add_playtime_game_id and g["user"] == ObjectId(user_id)), None)
            if game is None:
                raise CoreApiError(404, "Game not found")
        doc = self.store.add_session(user_id, session["game"], session["duration"], session["date"])
        if game:
            game["playtime"] = round(game["playtime"] + session["duration"] / 60, 2)
        return {"success": True, "session": {"_id": str(doc["_id"]), "game": doc["game"], "duration": doc["duration"], "date": session["date"]},
                "game": {"_id": str(game["_id"]), "playtime": game["playtime"]} if game else None}

    async def delete_session(self, user_id, session_id, revert_playtime=None):
        self.calls.append(("delete_session", user_id, session_id, revert_playtime))
        self._check()
        doc = next((s for s in self.store.sessions if str(s["_id"]) == session_id and s["user"] == ObjectId(user_id)), None)
        if doc is None:
            raise CoreApiError(404, "Session not found")
        self.store.sessions.remove(doc)
        game = None
        if revert_playtime:
            game = next((g for g in self.store.games if str(g["_id"]) == revert_playtime["gameId"] and g["user"] == ObjectId(user_id)), None)
            if game:
                game["playtime"] = max(0, round(game["playtime"] - revert_playtime["hours"], 2))
        return {"success": True, "game": {"_id": str(game["_id"]), "playtime": game["playtime"]} if game else None}

    async def update_game(self, user_id, game_id, changes):
        self.calls.append(("update_game", user_id, game_id, changes))
        self._check()
        game = next((g for g in self.store.games if str(g["_id"]) == game_id and g["user"] == ObjectId(user_id)), None)
        if game is None:
            raise CoreApiError(404, "Game not found")
        game.update(changes)
        return {"success": True, "game": {"_id": game_id, **changes}}

    async def close(self):
        pass


class FakeLlm:
    """Scripted model. Queue items:
    - "text"                         -> final answer
    - [("tool_name", {args}), ...]   -> tool calls
    - LlmError(...)                  -> raised
    Records every transcript so tests can inspect tool results.
    """

    def __init__(self):
        self.queue: list = []
        self.calls: list[dict] = []
        self.configured = True

    @property
    def is_configured(self):
        return self.configured

    @property
    def model(self):
        return "fake-model"

    def new_transcript(self, history: list[ChatTurn], user_message: str) -> list:
        return [{"role": t.role, "text": t.text} for t in history] + [{"role": "user", "text": user_message}]

    async def step(self, *, system_prompt, transcript, tools, allow_tools=True, start_model=None):
        self.calls.append({"system_prompt": system_prompt, "transcript": list(transcript), "allow_tools": allow_tools, "tools": [t.name for t in tools]})
        item = self.queue.pop(0) if self.queue else f"Echo: {transcript[-1].get('text', '')}"
        if isinstance(item, LlmError):
            raise item
        if isinstance(item, list):
            calls = [ToolCall(id=f"call-{i}", name=name, args=args) for i, (name, args) in enumerate(item)]
            return ModelStep(text="", calls=calls, model="fake-model", content={"role": "model", "calls": item})
        return ModelStep(text=item, calls=[], model="fake-model", content={"role": "model", "text": item})

    def add_tool_results(self, transcript, step, results):
        transcript.append(step.content)
        transcript.append({"role": "tool", "results": [(call.name, result) for call, result in results]})

    def tool_results(self) -> list[tuple[str, dict]]:
        """All tool results seen in the latest transcript."""
        out = []
        for entry in self.calls[-1]["transcript"]:
            if entry.get("role") == "tool":
                out.extend(entry["results"])
        return out


class FakeDb:
    def __init__(self, healthy: bool = True):
        self.healthy = healthy

    async def command(self, name):
        if not self.healthy:
            raise ConnectionError("down")
        return {"ok": 1}


class FakeGoalRepo:
    def __init__(self, store: FakeStore):
        self.store = store
        if not hasattr(store, "goals"):
            store.goals = []

    async def create(self, user_id, doc):
        doc = {**doc, "_id": ObjectId(), "user": ObjectId(user_id)}
        self.store.goals.append(doc)
        return doc

    async def list_for_user(self, user_id, limit=100):
        return [g for g in self.store.goals if g["user"] == ObjectId(user_id)][:limit]

    async def delete_owned(self, user_id, goal_id):
        oid = _oid(goal_id)
        for g in self.store.goals:
            if g["_id"] == oid and g["user"] == ObjectId(user_id):
                self.store.goals.remove(g)
                return True
        return False


class FakeBriefingRepo:
    def __init__(self, store: FakeStore):
        self.store = store
        if not hasattr(store, "briefings"):
            store.briefings = {}

    async def get(self, user_id, day):
        return self.store.briefings.get((user_id, day))

    async def save(self, user_id, day, fields, now):
        current = self.store.briefings.get((user_id, day), {})
        current.update(fields)
        self.store.briefings[(user_id, day)] = current
        return current


class FakeRawg:
    def __init__(self):
        self.games: dict[str, dict] = {}
        self.catalog: list[dict] = []
        self.configured = True
        self.calls: list[tuple] = []

    @property
    def is_configured(self):
        return self.configured

    async def find_game(self, title):
        from app.clients.rawg import RawgError

        self.calls.append(("find", title))
        if not self.configured:
            raise RawgError("Game discovery isn't set up yet.")
        return self.games.get(title.lower())

    async def discover(self, *, genres=None, tags=None, parent_platforms=None):
        self.calls.append(("discover", tuple(genres or ()), tuple(tags or ()), parent_platforms))
        return list(self.catalog)

    async def close(self):
        pass
