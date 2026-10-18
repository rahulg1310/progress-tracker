"""Agent behaviour with a scripted model: tool calling, validation, actions and plans."""

from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from bson import ObjectId

from app.agent.runner import MAX_STEPS
from app.llm.gemini_client import LlmError
from tests.conftest import USER_A, USER_B

TODAY = datetime.now(timezone.utc).astimezone(ZoneInfo("Asia/Kolkata")).date()


def chat(api, text, user=USER_A, conversation_id=None):
    body = {"message": text}
    if conversation_id:
        body["conversationId"] = conversation_id
    return api.request("POST", "/v1/chat", user, body)


def results(llm, name=None):
    return [r for n, r in llm.tool_results() if name is None or n == name]


# ------------------------------------------------------------- reading data
def test_stats_come_from_the_database(api, store, llm):
    store.add_session(USER_A, "Elden Ring", 90, TODAY.isoformat())
    store.add_session(USER_A, "Sekiro", 45, TODAY.isoformat())
    store.add_session(USER_B, "Elden Ring", 999, TODAY.isoformat())  # other user's data must not count
    llm.queue += [[("get_stats", {"period": "this_week"})], "You played 2h 15m this week."]

    res = chat(api, "How much did I play this week?")
    assert res.status_code == 200
    stats = results(llm, "get_stats")[0]["data"]
    assert stats["current"]["totalMinutes"] == 135
    assert stats["current"]["sessions"] == 2
    chips = {c["label"]: c["value"] for c in res.json()["assistantMessage"]["stats"]}
    assert chips == {"Playtime": "2h 15m", "Sessions": "2", "Avg Session": "1h 8m", "Active Days": "1"}


def test_library_is_scoped_to_the_user(api, store, llm):
    store.add_game(USER_A, "Elden Ring")
    store.add_game(USER_B, "Secret Game", notes="B's private notes")
    llm.queue += [[("get_library", {})], "ok"]
    chat(api, "What's in my library?")
    data = results(llm, "get_library")[0]["data"]
    assert [g["title"] for g in data["games"]] == ["Elden Ring"]


def test_tools_reject_unknown_and_extra_arguments(api, store, llm):
    llm.queue += [[("get_library", {"user_id": USER_B}), ("drop_database", {}), ("get_stats", {"period": "forever"})], "ok"]
    chat(api, "hi")
    first, second, third = results(llm)
    assert first["ok"] is False and "Invalid arguments" in first["error"]
    assert second == {"ok": False, "error": "Unknown tool 'drop_database'."}
    assert third["ok"] is False


# ---------------------------------------------------------------- logging
def test_log_session_saves_and_returns_undo_card(api, store, llm, core):
    game = store.add_game(USER_A, "Sekiro: Shadows Die Twice", playtime=10)
    llm.queue += [[("log_session", {"game": "sekiro", "duration_minutes": 90})], "Logged 1h 30m of Sekiro!"]

    res = chat(api, "Log a 90-minute Sekiro session today")
    data = res.json()
    assert res.status_code == 200
    assert core.calls[0][0] == "create_session"
    assert core.calls[0][1] == USER_A
    assert core.calls[0][2]["game"] == "Sekiro: Shadows Die Twice"
    assert core.calls[0][2]["date"] == TODAY.isoformat()
    assert core.calls[0][3] == str(game["_id"])
    assert game["playtime"] == 11.5

    card = data["assistantMessage"]["actions"][0]
    assert card["type"] == "log_session" and card["status"] == "done" and "undoUntil" in card
    assert len(data["effects"]["sessionsAdded"]) == 1
    assert data["effects"]["gamesUpdated"][0]["playtime"] == 11.5


def test_log_session_requires_the_player_to_ask(api, store, llm, core):
    store.add_game(USER_A, "Elden Ring")
    llm.queue += [[("log_session", {"game": "Elden Ring", "duration_minutes": 60})], "ok"]
    chat(api, "How do I beat Malenia?")
    assert results(llm, "log_session")[0]["ok"] is False
    assert core.calls == []


