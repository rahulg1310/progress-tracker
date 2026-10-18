from datetime import datetime

from bson import ObjectId
from pymongo import DESCENDING, ReturnDocument
from pymongo.asynchronous.database import AsyncDatabase

from app.db import BRIEFINGS, GOALS
from app.repositories.conversations import to_object_id


class GoalRepository:
    def __init__(self, db: AsyncDatabase):
        self._col = db[GOALS]

    async def create(self, user_id: str, doc: dict) -> dict:
        doc = {**doc, "user": ObjectId(user_id)}
        result = await self._col.insert_one(doc)
        doc["_id"] = result.inserted_id
        return doc

    async def list_for_user(self, user_id: str, limit: int = 100) -> list[dict]:
        cursor = self._col.find({"user": ObjectId(user_id)}).sort("createdAt", DESCENDING).limit(limit)
        return await cursor.to_list(length=limit)

    async def delete_owned(self, user_id: str, goal_id: str) -> bool:
        oid = to_object_id(goal_id)
        if oid is None:
            return False
        result = await self._col.delete_one({"_id": oid, "user": ObjectId(user_id)})
        return result.deleted_count == 1


class BriefingRepository:
    def __init__(self, db: AsyncDatabase):
        self._col = db[BRIEFINGS]

    async def get(self, user_id: str, day: str) -> dict | None:
        return await self._col.find_one({"user": ObjectId(user_id), "date": day})

    async def save(self, user_id: str, day: str, fields: dict, now: datetime) -> dict:
        return await self._col.find_one_and_update(
            {"user": ObjectId(user_id), "date": day},
            {"$set": {**fields, "updatedAt": now}, "$setOnInsert": {"createdAt": now}},
            upsert=True,
            return_document=ReturnDocument.AFTER,
        )
