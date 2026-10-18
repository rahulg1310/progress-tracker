"""Quest planner: daily milestones to finish a game by a deadline.

Progress is never ticked by hand or guessed by the model: each day's status
comes from the sessions the player actually logged for that game.
"""

import math
from collections import defaultdict
from datetime import date

from app.domain.timeutil import daterange, format_minutes, parse_day, session_day

DEFAULT_ESTIMATE_HOURS = 20
MAX_DAILY_MINUTES = 480
MIN_DAILY_MINUTES = 15


def make_estimate(estimated_hours: float | None, source_hint: str | None) -> dict:
    if estimated_hours and estimated_hours > 0:
        if source_hint == "model_estimate":
            return {
                "hours": round(float(estimated_hours), 1),
                "source": "model_estimate",
                "confidence": "low",
                "note": "Coach's rough estimate. Real length varies with playstyle and side content.",
            }
        return {"hours": round(float(estimated_hours), 1), "source": "user", "confidence": "high", "note": "Based on the length you provided."}
    return {
        "hours": DEFAULT_ESTIMATE_HOURS,
        "source": "default",
        "confidence": "low",
        "note": "No length was given, so this uses a 20h placeholder. Add your own estimate for a better plan.",
    }


def build_schedule(start: date, end: date, daily_minutes: int) -> list[dict]:
    return [{"date": day.isoformat(), "targetMinutes": int(daily_minutes)} for day in daterange(start, end)]


def minutes_by_day(sessions: list[dict], game_title: str, start: date, end: date) -> dict[date, int]:
    wanted = game_title.strip().lower()
    totals: dict[date, int] = defaultdict(int)
    for doc in sessions:
        if str(doc.get("game", "")).strip().lower() != wanted:
            continue
        day = session_day(doc.get("date"))
        if day is not None and start <= day <= end:
            try:
                totals[day] += max(0, int(round(float(doc.get("duration") or 0))))
            except (TypeError, ValueError):
                continue
    return totals


def _day_status(day: date, today: date, played: int, target: int) -> str:
    if day > today:
        return "upcoming"
    if target > 0 and played >= target:
        return "done"
    if day == today:
        return "today"
    if played >= target * 0.8:
        return "done"
    return "partial" if played > 0 else "missed"


def evaluate(plan: dict, sessions: list[dict], today: date) -> dict:
    """Plan as the frontend shows it, with live progress from real sessions."""
    start, end = parse_day(plan["startDate"]), parse_day(plan["endDate"])
    played_by_day = minutes_by_day(sessions, plan["gameTitle"], start, end)
    needed = plan["estimate"]["hours"] * 60
    played_total = sum(played_by_day.values())

    cumulative = 0
    milestones = []
    for idx, entry in enumerate(plan["schedule"]):
        day = parse_day(entry["date"])
        target = entry["targetMinutes"]
        cumulative += target
        played = played_by_day.get(day, 0)
        status = entry.get("status") if entry.get("status") == "skipped" else _day_status(day, today, played, target)
        milestones.append({
            "_id": f"{plan['_id']}-{idx + 1}",
            "date": entry["date"],
            "targetMinutes": target,
            "playedMinutes": played,
            "title": f"Play {format_minutes(target)} (reach ~{min(100, round(cumulative * 100 / needed))}% of the estimate)",
            "status": status,
        })

    remaining_days = [m for m in milestones if m["status"] in ("today", "upcoming")]
    remaining_needed = max(0, needed - played_total)
    capacity = sum(m["targetMinutes"] for m in remaining_days)
    if remaining_needed == 0:
        feasibility = "You've played enough to cover the estimate. Mark the game Completed when you finish!"
    elif today > end:
        feasibility = f"This plan ended on {end.strftime('%b %d')} with {format_minutes(remaining_needed)} of the estimate left."
    elif capacity >= remaining_needed:
        feasibility = f"On track: {format_minutes(remaining_needed)} left, and your remaining days cover it."
    else:
        per_day = math.ceil(remaining_needed / max(1, len(remaining_days)))
        feasibility = f"Behind schedule: {format_minutes(remaining_needed)} left. About {format_minutes(per_day)} a day would get you there."

    return {
        "_id": plan["_id"],
        "gameId": plan.get("gameId"),
        "gameTitle": plan["gameTitle"],
        "colorAccent": plan.get("colorAccent") or "#00f5a0",
        "startDate": plan["startDate"],
        "endDate": plan["endDate"],
        "dailyMinutes": plan["dailyMinutes"],
        "estimate": plan["estimate"],
        "milestones": milestones,
        "playedMinutes": played_total,
        "neededMinutes": needed,
        "progressPercent": min(100, round(played_total * 100 / needed)) if needed else 0,
        "feasibility": feasibility,
        "adjustmentNote": plan.get("adjustmentNote", ""),
        "version": plan.get("version", 1),
    }


def replan(plan: dict, sessions: list[dict], today: date) -> dict:
    """Spreads the remaining minutes over the days that are left. Past days stay as they were."""
    evaluated = evaluate(plan, sessions, today)
    remaining_needed = max(0, evaluated["neededMinutes"] - evaluated["playedMinutes"])
    remaining_dates = [m["date"] for m in evaluated["milestones"] if m["status"] in ("today", "upcoming")]
    if not remaining_dates:
        return {**plan, "adjustmentNote": "No days left in this plan. Create a new plan with a later deadline."}

    per_day = math.ceil(remaining_needed / len(remaining_dates)) if remaining_needed else 0
    capped = min(MAX_DAILY_MINUTES, max(MIN_DAILY_MINUTES, per_day)) if per_day else 0
    missed = [m for m in evaluated["milestones"] if m["status"] in ("missed", "partial")]
    schedule = []
    for entry in plan["schedule"]:
        if entry["date"] in remaining_dates:
            schedule.append({"date": entry["date"], "targetMinutes": capped})
        elif any(m["date"] == entry["date"] for m in missed):
            schedule.append({**entry, "status": "skipped"})
        else:
            schedule.append(entry)

    note = f"Spread the remaining {format_minutes(remaining_needed)} over {len(remaining_dates)} days: {format_minutes(capped)} a day."
    if per_day > MAX_DAILY_MINUTES:
        note += " That's more than 8h a day, so consider a later deadline."
    return {**plan, "schedule": schedule, "dailyMinutes": capped, "adjustmentNote": note, "version": plan.get("version", 1) + 1}
