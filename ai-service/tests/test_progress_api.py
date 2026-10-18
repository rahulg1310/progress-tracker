"""Phase 4 endpoints and agent tools: insights, goals, progression, challenges, briefing, recommendations."""

from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from app.llm.gemini_client import LlmError
from tests.conftest import USER_A, USER_B
from tests.test_domain_phase4 import SEKIRO, WUKONG, rawg as rawg_game

TODAY = datetime.now(timezone.utc).astimezone(ZoneInfo("Asia/Kolkata")).date()
MONDAY = TODAY - timedelta(days=TODAY.weekday())
SUNDAY = MONDAY + timedelta(days=6)


def get(api, path, user=USER_A):
    return api.request("GET", path, user)


def post(api, path, body=None, user=USER_A):
    return api.request("POST", path, user, body if body is not None else {})


# ------------------------------------------------------------------ insights
def test_insights_from_real_sessions(api, store):
    store.add_game(USER_A, "Elden Ring", colorAccent="#e7b427")
    store.add_session(USER_A, "Elden Ring", 90, TODAY.isoformat())
    store.add_session(USER_A, "Elden Ring", 30, (MONDAY - timedelta(days=3)).isoformat())
    store.add_session(USER_B, "Elden Ring", 999, TODAY.isoformat())
    data = get(api, "/v1/insights").json()["insights"]
    assert data["week"]["totalMinutes"] == 90 and data["week"]["prevTotalMinutes"] == 30
    assert data["week"]["topGames"][0]["color"] == "#e7b427"
    assert data["week"]["goal"] is None
    assert data["month"]["unit"] == "month"


# --------------------------------------------------------------------- goals
def test_goal_lifecycle_and_isolation(api, store):
    res = post(api, "/v1/goals", {"type": "weekly_playtime", "target": 6, "endDate": SUNDAY.isoformat()})
    assert res.status_code == 201
    goal = res.json()["goal"]
    assert goal["targetValue"] == 360 and goal["title"] == "Play 6h" and goal["startDate"] == MONDAY.isoformat()

    store.add_session(USER_A, "Elden Ring", 120, TODAY.isoformat())
    listed = get(api, "/v1/goals").json()["goals"]
    assert listed[0]["currentValue"] == 120 and listed[0]["status"] == "active"
    assert get(api, "/v1/goals", USER_B).json()["goals"] == []

    insights = get(api, "/v1/insights").json()["insights"]
    assert insights["week"]["goal"] == {"title": "Play 6h", "current": 120, "target": 360, "unit": "minutes"}

    assert api.request("DELETE", f"/v1/goals/{goal['_id']}", USER_B).status_code == 404
    assert api.request("DELETE", f"/v1/goals/{goal['_id']}", USER_A).status_code == 200


def test_goal_validation(api):
    too_far = (TODAY + timedelta(days=120)).isoformat()
    assert post(api, "/v1/goals", {"type": "active_days", "target": 9, "endDate": SUNDAY.isoformat()}).status_code == 400
    assert post(api, "/v1/goals", {"type": "weekly_playtime", "target": 5, "endDate": too_far}).status_code == 400
    assert post(api, "/v1/goals", {"type": "laps", "target": 5, "endDate": SUNDAY.isoformat()}).status_code == 422
    assert post(api, "/v1/goals", {"type": "weekly_sessions", "target": 3, "endDate": SUNDAY.isoformat(), "user": USER_B}).status_code == 422


# ------------------------------------------------------------------ briefing
def test_briefing_is_cached_and_grounded(api, store, llm):
    post(api, "/v1/goals", {"type": "weekly_playtime", "target": 4, "endDate": SUNDAY.isoformat()})
    store.add_session(USER_A, "Elden Ring", 150, TODAY.isoformat())

    llm.queue.append("You have 1h 30m to go this week, and one solid session gets you there.")
    first = get(api, "/v1/briefing").json()["briefing"]
    assert first["headline"] == "You're 1h 30m away from your weekly goal"
    assert first["source"] == "coach" and "1h 30m" in first["text"]
    assert "facts" not in first

    calls = len(llm.calls)
    again = get(api, "/v1/briefing").json()["briefing"]
    assert again["text"] == first["text"] and len(llm.calls) == calls  # cached, no new Gemini request

    store.add_session(USER_A, "Elden Ring", 30, TODAY.isoformat())
    llm.queue.append("You only need 7 more hours!")  # number not in the facts -> rejected
    changed = get(api, "/v1/briefing").json()["briefing"]
    assert changed["source"] == "computed" and "7 more hours" not in changed["text"]
    assert changed["headline"] == "You're 1h away from your weekly goal"


