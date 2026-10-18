"""Thin wrapper around the Google Gen AI SDK for a manual tool-calling loop.

- Free tier only: we never touch billing; a 429 means the free quota is used up.
- Retries transient 5xx/timeouts, then falls back to GEMINI_FALLBACK_MODEL.
- Automatic function calling is OFF: our own agent loop validates and runs every tool.
- Never logs prompts, replies, tool data or the API key.
"""

import asyncio
import logging
from dataclasses import dataclass
from typing import Any, Literal, Protocol

import httpx
from google import genai
from google.genai import errors, types

from app.config import Settings

logger = logging.getLogger("kairo.llm")


@dataclass(frozen=True)
class ChatTurn:
    role: Literal["user", "assistant"]
    text: str


@dataclass(frozen=True)
class ToolSpec:
    name: str
    description: str
    parameters: dict


@dataclass(frozen=True)
class ToolCall:
    id: str | None
    name: str
    args: dict


@dataclass
class ModelStep:
    text: str
    calls: list[ToolCall]
    model: str
    content: Any = None  # provider message to append back to the transcript
    input_tokens: int | None = None
    output_tokens: int | None = None
    blocked: bool = False


class LlmError(Exception):
    def __init__(self, status_code: int, code: str, message: str):
        super().__init__(message)
        self.status_code = status_code
        self.code = code
        self.message = message


class LlmClient(Protocol):
    @property
    def is_configured(self) -> bool: ...

    @property
    def model(self) -> str: ...

    def new_transcript(self, history: list[ChatTurn], user_message: str) -> list: ...

    async def step(self, *, system_prompt: str, transcript: list, tools: list[ToolSpec], allow_tools: bool = True, start_model: str | None = None) -> ModelStep: ...

    def add_tool_results(self, transcript: list, step: ModelStep, results: list[tuple[ToolCall, dict]]) -> None: ...


TRANSIENT_CODES = {500, 502, 503, 504}
BLOCKED_REPLY = "I can't help with that one. Ask me about your games, a tough boss or your progress instead."


def to_contents(history: list[ChatTurn], user_message: str) -> list[types.Content]:
    contents = [
        types.Content(role="model" if turn.role == "assistant" else "user", parts=[types.Part.from_text(text=turn.text)])
        for turn in history
    ]
    contents.append(types.Content(role="user", parts=[types.Part.from_text(text=user_message)]))
    return contents


