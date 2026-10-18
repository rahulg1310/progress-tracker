"""Conversation and message storage.

Every query filters by the owning user. Methods take the user id from the
verified ServiceContext, never from request data.
"""

from datetime import datetime

from bson import ObjectId
from bson.errors import InvalidId
from pymongo import ASCENDING, DESCENDING, ReturnDocument
from pymongo.asynchronous.database import AsyncDatabase

from app.db import CONVERSATIONS, MESSAGES


def to_object_id(value: str) -> ObjectId | None:
    try:
        return ObjectId(value)
    except (InvalidId, TypeError):
        return None


class ConversationRepository:
    def __init__(self, db: AsyncDatabase):
        self._col = db[CONVERSATIONS]
        self._messages = db[MESSAGES]

    async def create(self, user_id: str, title: str, now: datetime) -> dict:
        doc = {
            "user": ObjectId(user_id),
            "title": title,
            "createdAt": now,
            "updatedAt": now,
            "lastMessageAt": now,
        }
        result = await self._col.insert_one(doc)
        doc["_id"] = result.inserted_id
        return doc

    async def get_owned(self, user_id: str, conversation_id: str) -> dict | None:
        oid = to_object_id(conversation_id)
        if oid is None:
            return None
        return await self._col.find_one({"_id": oid, "user": ObjectId(user_id)})

    async def list_for_user(self, user_id: str, limit: int = 50) -> list[dict]:
        cursor = self._col.find({"user": ObjectId(user_id)}).sort("lastMessageAt", DESCENDING).limit(limit)
        return await cursor.to_list(length=limit)

    async def touch(self, user_id: str, conversation_id: ObjectId, when: datetime) -> dict | None:
        return await self._col.find_one_and_update(
            {"_id": conversation_id, "user": ObjectId(user_id)},
            {"$set": {"lastMessageAt": when, "updatedAt": when}},
            return_document=ReturnDocument.AFTER,
        )

    async def delete_owned(self, user_id: str, conversation_id: str) -> bool:
        oid = to_object_id(conversation_id)
        if oid is None:
            return False
        owner = ObjectId(user_id)
        result = await self._col.delete_one({"_id": oid, "user": owner})
        if result.deleted_count == 0:
            return False
        await self._messages.delete_many({"conversation": oid, "user": owner})
        return True


class MessageRepository:
    def __init__(self, db: AsyncDatabase):
        self._col = db[MESSAGES]

    async def add(self, user_id: str, conversation_id: ObjectId, role: str, text: str, now: datetime) -> dict:
        doc = {
            "conversation": conversation_id,
            "user": ObjectId(user_id),
            "role": role,
            "text": text,
            "createdAt": now,
        }
        result = await self._col.insert_one(doc)
        doc["_id"] = result.inserted_id
        return doc

    async def recent(self, user_id: str, conversation_id: ObjectId, limit: int) -> list[dict]:
        """Newest `limit` messages, returned oldest-first for the model."""
        cursor = (
            self._col.find({"conversation": conversation_id, "user": ObjectId(user_id)})
            .sort([("createdAt", DESCENDING), ("_id", DESCENDING)])
            .limit(limit)
        )
        docs = await cursor.to_list(length=limit)
        docs.reverse()
        return docs

    async def list_for_conversation(self, user_id: str, conversation_id: ObjectId, limit: int = 200) -> list[dict]:
        cursor = (
            self._col.find({"conversation": conversation_id, "user": ObjectId(user_id)})
            .sort([("createdAt", ASCENDING), ("_id", ASCENDING)])
            .limit(limit)
        )
        return await cursor.to_list(length=limit)
