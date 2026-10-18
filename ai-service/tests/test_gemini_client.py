"""GeminiClient retry/fallback and response parsing, with the SDK call replaced (no network, no key)."""

from types import SimpleNamespace

import httpx
import pytest
from google.genai import errors, types

from app.config import Settings
from app.llm.gemini_client import ChatTurn, GeminiClient, LlmError, ToolCall, ToolSpec, to_contents

TOOLS = [ToolSpec("get_stats", "stats", {"type": "object", "properties": {"period": {"type": "string"}}, "required": ["period"]})]


def make_client(monkeypatch, outcomes):
    settings = Settings(
        service_auth_secret="x" * 32, mongo_uri="mongodb://x", mongo_db_name="t",
        gemini_api_key="fake-key", gemini_model="primary", gemini_fallback_model="fallback",
    )
    client = GeminiClient(settings)
    calls = []

    async def fake_generate(model, contents, config):
        calls.append({"model": model, "config": config})
        outcome = outcomes.pop(0)
        if isinstance(outcome, Exception):
            raise outcome
        return outcome

    async def no_sleep(_):
        return None

    monkeypatch.setattr(client._client.aio.models, "generate_content", fake_generate)
    monkeypatch.setattr("app.llm.gemini_client.asyncio.sleep", no_sleep)
    return client, calls


def api_error(code, status):
    return errors.APIError(code, {"error": {"code": code, "status": status, "message": status}})


def response(parts, finish="STOP"):
    content = types.Content(role="model", parts=parts)
    return SimpleNamespace(
        candidates=[SimpleNamespace(content=content, finish_reason=finish)],
        usage_metadata=SimpleNamespace(prompt_token_count=10, candidates_token_count=5),
    )


def text(value="Hello!"):
    return response([types.Part.from_text(text=value)])


async def step(client, **kwargs):
    transcript = client.new_transcript([ChatTurn("user", "a"), ChatTurn("assistant", "b")], "c")
    return await client.step(system_prompt="sys", transcript=transcript, tools=TOOLS, **kwargs)


async def test_text_reply(monkeypatch):
    client, calls = make_client(monkeypatch, [text("Parry!")])
    result = await step(client)
    assert result.text == "Parry!" and result.calls == [] and result.model == "primary" and result.input_tokens == 10
    config = calls[0]["config"]
    assert config.automatic_function_calling.disable is True
    assert config.tools[0].function_declarations[0].name == "get_stats"
    assert config.tool_config.function_calling_config.mode == "AUTO"


async def test_function_calls_are_parsed(monkeypatch):
    call_part = types.Part(function_call=types.FunctionCall(id="c1", name="get_stats", args={"period": "this_week"}))
    client, _ = make_client(monkeypatch, [response([call_part])])
    result = await step(client)
    assert result.calls == [ToolCall(id="c1", name="get_stats", args={"period": "this_week"})]
    assert result.text == ""


async def test_tool_results_are_appended_after_model_turn(monkeypatch):
    call_part = types.Part(function_call=types.FunctionCall(id="c1", name="get_stats", args={"period": "this_week"}))
    client, _ = make_client(monkeypatch, [response([call_part])])
    transcript = client.new_transcript([], "how was my week")
    result = await client.step(system_prompt="s", transcript=transcript, tools=TOOLS)
    client.add_tool_results(transcript, result, [(result.calls[0], {"ok": True, "data": {"total": 5}})])
    assert [c.role for c in transcript] == ["user", "model", "user"]
    fr = transcript[-1].parts[0].function_response
    assert fr.name == "get_stats" and fr.id == "c1" and fr.response == {"ok": True, "data": {"total": 5}}


async def test_tools_can_be_switched_off(monkeypatch):
    client, calls = make_client(monkeypatch, [text("Final")])
    await step(client, allow_tools=False)
    assert calls[0]["config"].tool_config.function_calling_config.mode == "NONE"


async def test_transient_error_retries_same_model(monkeypatch):
    client, calls = make_client(monkeypatch, [api_error(503, "UNAVAILABLE"), text()])
    assert (await step(client)).model == "primary"
    assert [c["model"] for c in calls] == ["primary", "primary"]


async def test_quota_error_falls_back_and_stays_on_fallback(monkeypatch):
    client, calls = make_client(monkeypatch, [api_error(429, "RESOURCE_EXHAUSTED"), text(), text()])
    first = await step(client)
    assert first.model == "fallback"
    await step(client, start_model=first.model)
    assert [c["model"] for c in calls] == ["primary", "fallback", "fallback"]


async def test_quota_on_both_models_gives_friendly_error(monkeypatch):
    client, _ = make_client(monkeypatch, [api_error(429, "RESOURCE_EXHAUSTED"), api_error(429, "RESOURCE_EXHAUSTED")])
    with pytest.raises(LlmError) as exc:
        await step(client)
    assert exc.value.code == "AI_QUOTA_EXCEEDED" and exc.value.status_code == 503


async def test_bad_key_is_config_error_without_retry(monkeypatch):
    client, calls = make_client(monkeypatch, [api_error(400, "INVALID_ARGUMENT")])
    with pytest.raises(LlmError) as exc:
        await step(client)
    assert exc.value.code == "AI_CONFIG_ERROR" and len(calls) == 1


async def test_timeouts_then_unavailable(monkeypatch):
    timeout = httpx.ReadTimeout("slow")
    client, calls = make_client(monkeypatch, [timeout] * 4)
    with pytest.raises(LlmError) as exc:
        await step(client)
    assert exc.value.code == "AI_UNAVAILABLE"
    assert [c["model"] for c in calls] == ["primary", "primary", "fallback", "fallback"]


async def test_empty_reply_is_flagged_blocked(monkeypatch):
    client, _ = make_client(monkeypatch, [response([], finish="SAFETY")])
    result = await step(client)
    assert result.blocked is True and result.text == ""


async def test_missing_key_is_reported():
    settings = Settings(service_auth_secret="x" * 32, mongo_uri="mongodb://x", mongo_db_name="t", gemini_api_key="")
    client = GeminiClient(settings)
    assert client.is_configured is False
    with pytest.raises(LlmError) as exc:
        await step(client)
    assert exc.value.code == "AI_NOT_CONFIGURED"


def test_history_roles_map_to_gemini_roles():
    contents = to_contents([ChatTurn("user", "a"), ChatTurn("assistant", "b")], "c")
    assert [c.role for c in contents] == ["user", "model", "user"]
