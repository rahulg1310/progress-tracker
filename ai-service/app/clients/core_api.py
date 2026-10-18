"""Calls Express /internal/* to change games and sessions.

Signs a 60-second token with audience "kairo-core". The user id (`sub`) is the
one Express put in the token it sent us, so the agent can only ever write to
the logged-in player's data. Express validates everything again with zod.
"""

import hashlib
import json
import logging
import time
import uuid

import httpx
import jwt

from app.config import Settings

logger = logging.getLogger("kairo.core_api")


class CoreApiError(Exception):
    def __init__(self, status_code: int, message: str):
        super().__init__(message)
        self.status_code = status_code
        self.message = message


class CoreApiClient:
    def __init__(self, settings: Settings, transport: httpx.AsyncBaseTransport | None = None):
        self._settings = settings
        self._client = httpx.AsyncClient(
            base_url=settings.core_api_url.rstrip("/"),
            timeout=settings.core_api_timeout_seconds,
            transport=transport,
        )

    def _token(self, user_id: str, raw: bytes) -> str:
        now = int(time.time())
        claims = {
            "sub": user_id,
            "aud": "kairo-core",
            "iss": "kairo-ai",
            "iat": now,
            "exp": now + 60,
            "jti": str(uuid.uuid4()),
            "bh": hashlib.sha256(raw).hexdigest(),
        }
        return jwt.encode(claims, self._settings.service_auth_secret, algorithm="HS256")

    async def _request(self, method: str, path: str, user_id: str, body: dict | None) -> dict:
        raw = json.dumps(body, separators=(",", ":")).encode() if body is not None else b""
        headers = {"Authorization": f"Bearer {self._token(user_id, raw)}"}
        if body is not None:
            headers["Content-Type"] = "application/json"
        try:
            response = await self._client.request(method, path, content=raw, headers=headers)
        except httpx.HTTPError as exc:
            logger.warning("Core API unreachable: %s", type(exc).__name__)
            raise CoreApiError(503, "Couldn't reach the Kairo server. Please try again.") from exc
        try:
            data = response.json()
        except ValueError:
            data = {}
        if response.status_code >= 400:
            message = data.get("message") or "The Kairo server rejected the change."
            logger.info("Core API %s %s -> %s", method, path, response.status_code)
            raise CoreApiError(response.status_code, message)
        return data

    async def create_session(self, user_id: str, session: dict, add_playtime_game_id: str | None) -> dict:
        body: dict = {"session": session}
        if add_playtime_game_id:
            body["addPlaytimeToGameId"] = add_playtime_game_id
        return await self._request("POST", "/internal/sessions", user_id, body)

    async def delete_session(self, user_id: str, session_id: str, revert_playtime: dict | None = None) -> dict:
        body = {"revertPlaytime": revert_playtime} if revert_playtime else {}
        return await self._request("DELETE", f"/internal/sessions/{session_id}", user_id, body)

    async def update_game(self, user_id: str, game_id: str, changes: dict) -> dict:
        return await self._request("PATCH", f"/internal/games/{game_id}", user_id, {"changes": changes})

    async def close(self) -> None:
        await self._client.aclose()
