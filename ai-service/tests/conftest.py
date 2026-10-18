import hashlib
import json
import os
import time
import uuid

# Test configuration must exist before the app (and its Settings) are imported.
os.environ.update(
    {
        "ENVIRONMENT": "test",
        "SERVICE_AUTH_SECRET": "test-secret-that-is-at-least-32-characters-long",
        "MONGO_URI": "mongodb://127.0.0.1:27017",
        "MONGO_DB_NAME": "kairo_test",
        "GEMINI_API_KEY": "",
        "MAX_HISTORY_MESSAGES": "6",
    }
)

import jwt  # noqa: E402
import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.deps import (  # noqa: E402
    get_action_repo, get_briefing_repo, get_conversation_repo, get_core_api, get_db,
    get_game_repo, get_goal_repo, get_llm, get_memory_repo, get_message_repo, get_plan_repo, get_rawg, get_session_repo,
)
from app.main import create_app  # noqa: E402
from tests.fakes import (  # noqa: E402
    FakeActionRepo, FakeBriefingRepo, FakeConversationRepo, FakeCore, FakeDb, FakeGameRepo,
    FakeGoalRepo, FakeLlm, FakeMemoryRepo, FakeMessageRepo, FakePlanRepo, FakeRawg, FakeSessionRepo, FakeStore,
)

SECRET = os.environ["SERVICE_AUTH_SECRET"]
USER_A = "64b7f0c2a1b2c3d4e5f60718"
USER_B = "64b7f0c2a1b2c3d4e5f60719"


def sign(user_id: str, raw_body: bytes = b"", secret: str = SECRET, **overrides) -> str:
    """Builds a token exactly the way backend/services/aiClient.js does.

    Pass a claim as None to leave it out.
    """
    now = int(time.time())
    claims = {
        "sub": user_id,
        "aud": "kairo-ai",
        "iss": "kairo-core",
        "iat": now,
        "exp": now + 60,
        "jti": str(uuid.uuid4()),
        "bh": hashlib.sha256(raw_body).hexdigest(),
    }
    claims.update(overrides)
    claims = {k: v for k, v in claims.items() if v is not None}
    return jwt.encode(claims, secret, algorithm="HS256")


class Api:
    """Small helper: sends JSON bodies byte-for-byte as signed."""

    def __init__(self, client: TestClient):
        self.client = client

    def request(self, method: str, path: str, user_id: str = USER_A, body: dict | None = None, token: str | None = None, headers: dict | None = None):
        raw = json.dumps(body, separators=(",", ":")).encode() if body is not None else b""
        hdrs = {"Authorization": f"Bearer {token or sign(user_id, raw)}", "X-Timezone": "Asia/Kolkata"}
        if body is not None:
            hdrs["Content-Type"] = "application/json"
        hdrs.update(headers or {})
        return self.client.request(method, path, content=raw, headers=hdrs)


@pytest.fixture
def store():
    return FakeStore()


@pytest.fixture
def llm():
    return FakeLlm()


@pytest.fixture
def db():
    return FakeDb()


@pytest.fixture
def core(store):
    return FakeCore(store)


@pytest.fixture
def rawg():
    return FakeRawg()


@pytest.fixture
def app(store, llm, db, core, rawg):
    application = create_app()
    overrides = {
        get_conversation_repo: lambda: FakeConversationRepo(store),
        get_message_repo: lambda: FakeMessageRepo(store),
        get_memory_repo: lambda: FakeMemoryRepo(store),
        get_game_repo: lambda: FakeGameRepo(store),
        get_session_repo: lambda: FakeSessionRepo(store),
        get_action_repo: lambda: FakeActionRepo(store),
        get_plan_repo: lambda: FakePlanRepo(store),
        get_core_api: lambda: core,
        get_goal_repo: lambda: FakeGoalRepo(store),
        get_briefing_repo: lambda: FakeBriefingRepo(store),
        get_rawg: lambda: rawg,
        get_llm: lambda: llm,
        get_db: lambda: db,
    }
    application.dependency_overrides.update(overrides)
    return application


@pytest.fixture
def api(app):
    # No "with" block: lifespan (real MongoDB + Gemini) is skipped in unit tests.
    return Api(TestClient(app, raise_server_exceptions=False))