def test_log_session_follow_up_answer_counts_as_intent(api, store, llm, core):
    store.add_game(USER_A, "Elden Ring")
    llm.queue += ["How long did you play?"]
    conv = chat(api, "Log my Elden Ring session from today").json()["conversation"]["_id"]
    llm.queue += [[("log_session", {"game": "Elden Ring", "duration_minutes": 45})], "Saved!"]
    chat(api, "45 minutes", conversation_id=conv)
    assert results(llm, "log_session")[0]["ok"] is True


def test_log_session_unknown_or_future(api, store, llm, core):
    store.add_game(USER_A, "Elden Ring")
    tomorrow = (TODAY + timedelta(days=1)).isoformat()
    llm.queue += [[
        ("log_session", {"game": "Hollow Knight", "duration_minutes": 30}),
        ("log_session", {"game": "Elden Ring", "duration_minutes": 30, "date": tomorrow}),
        ("log_session", {"game": "Hollow Knight", "duration_minutes": 30, "log_unlisted_game": True}),
    ], "ok"]
    res = chat(api, "log these sessions")
    unknown, future, unlisted = results(llm, "log_session")
    assert "isn't in the player's library" in unknown["error"]
    assert "future" in future["error"]
    assert unlisted["ok"] is True
    assert core.calls[-1][3] is None  # no playtime change for a game not in the library
    assert len(res.json()["assistantMessage"]["actions"]) == 1


def test_write_budget_per_message(api, store, llm, core):
    store.add_game(USER_A, "Elden Ring")
    llm.queue += [[("log_session", {"game": "Elden Ring", "duration_minutes": 10})] * 4, "ok"]
    chat(api, "log four sessions")
    outcomes = [r["ok"] for r in results(llm, "log_session")]
    assert outcomes == [True, True, True, False]
    assert len(core.calls) == 3


def test_undo_removes_session_and_playtime(api, store, llm, core):
    game = store.add_game(USER_A, "Elden Ring", playtime=5)
    llm.queue += [[("log_session", {"game": "Elden Ring", "duration_minutes": 60})], "Saved"]
    data = chat(api, "log 60 minutes of elden ring").json()
    action_id = data["assistantMessage"]["actions"][0]["_id"]

    assert api.request("POST", f"/v1/actions/{action_id}/undo", USER_B).status_code == 404
    res = api.request("POST", f"/v1/actions/{action_id}/undo", USER_A)
    assert res.status_code == 200
    assert res.json()["action"]["status"] == "undone"
    assert store.sessions == [] and game["playtime"] == 5
    assert res.json()["effects"]["sessionsDeleted"] and res.json()["message"]["text"].startswith("Undone")
    stored = next(m for m in store.messages if m.get("actions"))
    assert stored["actions"][0]["status"] == "undone"
    assert api.request("POST", f"/v1/actions/{action_id}/undo", USER_A).status_code == 409


def test_undo_window_expires(api, store, llm):
    store.add_game(USER_A, "Elden Ring")
    llm.queue += [[("log_session", {"game": "Elden Ring", "duration_minutes": 60})], "Saved"]
    action_id = chat(api, "log 1 hour elden ring").json()["assistantMessage"]["actions"][0]["_id"]
    store.actions[0]["undoUntil"] = datetime.now(timezone.utc) - timedelta(seconds=1)
    res = api.request("POST", f"/v1/actions/{action_id}/undo", USER_A)
    assert res.status_code == 409 and res.json()["code"] == "UNDO_EXPIRED"


# ---------------------------------------------------------- confirmations
def test_update_game_waits_for_confirm(api, store, llm, core):
    game = store.add_game(USER_A, "Elden Ring", status="Playing", progress=62)
    llm.queue += [[("update_game", {"game": "elden ring", "status": "Completed", "progress": 100})], "Please confirm."]
    data = chat(api, "Mark Elden Ring as completed").json()
    card = data["assistantMessage"]["actions"][0]
    assert card["status"] == "pending" and "expiresAt" in card
    assert {d["value"] for d in card["details"]} == {"Playing → Completed", "62% → 100%"}
    assert core.calls == [] and game["status"] == "Playing"

    assert api.request("POST", f"/v1/actions/{card['_id']}/confirm", USER_B).status_code == 404
    res = api.request("POST", f"/v1/actions/{card['_id']}/confirm", USER_A)
    assert res.status_code == 200 and res.json()["action"]["status"] == "confirmed"
    assert game["status"] == "Completed" and game["progress"] == 100
    assert res.json()["effects"]["gamesUpdated"][0]["status"] == "Completed"
    # double-click / replay cannot apply twice
    second = api.request("POST", f"/v1/actions/{card['_id']}/confirm", USER_A)
    assert second.status_code == 409 and second.json()["code"] == "ALREADY_HANDLED"
    assert len(core.calls) == 1


