"""Daily dashboard briefing: facts and headline are computed; Coach may only rephrase the text."""

from datetime import date

from app.domain.timeutil import format_minutes


def build_briefing(today: date, week: dict, goals: list[dict], streak: dict, plans: list[dict]) -> dict:
    facts: dict = {"date": today.isoformat(), "weekday": today.strftime("%A")}
    items = []

    playtime_goal = next((g for g in goals if g["type"] == "weekly_playtime" and g["status"] in ("active", "met")
                          and g["startDate"] <= today.isoformat() <= g["endDate"]), None)
    days_goal = next((g for g in goals if g["type"] == "active_days" and g["status"] in ("active", "met")
                      and g["startDate"] <= today.isoformat() <= g["endDate"]), None)
    today_plan = None
    for plan in plans:
        milestone = next((m for m in plan["milestones"] if m["date"] == today.isoformat()), None)
        if milestone and milestone["status"] == "today":
            today_plan = (plan, milestone)
            break

    facts.update({
        "weekPlaytimeMinutes": week["totalMinutes"],
        "lastWeekPlaytimeMinutes": week["prevTotalMinutes"],
        "weekSessions": week["sessions"],
        "streakDays": streak["current"],
        "streakAtRisk": streak["atRisk"],
    })

    headline, text, prompt = None, None, "How is my week going?"
    if playtime_goal:
        gap = playtime_goal["targetValue"] - playtime_goal["currentValue"]
        facts["weeklyGoal"] = {"targetMinutes": playtime_goal["targetValue"], "currentMinutes": playtime_goal["currentValue"], "endDate": playtime_goal["endDate"]}
        items.append({"label": "Weekly Goal", "value": f"{format_minutes(playtime_goal['currentValue'])} / {format_minutes(playtime_goal['targetValue'])}", "tone": "cyan"})
        if gap > 0:
            headline = f"You're {format_minutes(gap)} away from your weekly goal"
            text = f"You've logged {format_minutes(playtime_goal['currentValue'])} of your {format_minutes(playtime_goal['targetValue'])} goal so far."
            prompt = "Help me plan sessions to hit my weekly goal"
        else:
            headline = "Weekly playtime goal reached"
            text = f"You've logged {format_minutes(playtime_goal['currentValue'])}, beating your {format_minutes(playtime_goal['targetValue'])} goal."
    if days_goal and not headline:
        left = days_goal["targetValue"] - days_goal["currentValue"]
        if left > 0:
            headline = f"Play on {left} more day{'s' if left > 1 else ''} to meet your consistency goal"
            text = f"You've played on {days_goal['currentValue']} days this week."

    if today_plan:
        plan, milestone = today_plan
        facts["questToday"] = {"game": plan["gameTitle"], "targetMinutes": milestone["targetMinutes"], "playedMinutes": milestone["playedMinutes"]}
        if not headline:
            headline = f"Today's quest: {format_minutes(milestone['targetMinutes'])} of {plan['gameTitle']}"
            text = plan["feasibility"]
            prompt = f"How am I doing on my {plan['gameTitle']} plan?"

    if streak["current"]:
        items.append({"label": "Streak", "value": f"{streak['current']} day{'s' if streak['current'] != 1 else ''}", "tone": "orange"})
        if streak["atRisk"] and not headline:
            headline = f"Keep your {streak['current']}-day streak alive"
            text = "You haven't logged a session today yet."

    diff = week["totalMinutes"] - week["prevTotalMinutes"]
    items.append({"label": "vs Last Week", "value": f"{'+' if diff >= 0 else '-'}{format_minutes(abs(diff))}", "tone": "green" if diff >= 0 else "red"})

    if not headline:
        if week["sessions"]:
            headline = f"{format_minutes(week['totalMinutes'])} played this week"
            text = f"Across {week['sessions']} session{'s' if week['sessions'] != 1 else ''} on {week['activeDays']} day{'s' if week['activeDays'] != 1 else ''}."
        else:
            headline = "Ready for your first session this week?"
            text = "Log a session or set a weekly goal and Coach will track it for you."
            prompt = "Help me set a weekly gaming goal"

    return {"date": today.isoformat(), "headline": headline, "text": text, "items": items[:3], "prompt": prompt, "facts": facts}
