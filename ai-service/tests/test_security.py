import json
import time

import pytest

from app.security import resolve_timezone
from tests.conftest import USER_A, sign

BODY = {"message": "hi"}
RAW = json.dumps(BODY, separators=(",", ":")).encode()


def post(api, token, raw=RAW):
    return api.client.post(
        "/v1/chat", content=raw, headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    )


def test_valid_token_is_accepted(api):
    assert post(api, sign(USER_A, RAW)).status_code == 200


def test_missing_token(api):
    res = api.client.post("/v1/chat", json=BODY)
    assert res.status_code == 401
    assert res.json()["message"] == "Missing service token"


@pytest.mark.parametrize(
    "overrides",
    [
        {"secret": "a-completely-different-secret-of-32-plus-chars"},
        {"aud": "someone-else"},
        {"iss": "browser"},
        {"exp": int(time.time()) - 30},
        {"iat": int(time.time()) - 600, "exp": int(time.time()) + 60},
        {"sub": "not-an-object-id"},
        {"bh": None},
        {"jti": None},
    ],
    ids=["wrong-secret", "wrong-audience", "wrong-issuer", "expired", "too-old", "bad-subject", "no-body-hash", "no-jti"],
)
def test_rejected_tokens(api, overrides):
    res = post(api, sign(USER_A, RAW, **overrides))
    assert res.status_code == 401
    assert res.json()["code"] == "UNAUTHORIZED"


def test_tampered_body_is_rejected(api):
    token = sign(USER_A, RAW)
    tampered = json.dumps({"message": "something else"}).encode()
    res = post(api, token, tampered)
    assert res.status_code == 401
    assert res.json()["message"] == "Request body does not match token"


def test_replayed_token_is_rejected(api):
    token = sign(USER_A, RAW)
    assert post(api, token).status_code == 200
    res = post(api, token)
    assert res.status_code == 401
    assert res.json()["message"] == "Service token already used"


def test_alg_none_is_rejected(api):
    import jwt

    token = jwt.encode({"sub": USER_A, "aud": "kairo-ai", "iss": "kairo-core"}, key=None, algorithm="none")
    assert post(api, token).status_code == 401


def test_user_id_in_body_is_ignored(api, store):
    body = {"message": "hi", "userId": "64b7f0c2a1b2c3d4e5f60719"}
    res = api.request("POST", "/v1/chat", USER_A, body)
    assert res.status_code == 422  # unknown fields are refused outright
    assert store.conversations == []


def test_timezone_resolution():
    assert resolve_timezone("Asia/Kolkata") == "Asia/Kolkata"
    assert resolve_timezone("Not/AZone") == "UTC"
    assert resolve_timezone("../../etc/passwd") == "UTC"
    assert resolve_timezone(None) == "UTC"