def test_cancel_and_expiry(api, store, llm, core):
    store.add_game(USER_A, "Elden Ring")
    llm.queue += [[("update_game", {"game": "Elden Ring", "rating": 9}), ("update_game", {"game": "Elden Ring", "status": "Dropped"})], "Confirm?"]
    first, second = chat(api, "rate it 9 and drop it").json()["assistantMessage"]["actions"]

    assert api.request("POST", f"/v1/actions/{first['_id']}/cancel", USER_A).json()["action"]["status"] == "cancelled"
    assert api.request("POST", f"/v1/actions/{first['_id']}/confirm", USER_A).status_code == 409

    next(a for a in store.actions if str(a["_id"]) == second["_id"])["expiresAt"] = datetime.now(timezone.utc) - timedelta(seconds=1)
    res = api.request("POST", f"/v1/actions/{second['_id']}/confirm", USER_A)
    assert res.status_code == 409 and res.json()["code"] == "EXPIRED"
    assert core.calls == []


def test_failed_write_is_reported(api, store, llm, core):
    from app.clients.core_api import CoreApiError

    store.add_game(USER_A, "Elden Ring")
    llm.queue += [[("update_game", {"game": "Elden Ring", "progress": 50})], "Confirm?"]
    card = chat(api, "set progress to 50").json()["assistantMessage"]["actions"][0]
    core.fail_with = CoreApiError(400, "progress: Too big")
    res = api.request("POST", f"/v1/actions/{card['_id']}/confirm", USER_A).json()
    assert res["action"]["status"] == "failed" and "Too big" in res["message"]["text"]


def test_delete_session_only_for_own_sessions(api, store, llm, core):
    mine = store.add_session(USER_A, "Valorant", 40, TODAY.isoformat())
    theirs = store.add_session(USER_B, "Valorant", 40, TODAY.isoformat())
    llm.queue += [[("delete_session", {"session_id": str(theirs["_id"])}), ("delete_session", {"session_id": str(mine["_id"])})], "Confirm?"]
    data = chat(api, "delete my last session").json()
    bad, good = results(llm, "delete_session")
    assert bad["ok"] is False and good["ok"] is True
    card = data["assistantMessage"]["actions"][0]
    assert api.request("POST", f"/v1/actions/{card['_id']}/confirm", USER_A).json()["effects"]["sessionsDeleted"] == [str(mine["_id"])]
    assert theirs in store.sessions and mine not in store.sessions


# ------------------------------------------------------------- the loop
def test_loop_stops_after_max_steps(api, store, llm):
    llm.queue += [[("get_library", {})]] * MAX_STEPS + ["Here's what I found."]
    res = chat(api, "loop forever")
    assert res.json()["assistantMessage"]["text"] == "Here's what I found."
    assert llm.calls[-1]["allow_tools"] is False
    assert len(llm.calls) == MAX_STEPS + 1


def test_model_failure_after_a_write_keeps_the_card(api, store, llm):
    store.add_game(USER_A, "Elden Ring")
    llm.queue += [[("log_session", {"game": "Elden Ring", "duration_minutes": 30})], LlmError(503, "AI_QUOTA_EXCEEDED", "quota")]
    res = chat(api, "log 30 minutes of elden ring")
    assert res.status_code == 200
    assert res.json()["assistantMessage"]["actions"][0]["status"] == "done"
    assert "couldn't finish my reply" in res.json()["assistantMessage"]["text"]


def test_model_failure_without_writes_saves_nothing(api, store, llm):
    llm.queue += [[("get_library", {})], LlmError(503, "AI_UNAVAILABLE", "down")]
    assert chat(api, "what's in my library").status_code == 503
    assert store.messages == []


