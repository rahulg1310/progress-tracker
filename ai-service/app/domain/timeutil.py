"""Calendar helpers.

Session.date is saved by Mongoose from a "YYYY-MM-DD" string, so it is stored
as UTC midnight. The calendar day a session belongs to is therefore its UTC
date, regardless of the player's time zone. "Today" and week boundaries, on the
other hand, come from the player's own time zone.
"""

from datetime import date, datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo

PERIODS = ("this_week", "last_week", "this_month", "last_month", "last_7_days", "last_30_days", "all_time")


def local_today(tz_name: str, now: datetime | None = None) -> date:
    now = now or datetime.now(timezone.utc)
    return now.astimezone(ZoneInfo(tz_name)).date()


def session_day(value) -> date | None:
    if isinstance(value, datetime):
        if value.tzinfo is not None:
            value = value.astimezone(timezone.utc)
        return value.date()
    if isinstance(value, date):
        return value
    if isinstance(value, str):
        try:
            return date.fromisoformat(value[:10])
        except ValueError:
            return None
    return None


def day_start_utc(day: date) -> datetime:
    """The stored value for a calendar day (UTC midnight)."""
    return datetime.combine(day, time.min, tzinfo=timezone.utc)


def parse_day(value: str) -> date:
    return date.fromisoformat(value)


def _month_start(day: date) -> date:
    return day.replace(day=1)


def period_range(period: str, today: date) -> tuple[date, date]:
    """Inclusive (start, end) for a named period."""
    monday = today - timedelta(days=today.weekday())
    if period == "this_week":
        return monday, monday + timedelta(days=6)
    if period == "last_week":
        return monday - timedelta(days=7), monday - timedelta(days=1)
    if period == "this_month":
        start = _month_start(today)
        next_month = (start + timedelta(days=32)).replace(day=1)
        return start, next_month - timedelta(days=1)
    if period == "last_month":
        end = _month_start(today) - timedelta(days=1)
        return _month_start(end), end
    if period == "last_7_days":
        return today - timedelta(days=6), today
    if period == "last_30_days":
        return today - timedelta(days=29), today
    raise ValueError(f"Unknown period: {period}")


def previous_range(period: str, today: date) -> tuple[date, date] | None:
    """The period to compare against."""
    if period in ("this_week", "last_week"):
        start, _ = period_range(period, today)
        return start - timedelta(days=7), start - timedelta(days=1)
    if period in ("this_month", "last_month"):
        start, _ = period_range(period, today)
        prev_end = start - timedelta(days=1)
        return _month_start(prev_end), prev_end
    if period in ("last_7_days", "last_30_days"):
        start, end = period_range(period, today)
        length = (end - start).days + 1
        return start - timedelta(days=length), start - timedelta(days=1)
    return None


def daterange(start: date, end: date):
    day = start
    while day <= end:
        yield day
        day += timedelta(days=1)


def format_minutes(minutes: float) -> str:
    total = max(0, int(round(minutes or 0)))
    hours, mins = divmod(total, 60)
    if hours == 0:
        return f"{mins}m"
    if mins == 0:
        return f"{hours}h"
    return f"{hours}h {mins}m"
