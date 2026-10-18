from datetime import date, datetime, timedelta

from app.domain import planner
from app.errors import AppError
from app.repositories.library import GameRepository, SessionRepository
from app.repositories.plans import MAX_PLANS, PlanRepository


def _plain(plan: dict) -> dict:
    return {**plan, "_id": str(plan["_id"]), "gameId": str(plan.get("gameId", ""))}


class PlanService:
    def __init__(self, plans: PlanRepository, games: GameRepository, sessions: SessionRepository):
        self._plans = plans
        self._games = games
        self._sessions = sessions

    async def _sessions_for(self, user_id: str, plans: list[dict]) -> list[dict]:
        if not plans:
            return []
        start = min(date.fromisoformat(p["startDate"]) for p in plans)
        end = max(date.fromisoformat(p["endDate"]) for p in plans)
        return await self._sessions.list_between(user_id, start, end)

    async def list(self, user_id: str, today: date) -> list[dict]:
        plans = await self._plans.list_for_user(user_id)
        sessions = await self._sessions_for(user_id, plans)
        return [planner.evaluate(_plain(p), sessions, today) for p in plans]

    async def create(
        self, user_id: str, game_id: str, end_date: date, daily_minutes: int,
        estimated_hours: float | None, estimate_source: str | None, today: date, now: datetime,
    ) -> dict:
        game = await self._games.get_owned(user_id, game_id)
        if game is None:
            raise AppError(404, "NOT_FOUND", "Game not found in your library")
        if end_date <= today:
            raise AppError(400, "VALIDATION_ERROR", "The deadline must be after today")
        if end_date > today + timedelta(days=365):
            raise AppError(400, "VALIDATION_ERROR", "The deadline must be within a year")
        if not planner.MIN_DAILY_MINUTES <= daily_minutes <= planner.MAX_DAILY_MINUTES:
            raise AppError(400, "VALIDATION_ERROR", "Daily time must be between 15 minutes and 8 hours")
        if await self._plans.count_for_user(user_id) >= MAX_PLANS:
            raise AppError(400, "LIMIT_REACHED", f"You can have up to {MAX_PLANS} plans. Delete one first.")

        doc = {
            "gameId": str(game["_id"]),
            "gameTitle": game.get("title", "Game"),
            "colorAccent": game.get("colorAccent") or "#00f5a0",
            "startDate": today.isoformat(),
            "endDate": end_date.isoformat(),
            "dailyMinutes": int(daily_minutes),
            "estimate": planner.make_estimate(estimated_hours, estimate_source),
            "schedule": planner.build_schedule(today, end_date, int(daily_minutes)),
            "version": 1,
            "adjustmentNote": "",
            "createdAt": now,
        }
        saved = await self._plans.create(user_id, doc)
        sessions = await self._sessions_for(user_id, [saved])
        return planner.evaluate(_plain(saved), sessions, today)

    async def replan(self, user_id: str, plan_id: str, today: date, now: datetime) -> dict:
        plan = await self._plans.get_owned(user_id, plan_id)
        if plan is None:
            raise AppError(404, "NOT_FOUND", "Plan not found")
        sessions = await self._sessions_for(user_id, [plan])
        updated = planner.replan(_plain(plan), sessions, today)
        await self._plans.replace_schedule(user_id, {**updated, "_id": plan["_id"]}, now)
        return planner.evaluate(updated, sessions, today)

    async def delete(self, user_id: str, plan_id: str) -> None:
        if not await self._plans.delete_owned(user_id, plan_id):
            raise AppError(404, "NOT_FOUND", "Plan not found")
