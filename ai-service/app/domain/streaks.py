"""Play streak (consecutive days with at least one session), used by the dashboard briefing."""

from datetime import date, timedelta

from app.domain.timeutil import session_day


def played_days(sessions: list[dict]) -> set[date]:
    return {d for d in (session_day(s.get("date")) for s in sessions) if d is not None}


def current_streak(sessions: list[dict], today: date) -> dict:
    """The streak stays alive until the end of today even if today isn't logged yet."""
    days = played_days(sessions)
    day = today if today in days else today - timedelta(days=1)
    current = 0
    while day in days:
        current += 1
        day -= timedelta(days=1)
    return {"current": current, "playedToday": today in days, "atRisk": current > 0 and today not in days}
