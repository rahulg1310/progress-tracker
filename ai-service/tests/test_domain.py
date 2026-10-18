from datetime import date, datetime, timezone

import pytest

from app.domain import analytics, game_resolver, planner, timeutil


def s(day: str, minutes: int, game: str = "Elden Ring", result: str = "") -> dict:
    """A session exactly as Mongoose stores it (date at UTC midnight)."""
    return {"game": game, "duration": minutes, "result": result, "date": datetime.fromisoformat(day).replace(tzinfo=timezone.utc)}


# ---------------------------------------------------------------- time
def test_week_starts_monday():
    sunday = date(2026, 10, 18)
    assert timeutil.period_range("this_week", sunday) == (date(2026, 10, 12), date(2026, 10, 18))
    assert timeutil.period_range("last_week", sunday) == (date(2026, 10, 5), date(2026, 10, 11))


def test_month_ranges_handle_year_boundary():
    assert timeutil.period_range("last_month", date(2026, 1, 10)) == (date(2025, 12, 1), date(2025, 12, 31))
    assert timeutil.period_range("this_month", date(2026, 2, 3)) == (date(2026, 2, 1), date(2026, 2, 28))


def test_local_today_uses_player_timezone():
    utc_evening = datetime(2026, 10, 18, 20, 0, tzinfo=timezone.utc)   # 01:30 next day in India
    assert timeutil.local_today("Asia/Kolkata", utc_evening) == date(2026, 10, 19)
    assert timeutil.local_today("America/Los_Angeles", utc_evening) == date(2026, 10, 18)


def test_session_day_is_the_stored_utc_date():
    stored = datetime(2026, 10, 18, 0, 0, tzinfo=timezone.utc)
    assert timeutil.session_day(stored) == date(2026, 10, 18)


def test_format_minutes():
    assert [timeutil.format_minutes(m) for m in (0, 45, 60, 270)] == ["0m", "45m", "1h", "4h 30m"]


# ----------------------------------------------------------- analytics
SESSIONS = [
    s("2026-10-12", 45), s("2026-10-14", 60), s("2026-10-14", 30, "Sekiro"),
    s("2026-10-17", 90, "Sekiro", "Win"), s("2026-10-18", 45, "Valorant", "Loss"),
    s("2026-10-06", 120), s("2026-10-09", 60),          # last week
    s("2026-09-30", 500),                               # previous month
]
TODAY = date(2026, 10, 18)


def test_this_week_totals_and_comparison():
    stats = analytics.period_stats(SESSIONS, "this_week", TODAY)
    cur = stats["current"]
    assert cur["totalMinutes"] == 270 and cur["sessions"] == 5 and cur["avgSessionMinutes"] == 54
    assert cur["activeDays"] == 4 and cur["longestSessionMinutes"] == 90
    assert [g["title"] for g in cur["byGame"]] == ["Sekiro", "Elden Ring", "Valorant"]
    assert cur["winRatePercent"] == 50
    assert stats["previous"]["totalMinutes"] == 180
    assert stats["change"]["totalMinutes"] == {"difference": 90, "percent": 50}
    assert stats["change"]["avgSessionMinutes"]["difference"] == 54 - 90


def test_by_day_marks_future_days():
    cur = analytics.period_stats(SESSIONS, "this_week", date(2026, 10, 15))["current"]
    assert [d["isFuture"] for d in cur["byDay"]] == [False, False, False, False, True, True, True]


def test_empty_data_is_zero_not_error():
    stats = analytics.period_stats([], "last_30_days", TODAY)
    assert stats["current"]["totalMinutes"] == 0 and stats["current"]["avgSessionMinutes"] == 0
    assert stats["change"]["totalMinutes"]["percent"] is None


def test_all_time():
    stats = analytics.period_stats(SESSIONS, "all_time", TODAY)
    assert stats["current"]["totalMinutes"] == sum(x["duration"] for x in SESSIONS)
    assert stats["previous"] is None


