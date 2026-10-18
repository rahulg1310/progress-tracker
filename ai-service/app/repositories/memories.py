"""Long-term facts Coach remembers about a player (preferences, struggles, goals).

Phase 2 reads and deletes them; Phase 3 adds the tool that saves new ones.
"""

from datetime import datetime

from bson import ObjectId
from pymongo import DESCENDING
from pymongo.asynchronous.database import AsyncDatabase

from app.db import MEMORIES
from app.repositories.conversations import to_object_id

MEMORY_KINDS = ("preference", "context", "struggle", "goal")


class MemoryRepository:
    def __init__(self, db: AsyncDatabase):
        self._col = db[MEMORIES]

    async def list_for_user(self, user_id: str, limit: int = 50) -> list[dict]:
        cursor = self._col.find({"user": ObjectId(user_id)}).sort("createdAt", DESCENDING).limit(limit)
        return await cursor.to_list(length=limit)

    async def add(self, user_id: str, kind: str, text: str, now: datetime) -> dict:
        doc = {"user": ObjectId(user_id), "kind": kind, "text": text, "createdAt": now}
        result = await self._col.insert_one(doc)
        doc["_id"] = result.inserted_id
        return doc

    async def delete_owned(self, user_id: str, memory_id: str) -> bool:
        oid = to_object_id(memory_id)
        if oid is None:
            return False
        result = await self._col.delete_one({"_id": oid, "user": ObjectId(user_id)})
        return result.deleted_count == 1
