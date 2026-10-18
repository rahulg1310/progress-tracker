"""Deterministic statistics over the player's real session records.

Gemini never calculates numbers. It receives these results and explains them.
"""

from collections import defaultdict
from datetime import date

from app.domain.timeutil import daterange, format_minutes, period_range, previous_range, session_day


def _minutes(doc: dict) -> int:
    try:
        return max(0, int(round(float(doc.get("duration") or 0))))
    except (TypeError, ValueError):
        return 0


def summarize(sessions: list[dict], start: date, end: date, today: date) -> dict:
    """Totals for sessions whose calendar day is within [start, end]."""
    in_range = []
    for doc in sessions:
        day = session_day(doc.get("date"))
        if day is not None and start <= day <= end:
            in_range.append((day, doc))

    total = sum(_minutes(doc) for _, doc in in_range)
    count = len(in_range)
    by_day: dict[date, dict] = defaultdict(lambda: {"minutes": 0, "sessions": 0})
    by_game: dict[str, dict] = {}
    results = {"Win": 0, "Loss": 0, "Draw": 0}

    for day, doc in in_range:
        minutes = _minutes(doc)
        by_day[day]["minutes"] += minutes
        by_day[day]["sessions"] += 1
        title = str(doc.get("game") or "Unknown").strip() or "Unknown"
        key = title.lower()
        if key not in by_game:
            by_game[key] = {"title": title, "minutes": 0, "sessions": 0}
        by_game[key]["minutes"] += minutes
        by_game[key]["sessions"] += 1
        if doc.get("result") in results:
            results[doc["result"]] += 1

    decided = results["Win"] + results["Loss"] + results["Draw"]
    days = [
        {
            "date": day.isoformat(),
            "minutes": by_day[day]["minutes"] if day in by_day else 0,
            "sessions": by_day[day]["sessions"] if day in by_day else 0,
            "isFuture": day > today,
        }
        for day in daterange(start, end)
    ]
    return {
        "start": start.isoformat(),
        "end": end.isoformat(),
        "totalMinutes": total,
        "totalPlaytime": format_minutes(total),
        "sessions": count,
        "avgSessionMinutes": round(total / count) if count else 0,
        "longestSessionMinutes": max((_minutes(doc) for _, doc in in_range), default=0),
        "activeDays": sum(1 for d in by_day.values() if d["sessions"] > 0),
        "byGame": sorted(by_game.values(), key=lambda g: g["minutes"], reverse=True),
        "byDay": days,
        "results": results if decided else None,
        "winRatePercent": round(results["Win"] * 100 / decided) if decided else None,
    }


def _change(current: float, previous: float) -> dict:
    diff = current - previous
    pct = round(diff * 100 / previous) if previous else None
    return {"difference": diff, "percent": pct}


def period_stats(sessions: list[dict], period: str, today: date) -> dict:
    """Stats for a named period plus a comparison with the period before it."""
    if period == "all_time":
        days = [d for d in (session_day(s.get("date")) for s in sessions) if d]
        start = min(days) if days else today
        current = summarize(sessions, start, max(today, max(days) if days else today), today)
        current["byDay"] = []  # too long to be useful for all time
        return {"period": period, "current": current, "previous": None, "change": None}

    start, end = period_range(period, today)
    current = summarize(sessions, start, end, today)
    prev = previous_range(period, today)
    previous = summarize(sessions, prev[0], prev[1], today) if prev else None
    change = None
    if previous:
        change = {
            "totalMinutes": _change(current["totalMinutes"], previous["totalMinutes"]),
            "sessions": _change(current["sessions"], previous["sessions"]),
            "avgSessionMinutes": _change(current["avgSessionMinutes"], previous["avgSessionMinutes"]),
            "activeDays": _change(current["activeDays"], previous["activeDays"]),
        }
        previous = {k: v for k, v in previous.items() if k not in ("byDay",)}
    return {"period": period, "current": current, "previous": previous, "change": change}


def stat_chips(stats: dict) -> list[dict]:
    """Small summary cards shown under Coach's reply (values straight from the data)."""
    current = stats["current"]
    chips = [
        {"label": "Playtime", "value": format_minutes(current["totalMinutes"])},
        {"label": "Sessions", "value": str(current["sessions"])},
        {"label": "Avg Session", "value": format_minutes(current["avgSessionMinutes"])},
        {"label": "Active Days", "value": str(current["activeDays"])},
    ]
    return chips
