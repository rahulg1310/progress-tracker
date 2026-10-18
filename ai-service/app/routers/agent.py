from datetime import datetime, timezone

from fastapi import APIRouter, Depends

from app.deps import get_action_service, get_plan_service
from app.domain.timeutil import local_today
from app.models.api import ActionResponse, DeletedResponse, PlanCreateRequest, message_out
from app.security import ServiceContext, require_service_context
from app.services.action_service import ActionService
from app.services.plan_service import PlanService

router = APIRouter(prefix="/v1")


def _action_response(result: dict) -> ActionResponse:
    from app.agent.tools import to_jsonable

    return ActionResponse(
        action=to_jsonable(result["action"]),
        message=message_out(result["message"]) if result.get("message") else None,
        effects=to_jsonable(result["effects"]),
    )


@router.post("/actions/{action_id}/confirm", response_model=ActionResponse)
async def confirm_action(action_id: str, ctx: ServiceContext = Depends(require_service_context), service: ActionService = Depends(get_action_service)):
    return _action_response(await service.confirm(ctx, action_id))


@router.post("/actions/{action_id}/cancel", response_model=ActionResponse)
async def cancel_action(action_id: str, ctx: ServiceContext = Depends(require_service_context), service: ActionService = Depends(get_action_service)):
    return _action_response(await service.cancel(ctx, action_id))


@router.post("/actions/{action_id}/undo", response_model=ActionResponse)
async def undo_action(action_id: str, ctx: ServiceContext = Depends(require_service_context), service: ActionService = Depends(get_action_service)):
    return _action_response(await service.undo(ctx, action_id))


@router.get("/plans")
async def list_plans(ctx: ServiceContext = Depends(require_service_context), service: PlanService = Depends(get_plan_service)):
    return {"success": True, "plans": await service.list(ctx.user_id, local_today(ctx.timezone))}


@router.post("/plans", status_code=201)
async def create_plan(body: PlanCreateRequest, ctx: ServiceContext = Depends(require_service_context), service: PlanService = Depends(get_plan_service)):
    plan = await service.create(
        ctx.user_id, body.gameId, body.endDate, body.dailyMinutes, body.estimatedHours,
        "user" if body.estimatedHours else None, local_today(ctx.timezone), datetime.now(timezone.utc),
    )
    return {"success": True, "plan": plan}


@router.post("/plans/{plan_id}/replan")
async def replan(plan_id: str, ctx: ServiceContext = Depends(require_service_context), service: PlanService = Depends(get_plan_service)):
    plan = await service.replan(ctx.user_id, plan_id, local_today(ctx.timezone), datetime.now(timezone.utc))
    return {"success": True, "plan": plan}


@router.delete("/plans/{plan_id}", response_model=DeletedResponse)
async def delete_plan(plan_id: str, ctx: ServiceContext = Depends(require_service_context), service: PlanService = Depends(get_plan_service)):
    await service.delete(ctx.user_id, plan_id)
    return DeletedResponse(message="Plan deleted")
