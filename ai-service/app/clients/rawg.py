"""Small RAWG API client with an in-memory cache (RAWG's free tier has a monthly request quota)."""

import logging
import time

import httpx

from app.config import Settings
from app.domain import game_resolver

logger = logging.getLogger("kairo.rawg")

CACHE_SECONDS = 24 * 60 * 60
MAX_CACHE_ENTRIES = 500


class RawgError(Exception):
    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


class RawgClient:
    def __init__(self, settings: Settings, transport: httpx.AsyncBaseTransport | None = None):
        self._key = settings.rawg_api_key
        self._client = httpx.AsyncClient(base_url=settings.rawg_base_url.rstrip("/"), timeout=settings.rawg_timeout_seconds, transport=transport)
        self._cache: dict[str, tuple[float, dict]] = {}

    @property
    def is_configured(self) -> bool:
        return bool(self._key)

    async def _get(self, path: str, params: dict) -> dict:
        if not self._key:
            raise RawgError("Game discovery isn't set up yet. Add RAWG_API_KEY to the AI service.")
        cache_key = path + "?" + "&".join(f"{k}={params[k]}" for k in sorted(params))
        cached = self._cache.get(cache_key)
        if cached and cached[0] > time.time():
            return cached[1]
        try:
            response = await self._client.get(path, params={**params, "key": self._key})
        except httpx.HTTPError as exc:
            logger.warning("RAWG unreachable: %s", type(exc).__name__)
            raise RawgError("The game database is unreachable right now. Please try again.") from exc
        if response.status_code == 401:
            raise RawgError("The RAWG API key was rejected. Check RAWG_API_KEY.")
        if response.status_code >= 400:
            logger.warning("RAWG %s -> %s", path, response.status_code)
            raise RawgError("The game database returned an error. Please try again.")
        data = response.json()
        if len(self._cache) >= MAX_CACHE_ENTRIES:
            self._cache.pop(next(iter(self._cache)))
        self._cache[cache_key] = (time.time() + CACHE_SECONDS, data)
        return data

    async def find_game(self, title: str) -> dict | None:
        """Best RAWG match for a title the player typed."""
        data = await self._get("/games", {"search": title, "page_size": 5})
        results = data.get("results") or []
        if not results:
            return None
        resolved = game_resolver.resolve(title, [{**r, "title": r.get("name", "")} for r in results])
        return resolved["match"] or results[0]

    async def discover(self, *, genres: list[str] | None = None, tags: list[str] | None = None, parent_platforms: str | None = None) -> list[dict]:
        params: dict = {"page_size": 40, "ordering": "-added", "exclude_additions": "true"}
        if genres:
            params["genres"] = ",".join(genres)
        if tags:
            params["tags"] = ",".join(tags)
        if parent_platforms:
            params["parent_platforms"] = parent_platforms
        data = await self._get("/games", params)
        return data.get("results") or []

    async def close(self) -> None:
        await self._client.aclose()
