from tests.conftest import USER_A


def test_public_health_needs_no_token(api):
    res = api.client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok", "service": "kairo-ai", "version": "0.2.0"}


def test_detailed_health_requires_token(api):
    res = api.client.get("/v1/health")
    assert res.status_code == 401
    assert res.json()["code"] == "UNAUTHORIZED"


def test_detailed_health_reports_status(api, llm):
    res = api.request("GET", "/v1/health", USER_A)
    assert res.status_code == 200
    assert res.json()["status"] == "ok"
    assert res.json()["database"] == "ok"

    llm.configured = False
    res = api.request("GET", "/v1/health", USER_A)
    assert res.json()["status"] == "degraded"
    assert res.json()["gemini"] == "missing_key"


def test_detailed_health_reports_database_down(api, db):
    db.healthy = False
    res = api.request("GET", "/v1/health", USER_A)
    assert res.json()["database"] == "error"
    assert res.json()["status"] == "degraded"
