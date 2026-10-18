import logging

from pymongo import ASCENDING, DESCENDING, AsyncMongoClient
from pymongo.asynchronous.database import AsyncDatabase

from app.config import Settings

logger = logging.getLogger("kairo.db")

# Collections owned by the AI service. Existing collections (users, games,
# sessions) belong to Express and are only ever READ here (from Phase 3).
CONVERSATIONS = "ai_conversations"
MESSAGES = "ai_messages"
MEMORIES = "ai_memories"
ACTIONS = "ai_actions"
PLANS = "ai_plans"
GOALS = "ai_goals"
BRIEFINGS = "ai_briefings"

# Owned by Express (Mongoose models Game and Session). Read-only here.
GAMES = "games"
SESSIONS = "sessions"


def create_client(settings: Settings) -> AsyncMongoClient:
    return AsyncMongoClient(
        settings.mongo_uri,
        tz_aware=True,
        serverSelectionTimeoutMS=8000,
        appname="kairo-ai-service",
    )


async def ensure_indexes(db: AsyncDatabase) -> None:
    await db[CONVERSATIONS].create_index([("user", ASCENDING), ("lastMessageAt", DESCENDING)])
    await db[MESSAGES].create_index([("conversation", ASCENDING), ("createdAt", ASCENDING)])
    await db[MESSAGES].create_index([("user", ASCENDING)])
    await db[MEMORIES].create_index([("user", ASCENDING), ("createdAt", DESCENDING)])
    await db[ACTIONS].create_index([("user", ASCENDING), ("createdAt", DESCENDING)])
    await db[PLANS].create_index([("user", ASCENDING), ("createdAt", DESCENDING)])
    await db[GOALS].create_index([("user", ASCENDING), ("endDate", DESCENDING)])
    await db[BRIEFINGS].create_index([("user", ASCENDING), ("date", ASCENDING)], unique=True)
    logger.info("MongoDB indexes ensured")
