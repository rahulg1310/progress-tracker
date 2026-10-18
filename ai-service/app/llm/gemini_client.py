"""Thin wrapper around the Google Gen AI SDK.

- Free tier only: we never touch billing; a 429 means the free quota is used up.
- Retries transient 5xx/timeouts, then falls back to GEMINI_FALLBACK_MODEL.
- Never logs prompts, replies or the API key.
"""

import asyncio
import logging
from dataclasses import dataclass
from typing import Literal, Protocol

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
class LlmReply:
    text: str
    model: str
    input_tokens: int | None = None
    output_tokens: int | None = None


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

    async def generate(self, *, system_prompt: str, history: list[ChatTurn], user_message: str) -> LlmReply: ...


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

    def _models(self) -> list[str]:
        models = [self._settings.gemini_model]
        fallback = self._settings.gemini_fallback_model
        if fallback and fallback not in models:
            models.append(fallback)
        return models

    async def generate(self, *, system_prompt: str, history: list[ChatTurn], user_message: str) -> LlmReply:
        if self._client is None:
            raise LlmError(503, "AI_NOT_CONFIGURED", "Coach isn't set up yet. Add GEMINI_API_KEY to the AI service.")

        contents = to_contents(history, user_message)
        config = types.GenerateContentConfig(
            system_instruction=system_prompt,
            temperature=0.7,
            max_output_tokens=self._settings.gemini_max_output_tokens,
        )

        last_code: int | None = None
        for model in self._models():
            for attempt in range(2):
                try:
                    response = await self._client.aio.models.generate_content(
                        model=model, contents=contents, config=config
                    )
                    return self._to_reply(response, model)
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
    def _to_reply(response: types.GenerateContentResponse, model: str) -> LlmReply:
        text = ""
        try:
            text = (response.text or "").strip()
        except ValueError:
            text = ""
        if not text:
            reason = None
            if response.candidates:
                reason = response.candidates[0].finish_reason
            logger.warning("Gemini returned no text model=%s finish_reason=%s", model, reason)
            text = BLOCKED_REPLY
        usage = response.usage_metadata
        return LlmReply(
            text=text,
            model=model,
            input_tokens=getattr(usage, "prompt_token_count", None) if usage else None,
            output_tokens=getattr(usage, "candidates_token_count", None) if usage else None,
        )
