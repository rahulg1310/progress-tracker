"""Read-only access to the collections Express owns (games, sessions).

Every query is scoped to the user id from the verified service token.
"""

from datetime import date, timedelta

from bson import ObjectId
from pymongo import DESCENDING
from pymongo.asynchronous.database import AsyncDatabase

from app.db import GAMES, SESSIONS
from app.domain.timeutil import day_start_utc
from app.repositories.conversations import to_object_id

MAX_GAMES = 500
MAX_SESSIONS = 2000


class GameRepository:
    def __init__(self, db: AsyncDatabase):
        self._col = db[GAMES]

    async def list_for_user(self, user_id: str) -> list[dict]:
        cursor = self._col.find({"user": ObjectId(user_id)}).sort("createdAt", DESCENDING).limit(MAX_GAMES)
        return await cursor.to_list(length=MAX_GAMES)

    async def get_owned(self, user_id: str, game_id: str) -> dict | None:
        oid = to_object_id(game_id)
        if oid is None:
            return None
        return await self._col.find_one({"_id": oid, "user": ObjectId(user_id)})


class SessionRepository:
    def __init__(self, db: AsyncDatabase):
        self._col = db[SESSIONS]

    async def list_between(self, user_id: str, start: date | None, end: date | None) -> list[dict]:
        """Sessions whose calendar day is within [start, end] (inclusive), newest first."""
        query: dict = {"user": ObjectId(user_id)}
        date_filter = {}
        if start is not None:
            date_filter["$gte"] = day_start_utc(start)
        if end is not None:
            date_filter["$lt"] = day_start_utc(end + timedelta(days=1))
        if date_filter:
            query["date"] = date_filter
        cursor = self._col.find(query).sort([("date", DESCENDING), ("createdAt", DESCENDING)]).limit(MAX_SESSIONS)
        return await cursor.to_list(length=MAX_SESSIONS)

    async def get_owned(self, user_id: str, session_id: str) -> dict | None:
        oid = to_object_id(session_id)
        if oid is None:
            return None
        return await self._col.find_one({"_id": oid, "user": ObjectId(user_id)})
