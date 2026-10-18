"""Runs the real repositories against a real MongoDB.

Skipped unless TEST_MONGO_URI is set. Use a throwaway database, never production:
  $env:TEST_MONGO_URI="mongodb://127.0.0.1:27017"; pytest -m mongo
"""

import os
import uuid
from datetime import datetime, timedelta, timezone

import pytest
from pymongo import AsyncMongoClient

from app.db import ensure_indexes
from app.repositories.conversations import ConversationRepository, MessageRepository
from app.repositories.memories import MemoryRepository
from tests.conftest import USER_A, USER_B

pytestmark = [
    pytest.mark.mongo,
    pytest.mark.skipif(not os.environ.get("TEST_MONGO_URI"), reason="TEST_MONGO_URI not set"),
]


@pytest.fixture
async def db():
    client = AsyncMongoClient(os.environ["TEST_MONGO_URI"], tz_aware=True)
    name = f"kairo_test_{uuid.uuid4().hex[:8]}"
    database = client[name]
    await ensure_indexes(database)
    yield database
    await client.drop_database(name)
    await client.close()


async def test_conversation_lifecycle_and_isolation(db):
    convs, msgs = ConversationRepository(db), MessageRepository(db)
    t0 = datetime.now(timezone.utc)
    conv = await convs.create(USER_A, "Boss help", t0)
    cid = str(conv["_id"])

    for i in range(5):
        await msgs.add(USER_A, conv["_id"], "user" if i % 2 == 0 else "assistant", f"m{i}", t0 + timedelta(seconds=i))

    recent = await msgs.recent(USER_A, conv["_id"], 3)
    assert [m["text"] for m in recent] == ["m2", "m3", "m4"]
    assert [m["text"] for m in await msgs.list_for_conversation(USER_A, conv["_id"])] == ["m0", "m1", "m2", "m3", "m4"]

    assert await convs.get_owned(USER_B, cid) is None
    assert await msgs.recent(USER_B, conv["_id"], 10) == []
    assert await convs.get_owned(USER_A, "garbage") is None

    later = t0 + timedelta(minutes=5)
    touched = await convs.touch(USER_A, conv["_id"], later)
    assert touched["lastMessageAt"].replace(microsecond=0) == later.replace(microsecond=0)
    assert await convs.touch(USER_B, conv["_id"], later) is None

    second = await convs.create(USER_A, "Newer", later + timedelta(minutes=1))
    assert [c["title"] for c in await convs.list_for_user(USER_A)] == ["Newer", "Boss help"]
    assert await convs.list_for_user(USER_B) == []

    assert await convs.delete_owned(USER_B, cid) is False
    assert await convs.delete_owned(USER_A, cid) is True
    assert await msgs.list_for_conversation(USER_A, conv["_id"]) == []
    assert await convs.get_owned(USER_A, str(second["_id"])) is not None


async def test_memories_isolation(db):
    repo = MemoryRepository(db)
    mem = await repo.add(USER_A, "preference", "Likes parry games", datetime.now(timezone.utc))
    assert len(await repo.list_for_user(USER_A)) == 1
    assert await repo.list_for_user(USER_B) == []
    assert await repo.delete_owned(USER_B, str(mem["_id"])) is False
    assert await repo.delete_owned(USER_A, "nope") is False
    assert await repo.delete_owned(USER_A, str(mem["_id"])) is True
