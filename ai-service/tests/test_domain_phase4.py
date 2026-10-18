from datetime import date, datetime, timedelta, timezone

from app.domain import briefing, goals, insights, recommender, streaks

TODAY = date(2026, 10, 18)  # a Sunday


def s(day: str, minutes: int, game: str = "Elden Ring") -> dict:
    return {"game": game, "duration": minutes, "date": datetime.fromisoformat(day).replace(tzinfo=timezone.utc)}


# ----------------------------------------------------------------- streaks
def test_streak_survives_until_end_of_today():
    sessions = [s("2026-10-15", 30), s("2026-10-16", 30), s("2026-10-17", 30)]
    result = streaks.current_streak(sessions, TODAY)
    assert result == {"current": 3, "playedToday": False, "atRisk": True}
    assert streaks.current_streak(sessions + [s("2026-10-18", 10)], TODAY)["current"] == 4


def test_broken_streak():
    assert streaks.current_streak([s("2026-10-15", 30)], TODAY)["current"] == 0


# ------------------------------------------------------------------- goals
def test_goal_progress_and_status():
    start, end = goals.goal_window(date(2026, 10, 15), date(2026, 10, 18))
    assert start == date(2026, 10, 12)
    goal = {"_id": "g", "type": "weekly_playtime", "title": "Play 6h", "targetValue": 360, "startDate": start.isoformat(), "endDate": end.isoformat()}
    sessions = [s("2026-10-12", 120), s("2026-10-18", 90), s("2026-10-11", 500)]
    view = goals.goal_view(goal, sessions, TODAY)
    assert view["currentValue"] == 210 and view["status"] == "active"
    assert goals.goal_view(goal, sessions, date(2026, 10, 19))["status"] == "missed"
    assert goals.goal_view({**goal, "type": "active_days", "targetValue": 2}, sessions, TODAY)["status"] == "met"
    assert goals.goal_title("weekly_playtime", 360) == "Play 6h"


# ----------------------------------------------------------------- insights
def test_week_insights_shape_and_summary():
    sessions = [s("2026-10-13", 60, "Sekiro"), s("2026-10-17", 90), s("2026-10-06", 120)]
    games = [{"title": "Elden Ring", "colorAccent": "#e7b427"}, {"title": "Sekiro", "colorAccent": "#FFFFFF"}]
    week = insights.build_period(sessions, games, "week", TODAY, {"title": "Weekly Playtime", "current": 150, "target": 360, "unit": "minutes"})
    assert week["totalMinutes"] == 150 and week["prevTotalMinutes"] == 120 and len(week["chart"]) == 7
    assert week["chart"][0]["label"] == "Mon" and week["range"] == "Oct 12 - 18"
    assert week["topGames"][0] == {"title": "Elden Ring", "minutes": 90, "sessions": 1, "color": "#e7b427"}
    assert week["topGames"][1]["color"] != "#FFFFFF"
    assert week["summary"][0] == "You played 30m more than last week (2h 30m vs 2h)."
    assert any("biggest day was Saturday" in line for line in week["summary"])
    assert any("3h 30m away from your weekly goal" in line for line in week["summary"])


def test_month_insights_and_empty_state():
    month = insights.build_period([], [], "month", TODAY, None)
    assert month["range"] == "October 2026" and [c["label"] for c in month["chart"]][0] == "Oct 1 - 7"
    assert len(month["chart"]) == 5 and month["chart"][-1]["isFuture"] is True
    assert month["summary"][0].startswith("No sessions logged this month yet")


# ------------------------------------------------------------------ briefing
def test_briefing_prioritises_goal_gap():
    week = {"totalMinutes": 150, "prevTotalMinutes": 120, "sessions": 2, "activeDays": 2}
    goal = {"type": "weekly_playtime", "status": "active", "startDate": "2026-10-12", "endDate": "2026-10-18", "targetValue": 360, "currentValue": 150}
    result = briefing.build_briefing(TODAY, week, [goal], {"current": 2, "atRisk": False}, [])
    assert result["headline"] == "You're 3h 30m away from your weekly goal"
    assert [i["label"] for i in result["items"]] == ["Weekly Goal", "Streak", "vs Last Week"]
    assert result["facts"]["weeklyGoal"]["currentMinutes"] == 150


def test_briefing_with_no_data():
    week = {"totalMinutes": 0, "prevTotalMinutes": 0, "sessions": 0, "activeDays": 0}
    result = briefing.build_briefing(TODAY, week, [], {"current": 0, "atRisk": False}, [])
    assert result["headline"] == "Ready for your first session this week?"


# --------------------------------------------------------------- recommender
def rawg(id_, name, tags, genres, rating=4.3, count=500, playtime=30, platforms=("PC",)):
    return {
        "id": id_, "name": name, "rating": rating, "ratings_count": count, "playtime": playtime, "released": "2023-09-19",
        "tags": [{"slug": t.lower().replace(" ", "-"), "name": t, "language": "eng"} for t in tags],
        "genres": [{"slug": g.lower(), "name": g} for g in genres],
        "platforms": [{"platform": {"name": p}} for p in platforms], "background_image": "https://img/x.jpg",
    }


SEKIRO = rawg(1, "Sekiro: Shadows Die Twice", ["Souls-like", "Difficult", "Singleplayer", "Ninja"], ["Action", "Adventure"])
WUKONG = rawg(2, "Black Myth: Wukong", ["Souls-like", "Mythology", "Difficult"], ["Action", "RPG"])


def test_recommender_ranks_by_taste_and_explains():
    profile = recommender.build_profile([SEKIRO, WUKONG])
    assert "singleplayer" not in profile["tags"]
    candidates = [
        rawg(10, "Lies of P", ["Souls-like", "Difficult"], ["Action", "RPG"], platforms=("PC", "PlayStation 5", "Xbox Series S/X")),
        rawg(11, "Cozy Farm", ["Relaxing", "Farming"], ["Simulation"], rating=4.5),
        rawg(12, "Elden Ring", ["Souls-like", "Difficult"], ["Action", "RPG"]),         # already owned
        rawg(1, "Sekiro: Shadows Die Twice", ["Souls-like"], ["Action"]),                # a liked game
        rawg(13, "Obscure", ["Souls-like"], ["Action"], count=3),                         # too few ratings
        rawg(14, "Long Souls", ["Souls-like", "Difficult"], ["Action"], playtime=80),
    ]
    library = [{"title": "ELDEN RING"}]
    picks = recommender.rank(candidates, profile, library, ["Sekiro", "Black Myth: Wukong"], max_hours=None)
    titles = [p["title"] for p in picks]
    assert titles[0] == "Lies of P"
    assert "Elden Ring" not in titles and "Sekiro: Shadows Die Twice" not in titles and "Obscure" not in titles
    assert titles.index("Cozy Farm") > titles.index("Lies of P")
    top = picks[0]
    assert top["platforms"] == ["PC", "PS5", "Xbox"] and top["released"] == "2023" and top["match"] == 99
    assert top["reasons"][0].startswith("Shares Souls-like, Difficult with")
    short = recommender.rank(candidates, profile, library, [], max_hours=40)
    assert "Long Souls" not in [p["title"] for p in short]


def test_parse_max_hours():
    assert recommender.parse_max_hours("something under 20 hours with bosses") == 20
    assert recommender.parse_max_hours("a short game") == 15
    assert recommender.parse_max_hours("open world") is None
