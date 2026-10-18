"""Agent actions: executed writes that can be undone, and pending writes awaiting Confirm.

Status flow:
  log_session:            done -> executing -> undone
  update_game / delete:   pending -> executing -> confirmed | failed
                          pending -> cancelled
"""

from datetime import datetime

from bson import ObjectId
from pymongo import ReturnDocument
from pymongo.asynchronous.database import AsyncDatabase

from app.db import ACTIONS
from app.repositories.conversations import to_object_id


class ActionRepository:
    def __init__(self, db: AsyncDatabase):
        self._col = db[ACTIONS]

    async def create(self, user_id: str, doc: dict) -> dict:
        doc = {**doc, "user": ObjectId(user_id)}
        result = await self._col.insert_one(doc)
        doc["_id"] = result.inserted_id
        return doc

    async def get_owned(self, user_id: str, action_id: str) -> dict | None:
        oid = to_object_id(action_id)
        if oid is None:
            return None
        return await self._col.find_one({"_id": oid, "user": ObjectId(user_id)})

    async def claim(self, user_id: str, action_id: str, from_status: str, to_status: str, now: datetime, deadline_field: str | None) -> dict | None:
        """Atomically moves an action between statuses so it can only run once."""
        oid = to_object_id(action_id)
        if oid is None:
            return None
        query: dict = {"_id": oid, "user": ObjectId(user_id), "status": from_status}
        if deadline_field:
            query[deadline_field] = {"$gt": now}
        return await self._col.find_one_and_update(
            query, {"$set": {"status": to_status, "updatedAt": now}}, return_document=ReturnDocument.AFTER
        )

    async def finish(self, user_id: str, action_id: ObjectId, status: str, now: datetime, result: dict | None = None) -> None:
        update = {"status": status, "updatedAt": now}
        if result is not None:
            update["result"] = result
        await self._col.update_one({"_id": action_id, "user": ObjectId(user_id)}, {"$set": update})

    async def attach(self, user_id: str, action_ids: list[ObjectId], conversation_id: ObjectId, message_id: ObjectId) -> None:
        if action_ids:
            await self._col.update_many(
                {"_id": {"$in": action_ids}, "user": ObjectId(user_id)},
                {"$set": {"conversation": conversation_id, "message": message_id}},
            )