def test_history_tells_the_model_what_actions_happened(api, store, llm):
    store.add_game(USER_A, "Elden Ring")
    llm.queue += [[("log_session", {"game": "Elden Ring", "duration_minutes": 30})], "Saved"]
    conv = chat(api, "log 30 min elden ring").json()["conversation"]["_id"]
    chat(api, "thanks", conversation_id=conv)
    previous_reply = llm.calls[-1]["transcript"][1]["text"]
    assert "[Actions: Session logged" in previous_reply


# ------------------------------------------------------------ memory
def test_save_memory_dedupes(api, store, llm):
    llm.queue += [[("save_memory", {"kind": "preference", "text": "Loves parry-heavy games"}), ("save_memory", {"kind": "preference", "text": "loves parry-heavy games"})], "Noted"]
    res = chat(api, "I love parry-heavy games")
    assert [r["data"]["saved"] for r in results(llm, "save_memory")] == [True, False]
    assert res.json()["effects"]["memoriesChanged"] is True
    assert len(store.memories) == 1


# ------------------------------------------------------------- plans
def test_plans_api_lifecycle(api, store):
    game = store.add_game(USER_A, "Cyberpunk 2077", colorAccent="#f9e020")
    end = (TODAY + timedelta(days=13)).isoformat()
    res = api.request("POST", "/v1/plans", USER_A, {"gameId": str(game["_id"]), "endDate": end, "dailyMinutes": 60})
    assert res.status_code == 201
    plan = res.json()["plan"]
    assert plan["estimate"]["source"] == "default" and len(plan["milestones"]) == 14
    assert plan["milestones"][0]["status"] == "today"

    store.add_session(USER_A, "Cyberpunk 2077", 60, TODAY.isoformat())
    listed = api.request("GET", "/v1/plans", USER_A).json()["plans"]
    assert listed[0]["milestones"][0]["status"] == "done" and listed[0]["playedMinutes"] == 60
    assert api.request("GET", "/v1/plans", USER_B).json()["plans"] == []

    assert api.request("POST", f"/v1/plans/{plan['_id']}/replan", USER_B).status_code == 404
    replanned = api.request("POST", f"/v1/plans/{plan['_id']}/replan", USER_A).json()["plan"]
    assert replanned["version"] == 2
    assert api.request("DELETE", f"/v1/plans/{plan['_id']}", USER_B).status_code == 404
    assert api.request("DELETE", f"/v1/plans/{plan['_id']}", USER_A).status_code == 200


def test_plan_validation(api, store):
    game = store.add_game(USER_A, "Cyberpunk 2077")
    other = store.add_game(USER_B, "Other")
    past = (TODAY - timedelta(days=1)).isoformat()
    future = (TODAY + timedelta(days=7)).isoformat()
    assert api.request("POST", "/v1/plans", USER_A, {"gameId": str(game["_id"]), "endDate": past, "dailyMinutes": 60}).status_code == 400
    assert api.request("POST", "/v1/plans", USER_A, {"gameId": str(other["_id"]), "endDate": future, "dailyMinutes": 60}).status_code == 404
    assert api.request("POST", "/v1/plans", USER_A, {"gameId": str(game["_id"]), "endDate": future, "dailyMinutes": 5}).status_code == 422


def test_create_quest_plan_tool_labels_model_estimates(api, store, llm):
    store.add_game(USER_A, "Cyberpunk 2077")
    end = (TODAY + timedelta(days=14)).isoformat()
    llm.queue += [[("create_quest_plan", {"game": "cyberpunk", "end_date": end, "daily_minutes": 60, "estimated_hours": 25, "estimate_source": "model_estimate"})], "Plan ready"]
    res = chat(api, "I want to finish Cyberpunk in two weeks, 1 hour a day")
    data = results(llm, "create_quest_plan")[0]["data"]
    assert data["estimate"]["source"] == "model_estimate" and data["estimate"]["confidence"] == "low"
    assert res.json()["effects"]["plansChanged"] is True
    assert len(store.plans) == 1 and store.plans[0]["user"] == ObjectId(USER_A)
