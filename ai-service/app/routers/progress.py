from datetime import date, datetime, timezone
from typing import Literal

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict, Field

from app.deps import get_progress_service, get_recommendation_service
from app.domain.timeutil import local_today
from app.models.api import DeletedResponse
from app.security import ServiceContext, require_service_context
from app.services.progress_service import ProgressService
from app.services.recommendation_service import RecommendationService

router = APIRouter(prefix="/v1")


class GoalCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    type: Literal["weekly_playtime", "active_days", "weekly_sessions"]
    target: float = Field(gt=0, le=100)
    endDate: date


class RecommendRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    likedGames: list[str] = Field(default_factory=list, max_length=6)
    mood: str = Field(default="", max_length=200)
    platform: Literal["PC", "PS5", "PS4", "Xbox", "Switch", "Mobile"] | None = None


def _now() -> datetime:
    return datetime.now(timezone.utc)


@router.get("/insights")
async def insights(ctx: ServiceContext = Depends(require_service_context), service: ProgressService = Depends(get_progress_service)):
    return {"success": True, "insights": await service.insights(ctx.user_id, local_today(ctx.timezone))}


@router.get("/goals")
async def list_goals(ctx: ServiceContext = Depends(require_service_context), service: ProgressService = Depends(get_progress_service)):
    return {"success": True, "goals": await service.goal_views(ctx.user_id, local_today(ctx.timezone))}


@router.post("/goals", status_code=201)
async def create_goal(body: GoalCreateRequest, ctx: ServiceContext = Depends(require_service_context), service: ProgressService = Depends(get_progress_service)):
    goal = await service.create_goal(ctx.user_id, body.type, body.target, body.endDate, local_today(ctx.timezone), _now())
    return {"success": True, "goal": goal}


@router.delete("/goals/{goal_id}", response_model=DeletedResponse)
async def delete_goal(goal_id: str, ctx: ServiceContext = Depends(require_service_context), service: ProgressService = Depends(get_progress_service)):
    await service.delete_goal(ctx.user_id, goal_id)
    return DeletedResponse(message="Goal deleted")


@router.get("/overview")
async def overview(ctx: ServiceContext = Depends(require_service_context), service: ProgressService = Depends(get_progress_service)):
    """Insights, goals, briefing and plans in one request (one data load)."""
    return {"success": True, **await service.overview(ctx.user_id, local_today(ctx.timezone), _now())}


@router.get("/briefing")
async def get_briefing(ctx: ServiceContext = Depends(require_service_context), service: ProgressService = Depends(get_progress_service)):
    return {"success": True, "briefing": await service.briefing(ctx.user_id, local_today(ctx.timezone), _now())}


@router.post("/recommendations")
async def recommend(body: RecommendRequest, ctx: ServiceContext = Depends(require_service_context), service: RecommendationService = Depends(get_recommendation_service)):
    liked = [t[:100] for t in body.likedGames if t]
    return {"success": True, **await service.recommend(ctx.user_id, liked, body.mood, body.platform)}