class GeminiClient:
    def __init__(self, settings: Settings):
        self._settings = settings
        self._client = None
        if settings.gemini_api_key:
            self._client = genai.Client(
                api_key=settings.gemini_api_key,
                http_options=types.HttpOptions(
                    timeout=int(settings.gemini_timeout_seconds * 1000),
                    retry_options=types.HttpRetryOptions(attempts=1),
                    base_url=settings.gemini_base_url or None,
                ),
            )

    @property
    def is_configured(self) -> bool:
        return self._client is not None

    @property
    def model(self) -> str:
        return self._settings.gemini_model

    def _models(self, start_model: str | None) -> list[str]:
        models = [self._settings.gemini_model]
        fallback = self._settings.gemini_fallback_model
        if fallback and fallback not in models:
            models.append(fallback)
        if start_model in models:
            models = models[models.index(start_model):]
        return models

    def new_transcript(self, history: list[ChatTurn], user_message: str) -> list:
        return to_contents(history, user_message)

    def add_tool_results(self, transcript: list, step: ModelStep, results: list[tuple[ToolCall, dict]]) -> None:
        # The model's own turn goes back unchanged (keeps Gemini's thought signatures intact).
        transcript.append(step.content)
        transcript.append(
            types.Content(
                role="user",
                parts=[
                    types.Part(function_response=types.FunctionResponse(id=call.id, name=call.name, response=result))
                    for call, result in results
                ],
            )
        )

    def _config(self, system_prompt: str, tools: list[ToolSpec], allow_tools: bool) -> types.GenerateContentConfig:
        config = types.GenerateContentConfig(
            system_instruction=system_prompt,
            temperature=0.4,
            max_output_tokens=self._settings.gemini_max_output_tokens,
        )
        if tools:
            config.tools = [
                types.Tool(
                    function_declarations=[
                        types.FunctionDeclaration(name=t.name, description=t.description, parameters_json_schema=t.parameters)
                        for t in tools
                    ]
                )
            ]
            config.automatic_function_calling = types.AutomaticFunctionCallingConfig(disable=True)
            config.tool_config = types.ToolConfig(
                function_calling_config=types.FunctionCallingConfig(mode="AUTO" if allow_tools else "NONE")
            )
        return config

    async def step(self, *, system_prompt: str, transcript: list, tools: list[ToolSpec], allow_tools: bool = True, start_model: str | None = None) -> ModelStep:
        if self._client is None:
            raise LlmError(503, "AI_NOT_CONFIGURED", "Coach isn't set up yet. Add GEMINI_API_KEY to the AI service.")

        config = self._config(system_prompt, tools, allow_tools)
        last_code: int | None = None
        for model in self._models(start_model):
            for attempt in range(2):
                try:
                    response = await self._client.aio.models.generate_content(model=model, contents=transcript, config=config)
                    return self._to_step(response, model)
                except errors.APIError as exc:
                    last_code = exc.code
                    logger.warning("Gemini error model=%s code=%s status=%s", model, exc.code, exc.status)
                    if exc.code in TRANSIENT_CODES and attempt == 0:
                        await asyncio.sleep(1.5)
                        continue
                    if exc.code in (429, 404) or exc.code in TRANSIENT_CODES:
                        break  # quota used up / model retired / still failing -> try fallback model
                    if exc.code in (400, 401, 403):
                        logger.error("Gemini rejected the request (check GEMINI_API_KEY and GEMINI_MODEL)")
                        raise LlmError(503, "AI_CONFIG_ERROR", "Coach is misconfigured. Please try again later.") from exc
                    raise LlmError(502, "AI_REQUEST_FAILED", "Coach couldn't answer that. Please try again.") from exc
                except (httpx.TimeoutException, asyncio.TimeoutError):
                    last_code = 504
                    logger.warning("Gemini timeout model=%s attempt=%s", model, attempt + 1)
                    if attempt == 0:
                        continue
                    break
                except httpx.HTTPError as exc:
                    last_code = 503
                    logger.warning("Gemini network error model=%s: %s", model, type(exc).__name__)
                    break

        if last_code == 429:
            raise LlmError(503, "AI_QUOTA_EXCEEDED", "Coach has reached its free usage limit for now. Please try again in a minute.")
        raise LlmError(503, "AI_UNAVAILABLE", "Coach is temporarily unavailable. Please try again shortly.")

    @staticmethod
    def _to_step(response: types.GenerateContentResponse, model: str) -> ModelStep:
        content = response.candidates[0].content if response.candidates else None
        parts = (content.parts if content and content.parts else []) or []
        text = "".join(p.text for p in parts if getattr(p, "text", None) and not getattr(p, "thought", False)).strip()
        calls = [
            ToolCall(id=p.function_call.id, name=p.function_call.name or "", args=dict(p.function_call.args or {}))
            for p in parts
            if getattr(p, "function_call", None)
        ]
        blocked = False
        if not text and not calls:
            reason = response.candidates[0].finish_reason if response.candidates else None
            logger.warning("Gemini returned no text model=%s finish_reason=%s", model, reason)
            blocked = True
        usage = response.usage_metadata
        return ModelStep(
            text=text,
            calls=calls,
            model=model,
            content=content,
            input_tokens=getattr(usage, "prompt_token_count", None) if usage else None,
            output_tokens=getattr(usage, "candidates_token_count", None) if usage else None,
            blocked=blocked,
        )
