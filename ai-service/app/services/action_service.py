"""Confirm / cancel / undo for the action cards the agent creates.

Each transition is claimed atomically in MongoDB, so a double click or a
replayed request can never apply the same change twice.
"""

import logging
from datetime import datetime, timezone

from app.agent.tools import card
from app.clients.core_api import CoreApiClient, CoreApiError
from app.errors import AppError
from app.repositories.actions import ActionRepository
from app.repositories.conversations import ConversationRepository, MessageRepository
from app.security import ServiceContext

logger = logging.getLogger("kairo.actions")


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def empty_effects() -> dict:
    return {"sessionsAdded": [], "sessionsDeleted": [], "gamesUpdated": [], "plansChanged": False, "memoriesChanged": False}


class ActionService:
    def __init__(self, actions: ActionRepository, messages: MessageRepository, conversations: ConversationRepository, core: CoreApiClient):
        self._actions = actions
        self._messages = messages
        self._conversations = conversations
        self._core = core

    async def _settle(self, ctx: ServiceContext, action: dict, status: str, text: str, effects: dict, result: dict | None = None) -> dict:
        now = utcnow()
        await self._actions.finish(ctx.user_id, action["_id"], status, now, result)
        message = None
        if action.get("message"):
            await self._messages.set_action_status(ctx.user_id, action["message"], action["_id"], status)
        if action.get("conversation"):
            message = await self._messages.add(ctx.user_id, action["conversation"], "assistant", text, now)
            await self._conversations.touch(ctx.user_id, action["conversation"], now)
        return {"action": card({**action, "status": status}), "message": message, "effects": effects}

    async def _explain_claim_failure(self, ctx: ServiceContext, action_id: str, expected: str, deadline_field: str | None) -> None:
        existing = await self._actions.get_owned(ctx.user_id, action_id)
        if existing is None:
            raise AppError(404, "NOT_FOUND", "Action not found")
        if existing["status"] == expected and deadline_field:
            if expected == "pending":
                await self._actions.finish(ctx.user_id, existing["_id"], "expired", utcnow())
                if existing.get("message"):
                    await self._messages.set_action_status(ctx.user_id, existing["message"], existing["_id"], "expired")
                raise AppError(409, "EXPIRED", "This request expired. Ask Coach again if you still want the change.")
            raise AppError(409, "UNDO_EXPIRED", "The 5-minute undo window has passed. You can delete the session from the Sessions page.")
        raise AppError(409, "ALREADY_HANDLED", f"This action is already {existing['status']}.")

    async def confirm(self, ctx: ServiceContext, action_id: str) -> dict:
        action = await self._actions.claim(ctx.user_id, action_id, "pending", "executing", utcnow(), "expiresAt")
        if action is None:
            await self._explain_claim_failure(ctx, action_id, "pending", "expiresAt")
        payload, effects = action.get("payload", {}), empty_effects()
        try:
            if action["type"] == "update_game":
                response = await self._core.update_game(ctx.user_id, payload["gameId"], payload["changes"])
                effects["gamesUpdated"].append(response.get("game"))
                changes = ", ".join(f"{d['label']} {d['value']}" for d in action.get("details", []))
                text = f"Done. {payload.get('gameTitle', 'Your game')} updated: {changes}."
            elif action["type"] == "delete_session":
                await self._core.delete_session(ctx.user_id, payload["sessionId"])
                effects["sessionsDeleted"].append(payload["sessionId"])
                text = "Done. The session was deleted."
            else:
                raise AppError(400, "UNSUPPORTED", "This action can't be confirmed.")
        except CoreApiError as exc:
            logger.info("Action %s failed: %s", action["type"], exc.status_code)
            return await self._settle(ctx, action, "failed", f"I couldn't apply that change: {exc.message}", empty_effects(), {"error": exc.message})
        return await self._settle(ctx, action, "confirmed", text, effects)

    async def cancel(self, ctx: ServiceContext, action_id: str) -> dict:
        action = await self._actions.claim(ctx.user_id, action_id, "pending", "cancelled", utcnow(), None)
        if action is None:
            await self._explain_claim_failure(ctx, action_id, "pending", None)
        return await self._settle(ctx, action, "cancelled", "Cancelled. Nothing was changed.", empty_effects())

    async def undo(self, ctx: ServiceContext, action_id: str) -> dict:
        action = await self._actions.claim(ctx.user_id, action_id, "done", "executing", utcnow(), "undoUntil")
        if action is None:
            await self._explain_claim_failure(ctx, action_id, "done", "undoUntil")
        payload, effects = action.get("payload", {}), empty_effects()
        revert = None
        if payload.get("gameId") and payload.get("playtimeHours"):
            revert = {"gameId": payload["gameId"], "hours": payload["playtimeHours"]}
        try:
            response = await self._core.delete_session(ctx.user_id, payload["sessionId"], revert)
            effects["sessionsDeleted"].append(payload["sessionId"])
            if response.get("game"):
                effects["gamesUpdated"].append(response["game"])
            text = "Undone. The session was removed" + (" and your game's playtime was restored." if response.get("game") else ".")
        except CoreApiError as exc:
            if exc.status_code == 404:
                return await self._settle(ctx, action, "undone", "That session was already deleted, so there was nothing to undo.", empty_effects())
            return await self._settle(ctx, action, "done", f"I couldn't undo that: {exc.message}", empty_effects())
        return await self._settle(ctx, action, "undone", text, effects)
