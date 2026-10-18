"""Verifies the short-lived service token Express attaches to every /v1 request.

The browser never talks to this service. Express authenticates the user with
their normal login JWT, then signs a separate 60-second token whose `sub` is
that user's id. This module is the ONLY place a user id enters the AI service,
so request bodies and tool arguments can never choose whose data is touched.
"""

import hashlib
import hmac
import re
import threading
import time
from dataclasses import dataclass
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

import jwt
from fastapi import Depends, Request

from app.config import Settings, get_settings
from app.errors import AppError

OBJECT_ID_RE = re.compile(r"^[a-f0-9]{24}$")
REQUEST_ID_RE = re.compile(r"^[A-Za-z0-9-]{1,64}$")


@dataclass(frozen=True)
class ServiceContext:
    user_id: str
    timezone: str
    request_id: str


class ReplayCache:
    """Remembers token ids (jti) until they expire so a captured token can't be reused.

    In-memory is enough for a single instance (Render free tier runs one).
    """

    def __init__(self, max_entries: int = 50_000):
        self._seen: dict[str, float] = {}
        self._lock = threading.Lock()
        self._max_entries = max_entries

    def add(self, jti: str, expires_at: float) -> bool:
        now = time.time()
        with self._lock:
            if len(self._seen) > self._max_entries // 2:
                self._seen = {key: exp for key, exp in self._seen.items() if exp > now}
            if jti in self._seen and self._seen[jti] > now:
                return False
            if len(self._seen) >= self._max_entries:
                return False
            self._seen[jti] = expires_at
            return True


replay_cache = ReplayCache()


def body_hash(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def resolve_timezone(value: str | None) -> str:
    if not value or len(value) > 64:
        return "UTC"
    try:
        ZoneInfo(value)
        return value
    except (ZoneInfoNotFoundError, ValueError):
        return "UTC"


def _unauthorized(message: str = "Invalid service token") -> AppError:
    return AppError(401, "UNAUTHORIZED", message)


async def require_service_context(
    request: Request, settings: Settings = Depends(get_settings)
) -> ServiceContext:
    auth = request.headers.get("authorization", "")
    if not auth.startswith("Bearer "):
        raise _unauthorized("Missing service token")
    token = auth[7:].strip()

    try:
        claims = jwt.decode(
            token,
            settings.service_auth_secret,
            algorithms=["HS256"],
            audience=settings.service_token_audience,
            issuer=settings.service_token_issuer,
            options={"require": ["exp", "iat", "sub", "jti", "bh", "aud", "iss"]},
            leeway=5,
        )
    except jwt.PyJWTError:
        raise _unauthorized()

    if time.time() - float(claims["iat"]) > settings.service_token_max_age_seconds:
        raise _unauthorized("Service token too old")

    user_id = str(claims["sub"])
    if not OBJECT_ID_RE.match(user_id):
        raise _unauthorized()

    raw_body = await request.body()
    if not hmac.compare_digest(str(claims["bh"]), body_hash(raw_body)):
        raise _unauthorized("Request body does not match token")

    if not replay_cache.add(str(claims["jti"]), float(claims["exp"]) + 5):
        raise _unauthorized("Service token already used")

    request_id = request.headers.get("x-request-id", "")
    if not REQUEST_ID_RE.match(request_id):
        request_id = str(claims["jti"])[:36]

    return ServiceContext(
        user_id=user_id,
        timezone=resolve_timezone(request.headers.get("x-timezone")),
        request_id=request_id,
    )