def test_bad_durations_are_ignored():
    stats = analytics.period_stats([s("2026-10-18", 30), {"game": "X", "duration": "abc", "date": s("2026-10-18", 0)["date"]}], "this_week", TODAY)
    assert stats["current"]["totalMinutes"] == 30


# ------------------------------------------------------------ resolver
LIBRARY = [{"_id": "1", "title": "Elden Ring"}, {"_id": "2", "title": "Sekiro: Shadows Die Twice"}, {"_id": "3", "title": "Cyberpunk 2077"}, {"_id": "4", "title": "Dark Souls III"}, {"_id": "5", "title": "Dark Souls II"}]


@pytest.mark.parametrize("query,expected", [("elden ring", "1"), ("Elden", "1"), ("sekiro", "2"), ("cyberpunk", "3"), ("Cyberpunk2077", "3"), ("dark souls 3", None), ("Dark Souls III", "4")])
def test_resolver(query, expected):
    result = game_resolver.resolve(query, LIBRARY)
    assert (result["match"]["_id"] if result["match"] else None) == expected


def test_ambiguous_titles_return_candidates_not_a_guess():
    result = game_resolver.resolve("dark souls", LIBRARY)
    assert result["match"] is None
    assert {c["game"]["_id"] for c in result["candidates"]} >= {"4", "5"}


def test_unknown_game():
    assert game_resolver.resolve("Hollow Knight", LIBRARY) == {"match": None, "candidates": []}


# -------------------------------------------------------------- planner
def make_plan(start="2026-10-14", end="2026-10-20", daily=60, hours=7):
    return {
        "_id": "p1", "gameTitle": "Elden Ring", "startDate": start, "endDate": end, "dailyMinutes": daily,
        "estimate": planner.make_estimate(hours, "user"),
        "schedule": planner.build_schedule(date.fromisoformat(start), date.fromisoformat(end), daily),
    }


def test_milestones_track_real_sessions():
    plan = make_plan()
    sessions = [s("2026-10-14", 60), s("2026-10-15", 20), s("2026-10-17", 50), s("2026-10-18", 30), s("2026-10-16", 300, "Sekiro")]
    result = planner.evaluate(plan, sessions, TODAY)
    statuses = [m["status"] for m in result["milestones"]]
    # 14 done, 15 partial, 16 missed (Sekiro doesn't count), 17 done (>=80%), 18 today (30/60), 19-20 upcoming
    assert statuses == ["done", "partial", "missed", "done", "today", "upcoming", "upcoming"]
    assert result["playedMinutes"] == 160
    assert result["progressPercent"] == round(160 * 100 / 420)


def test_estimate_labels():
    assert planner.make_estimate(30, "user")["source"] == "user"
    assert planner.make_estimate(30, "model_estimate")["confidence"] == "low"
    assert planner.make_estimate(None, None)["source"] == "default"


def test_replan_spreads_remaining_time():
    plan = make_plan()
    sessions = [s("2026-10-14", 60), s("2026-10-17", 60)]
    new = planner.replan(plan, sessions, TODAY)
    # needed 420, played 120 -> 300 left over 18, 19, 20 -> 100 each
    remaining = [e for e in new["schedule"] if e["date"] >= "2026-10-18"]
    assert all(e["targetMinutes"] == 100 for e in remaining)
    assert {e["date"] for e in new["schedule"] if e.get("status") == "skipped"} == {"2026-10-15", "2026-10-16"}
    assert new["version"] == 2 and "300" not in new["adjustmentNote"] and "5h" in new["adjustmentNote"]
    evaluated = planner.evaluate(new, sessions, TODAY)
    assert [m["status"] for m in evaluated["milestones"]][:4] == ["done", "skipped", "skipped", "done"]


def test_replan_warns_when_too_much_per_day():
    plan = make_plan(hours=100)
    new = planner.replan(plan, [], TODAY)
    assert "later deadline" in new["adjustmentNote"]
    assert all(e["targetMinutes"] <= planner.MAX_DAILY_MINUTES for e in new["schedule"])
