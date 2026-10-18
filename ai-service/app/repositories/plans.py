from datetime import datetime

from bson import ObjectId
from pymongo import DESCENDING
from pymongo.asynchronous.database import AsyncDatabase

from app.db import PLANS
from app.repositories.conversations import to_object_id

MAX_PLANS = 20


class PlanRepository:
    def __init__(self, db: AsyncDatabase):
        self._col = db[PLANS]

    async def create(self, user_id: str, doc: dict) -> dict:
        doc = {**doc, "user": ObjectId(user_id)}
        result = await self._col.insert_one(doc)
        doc["_id"] = result.inserted_id
        return doc

    async def list_for_user(self, user_id: str) -> list[dict]:
        cursor = self._col.find({"user": ObjectId(user_id)}).sort("createdAt", DESCENDING).limit(MAX_PLANS)
        return await cursor.to_list(length=MAX_PLANS)

    async def count_for_user(self, user_id: str) -> int:
        return await self._col.count_documents({"user": ObjectId(user_id)})

    async def get_owned(self, user_id: str, plan_id: str) -> dict | None:
        oid = to_object_id(plan_id)
        if oid is None:
            return None
        return await self._col.find_one({"_id": oid, "user": ObjectId(user_id)})

    async def replace_schedule(self, user_id: str, plan: dict, now: datetime) -> None:
        await self._col.update_one(
            {"_id": plan["_id"], "user": ObjectId(user_id)},
            {"$set": {
                "schedule": plan["schedule"],
                "dailyMinutes": plan["dailyMinutes"],
                "adjustmentNote": plan["adjustmentNote"],
                "version": plan["version"],
                "updatedAt": now,
            }},
        )

    async def delete_owned(self, user_id: str, plan_id: str) -> bool:
        oid = to_object_id(plan_id)
        if oid is None:
            return False
        result = await self._col.delete_one({"_id": oid, "user": ObjectId(user_id)})
        return result.deleted_count == 1
