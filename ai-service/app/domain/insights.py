"""Weekly and monthly progress summaries for the Insights page and the agent.

Every sentence in `summary` is generated from computed numbers, so the page
never shows a statistic that isn't in the player's data.
"""

from datetime import date, timedelta

from app.domain.analytics import summarize
from app.domain.timeutil import format_minutes, period_range, previous_range

PALETTE = ["#00f5a0", "#00d9f5", "#a78bfa", "#f9e020", "#f97316", "#ec4899", "#5fc9ec"]


def _colors(games: list[dict]) -> dict[str, str]:
    colors = {}
    for game in games:
        color = str(game.get("colorAccent") or "").lower()
        if color and color not in ("#ffffff", "#fff"):
            colors[str(game.get("title", "")).strip().lower()] = game["colorAccent"]
    return colors


def _range_label(start: date, end: date) -> str:
    if start.month == end.month:
        return f"{start.strftime('%b')} {start.day} - {end.day}"
    return f"{start.strftime('%b')} {start.day} - {end.strftime('%b')} {end.day}"


def _delta_sentence(current: int, previous: int, unit: str) -> str:
    diff = current - previous
    if diff == 0:
        return f"You played the same amount as last {unit} ({format_minutes(current)})."
    word = "more" if diff > 0 else "less"
    return f"You played {format_minutes(abs(diff))} {word} than last {unit} ({format_minutes(current)} vs {format_minutes(previous)})."


def _month_chart(sessions: list[dict], start: date, end: date, today: date) -> list[dict]:
    chart = []
    chunk_start = start
    while chunk_start <= end:
        chunk_end = min(end, chunk_start + timedelta(days=6))
        part = summarize(sessions, chunk_start, chunk_end, today)
        chart.append({
            "label": _range_label(chunk_start, chunk_end),
            "minutes": part["totalMinutes"],
            "sessions": part["sessions"],
            "isFuture": chunk_start > today,
        })
        chunk_start = chunk_end + timedelta(days=1)
    return chart


def build_period(sessions: list[dict], games: list[dict], unit: str, today: date, goal: dict | None) -> dict:
    period = "this_week" if unit == "week" else "this_month"
    start, end = period_range(period, today)
    prev_start, prev_end = previous_range(period, today)
    current = summarize(sessions, start, end, today)
    previous = summarize(sessions, prev_start, prev_end, today)

    if unit == "week":
        chart = [
            {"label": date.fromisoformat(d["date"]).strftime("%a"), "date": d["date"], "minutes": d["minutes"], "sessions": d["sessions"], "isFuture": d["isFuture"]}
            for d in current["byDay"]
        ]
    else:
        chart = _month_chart(sessions, start, end, today)

    colors = _colors(games)
    top_games = [
        {"title": g["title"], "minutes": g["minutes"], "sessions": g["sessions"], "color": colors.get(g["title"].strip().lower(), PALETTE[i % len(PALETTE)])}
        for i, g in enumerate(current["byGame"][:6])
    ]

    days_so_far = (min(today, end) - start).days + 1
    summary = []
    if current["sessions"] == 0:
        summary.append(f"No sessions logged this {unit} yet. Log one and your insights will appear here.")
        if previous["sessions"]:
            summary.append(f"Last {unit} you played {format_minutes(previous['totalMinutes'])} across {previous['sessions']} sessions.")
    else:
        summary.append(_delta_sentence(current["totalMinutes"], previous["totalMinutes"], unit))
        if previous["sessions"]:
            if current["avgSessionMinutes"] < previous["avgSessionMinutes"]:
                summary.append(f"Your sessions got shorter: {format_minutes(current['avgSessionMinutes'])} on average, down from {format_minutes(previous['avgSessionMinutes'])}.")
            elif current["avgSessionMinutes"] > previous["avgSessionMinutes"]:
                summary.append(f"Your sessions got longer: {format_minutes(current['avgSessionMinutes'])} on average, up from {format_minutes(previous['avgSessionMinutes'])}.")
        summary.append(f"You played on {current['activeDays']} of the {days_so_far} days so far.")
        top = current["byGame"][0]
        summary.append(f"{top['title']} took {round(top['minutes'] * 100 / current['totalMinutes'])}% of your playtime.")
        if unit == "week":
            best = max(current["byDay"], key=lambda d: d["minutes"])
            summary.append(f"Your biggest day was {date.fromisoformat(best['date']).strftime('%A')} ({format_minutes(best['minutes'])}).")
    if goal:
        gap = goal["target"] - goal["current"]
        summary.append(f"Weekly goal reached: {format_minutes(goal['current'])} of {format_minutes(goal['target'])}." if gap <= 0 else f"You're {format_minutes(gap)} away from your weekly goal of {format_minutes(goal['target'])}.")

    label = _range_label(start, end) if unit == "week" else start.strftime("%B %Y")
    return {
        "unit": unit,
        "title": "This Week" if unit == "week" else "This Month",
        "range": label,
        "totalMinutes": current["totalMinutes"],
        "prevTotalMinutes": previous["totalMinutes"],
        "sessions": current["sessions"],
        "prevSessions": previous["sessions"],
        "avgSessionMinutes": current["avgSessionMinutes"],
        "prevAvgSessionMinutes": previous["avgSessionMinutes"],
        "activeDays": current["activeDays"],
        "prevActiveDays": previous["activeDays"],
        "chart": chart,
        "topGames": top_games,
        "goal": goal,
        "summary": summary,
        "basedOn": f"Based on {current['sessions']} session{'s' if current['sessions'] != 1 else ''} logged in {label}.",
    }
