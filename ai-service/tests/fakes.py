"""In-memory stand-ins so unit tests need neither MongoDB nor a Gemini key."""

from bson import ObjectId

from app.llm.gemini_client import ChatTurn, LlmError, LlmReply


class FakeStore:
    def __init__(self):
        self.conversations: list[dict] = []
        self.messages: list[dict] = []
        self.memories: list[dict] = []


def _oid(value):
    try:
        return ObjectId(value)
    except Exception:
        return None


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

    async def add(self, user_id, conversation_id, role, text, now):
        doc = {"_id": ObjectId(), "conversation": conversation_id, "user": ObjectId(user_id), "role": role, "text": text, "createdAt": now}
        self.store.messages.append(doc)
        return doc

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


class FakeLlm:
    """Records every call; returns queued replies or raises a queued LlmError."""

    def __init__(self):
        self.calls: list[dict] = []
        self.queue: list = []
        self.configured = True

    @property
    def is_configured(self):
        return self.configured

    @property
    def model(self):
        return "fake-model"

    async def generate(self, *, system_prompt: str, history: list[ChatTurn], user_message: str) -> LlmReply:
        self.calls.append({"system_prompt": system_prompt, "history": history, "user_message": user_message})
        item = self.queue.pop(0) if self.queue else f"Echo: {user_message}"
        if isinstance(item, LlmError):
            raise item
        return LlmReply(text=item, model="fake-model")


class FakeDb:
    def __init__(self, healthy: bool = True):
        self.healthy = healthy

    async def command(self, name):
        if not self.healthy:
            raise ConnectionError("down")
        return {"ok": 1}
