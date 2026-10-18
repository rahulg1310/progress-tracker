"""Player-defined goals. Progress is measured from logged sessions inside the goal's window."""

from datetime import date, timedelta

from app.domain.timeutil import format_minutes, session_day

GOAL_TYPES = {
    "weekly_playtime": {"label": "Weekly Playtime", "unit": "minutes"},
    "active_days": {"label": "Active Days", "unit": "days"},
    "weekly_sessions": {"label": "Weekly Sessions", "unit": "sessions"},
}


def goal_title(goal_type: str, target: int) -> str:
    if goal_type == "weekly_playtime":
        return f"Play {format_minutes(target)}"
    if goal_type == "active_days":
        return f"Play on {target} days"
    return f"Log {target} sessions"


def goal_window(today: date, end: date) -> tuple[date, date]:
    """Goals count from the Monday of the week they were created in."""
    return today - timedelta(days=today.weekday()), end


def measure(goal: dict, sessions: list[dict]) -> int:
    start, end = date.fromisoformat(goal["startDate"]), date.fromisoformat(goal["endDate"])
    window = [s for s in sessions if (d := session_day(s.get("date"))) and start <= d <= end]
    if goal["type"] == "weekly_playtime":
        total = 0
        for s in window:
            try:
                total += max(0, int(round(float(s.get("duration") or 0))))
            except (TypeError, ValueError):
                continue
        return total
    if goal["type"] == "active_days":
        return len({session_day(s.get("date")) for s in window})
    return len(window)


def goal_view(goal: dict, sessions: list[dict], today: date) -> dict:
    current = measure(goal, sessions)
    end = date.fromisoformat(goal["endDate"])
    if current >= goal["targetValue"]:
        status = "met"
    elif today > end:
        status = "missed"
    else:
        status = "active"
    return {
        "_id": str(goal["_id"]),
        "type": goal["type"],
        "title": goal["title"],
        "targetValue": goal["targetValue"],
        "currentValue": current,
        "gameTitle": "",
        "startDate": goal["startDate"],
        "endDate": goal["endDate"],
        "status": status,
    }


def covers(goal_view_: dict, day: date) -> bool:
    return date.fromisoformat(goal_view_["startDate"]) <= day <= date.fromisoformat(goal_view_["endDate"])
