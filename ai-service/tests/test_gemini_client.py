"""GeminiClient retry/fallback behaviour, with the SDK call replaced (no network, no key needed)."""

from types import SimpleNamespace

import httpx
import pytest
from google.genai import errors

from app.config import Settings
from app.llm.gemini_client import BLOCKED_REPLY, ChatTurn, GeminiClient, LlmError, to_contents


def make_client(monkeypatch, outcomes):
    settings = Settings(
        service_auth_secret="x" * 32, mongo_uri="mongodb://x", mongo_db_name="t",
        gemini_api_key="fake-key", gemini_model="primary", gemini_fallback_model="fallback",
    )
    client = GeminiClient(settings)
    calls = []

    async def fake_generate(model, contents, config):
        calls.append(model)
        outcome = outcomes.pop(0)
        if isinstance(outcome, Exception):
            raise outcome
        return outcome

    monkeypatch.setattr(client._client.aio.models, "generate_content", fake_generate)
    monkeypatch.setattr("app.llm.gemini_client.asyncio.sleep", _no_sleep)
    return client, calls


async def _no_sleep(_):
    return None


def api_error(code, status):
    return errors.APIError(code, {"error": {"code": code, "status": status, "message": status}})


def ok(text="Hello!"):
    return SimpleNamespace(text=text, candidates=[], usage_metadata=SimpleNamespace(prompt_token_count=10, candidates_token_count=5))


async def generate(client):
    return await client.generate(system_prompt="sys", history=[ChatTurn("user", "a"), ChatTurn("assistant", "b")], user_message="c")


async def test_success_returns_text_and_usage(monkeypatch):
    client, calls = make_client(monkeypatch, [ok("Parry!")])
    reply = await generate(client)
    assert reply.text == "Parry!" and reply.model == "primary" and reply.input_tokens == 10
    assert calls == ["primary"]


async def test_transient_error_retries_same_model(monkeypatch):
    client, calls = make_client(monkeypatch, [api_error(503, "UNAVAILABLE"), ok()])
    assert (await generate(client)).model == "primary"
    assert calls == ["primary", "primary"]


async def test_quota_error_falls_back_to_second_model(monkeypatch):
    client, calls = make_client(monkeypatch, [api_error(429, "RESOURCE_EXHAUSTED"), ok()])
    assert (await generate(client)).model == "fallback"
    assert calls == ["primary", "fallback"]


async def test_quota_on_both_models_gives_friendly_error(monkeypatch):
    client, _ = make_client(monkeypatch, [api_error(429, "RESOURCE_EXHAUSTED"), api_error(429, "RESOURCE_EXHAUSTED")])
    with pytest.raises(LlmError) as exc:
        await generate(client)
    assert exc.value.code == "AI_QUOTA_EXCEEDED" and exc.value.status_code == 503


async def test_bad_key_is_config_error_without_retry(monkeypatch):
    client, calls = make_client(monkeypatch, [api_error(400, "INVALID_ARGUMENT")])
    with pytest.raises(LlmError) as exc:
        await generate(client)
    assert exc.value.code == "AI_CONFIG_ERROR"
    assert calls == ["primary"]


async def test_timeouts_then_unavailable(monkeypatch):
    timeout = httpx.ReadTimeout("slow")
    client, calls = make_client(monkeypatch, [timeout, timeout, timeout, timeout])
    with pytest.raises(LlmError) as exc:
        await generate(client)
    assert exc.value.code == "AI_UNAVAILABLE"
    assert calls == ["primary", "primary", "fallback", "fallback"]


async def test_empty_reply_becomes_safe_message(monkeypatch):
    client, _ = make_client(monkeypatch, [SimpleNamespace(text=None, candidates=[SimpleNamespace(finish_reason="SAFETY")], usage_metadata=None)])
    assert (await generate(client)).text == BLOCKED_REPLY


async def test_missing_key_is_reported():
    settings = Settings(service_auth_secret="x" * 32, mongo_uri="mongodb://x", mongo_db_name="t", gemini_api_key="")
    client = GeminiClient(settings)
    assert client.is_configured is False
    with pytest.raises(LlmError) as exc:
        await generate(client)
    assert exc.value.code == "AI_NOT_CONFIGURED"


def test_history_roles_map_to_gemini_roles():
    contents = to_contents([ChatTurn("user", "a"), ChatTurn("assistant", "b")], "c")
    assert [c.role for c in contents] == ["user", "model", "user"]
    assert contents[-1].parts[0].text == "c"