def test_briefing_without_gemini(api, llm):
    llm.configured = False
    data = get(api, "/v1/briefing").json()["briefing"]
    assert data["source"] == "computed" and data["headline"]


# ----------------------------------------------------------- recommendations
def test_recommendations(api, store, rawg):
    store.add_game(USER_A, "Elden Ring")
    rawg.games = {"sekiro": SEKIRO, "black myth: wukong": WUKONG}
    rawg.catalog = [
        rawg_game(10, "Lies of P", ["Souls-like", "Difficult"], ["Action", "RPG"], platforms=("PC", "PlayStation 5")),
        rawg_game(12, "Elden Ring", ["Souls-like", "Difficult"], ["Action", "RPG"]),
        rawg_game(11, "Cozy Farm", ["Relaxing"], ["Simulation"]),
    ]
    res = post(api, "/v1/recommendations", {"likedGames": ["Sekiro", "Black Myth: Wukong"], "mood": "", "platform": "PS5"})
    data = res.json()
    assert res.status_code == 200
    assert [r["title"] for r in data["recommendations"]] == ["Lies of P"]  # owned + wrong platform removed
    assert data["likedGames"] == ["Sekiro: Shadows Die Twice", "Black Myth: Wukong"]
    assert ("discover", (), ("souls-like", "difficult", "ninja"), "2") in rawg.calls


def test_recommendations_default_to_favourites_and_handle_errors(api, store, rawg):
    assert post(api, "/v1/recommendations", {}).status_code == 400  # empty library, nothing liked
    store.add_game(USER_A, "Sekiro", status="Completed", rating=10)
    rawg.games = {"sekiro": SEKIRO}
    rawg.catalog = []
    assert post(api, "/v1/recommendations", {}).json()["likedGames"] == ["Sekiro: Shadows Die Twice"]
    rawg.configured = False
    res = post(api, "/v1/recommendations", {"likedGames": ["Sekiro"]})
    assert res.status_code == 503 and res.json()["code"] == "DISCOVERY_UNAVAILABLE"


# ---------------------------------------------------------------- agent tools
def test_agent_goal_tools(api, store, llm):
    llm.queue += [[("create_goal", {"type": "weekly_playtime", "target": 5}), ("get_goals", {})], "Done!"]
    res = api.request("POST", "/v1/chat", USER_A, {"message": "Set a 5 hour weekly goal"})
    created, listed = [r for _, r in llm.tool_results()]
    assert created["ok"] and created["data"]["goal"]["targetValue"] == 300 and created["data"]["goal"]["endDate"] == SUNDAY.isoformat()
    assert listed["ok"] and len(listed["data"]["goals"]) == 1
    assert res.json()["effects"]["goalsChanged"] is True
    assert len(store.goals) == 1


def test_agent_recommend_tool(api, store, llm, rawg):
    rawg.games = {"sekiro": SEKIRO}
    rawg.catalog = [rawg_game(10, "Lies of P", ["Souls-like", "Difficult"], ["Action"])]
    llm.queue += [[("recommend_games", {"liked_games": ["Sekiro"], "mood": "under 40 hours"})], "Try Lies of P"]
    api.request("POST", "/v1/chat", USER_A, {"message": "What should I play next?"})
    result = llm.tool_results()[0][1]
    assert result["ok"] and result["data"]["recommendations"][0]["title"] == "Lies of P"


def test_overview_bundles_everything(api, store, llm):
    llm.configured = False
    post(api, "/v1/goals", {"type": "weekly_playtime", "target": 2, "endDate": SUNDAY.isoformat()})
    store.add_session(USER_A, "Elden Ring", 60, TODAY.isoformat())
    data = get(api, "/v1/overview").json()
    assert set(data) == {"success", "insights", "goals", "briefing", "plans"}
    assert data["insights"]["week"]["totalMinutes"] == 60
    assert data["goals"][0]["currentValue"] == 60
    assert data["briefing"]["headline"] == "You're 1h away from your weekly goal"
    assert get(api, "/v1/overview", USER_B).json()["goals"] == []


def test_removed_endpoints_are_gone(api):
    assert get(api, "/v1/progression").status_code == 404
    assert post(api, "/v1/challenges").status_code == 404
