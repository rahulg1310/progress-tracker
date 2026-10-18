import logging
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

from app.agent.runner import AgentRunner
from app.agent.tools import ToolContext, to_jsonable
from app.clients.core_api import CoreApiClient
from app.config import Settings
from app.errors import AppError
from app.llm.gemini_client import ChatTurn, LlmError
from app.llm.prompts import build_system_prompt, make_title
from app.repositories.actions import ActionRepository
from app.repositories.conversations import ConversationRepository, MessageRepository
from app.repositories.library import GameRepository, SessionRepository
from app.repositories.memories import MemoryRepository
from app.security import ServiceContext
from app.services.plan_service import PlanService
from app.services.progress_service import ProgressService
from app.services.recommendation_service import RecommendationService

logger = logging.getLogger("kairo.chat")

PARTIAL_REPLY = "I saved the changes above, but couldn't finish my reply because Coach is busy. Ask again in a minute if you need more."


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _turn_text(doc: dict) -> str:
    """Stored message as the model sees it. Action cards are summarised so the model remembers what happened."""
    text = doc.get("text", "")
    actions = doc.get("actions") or []
    if actions:
        summary = "; ".join(
            f"{a.get('title')} ({', '.join(str(d.get('value')) for d in a.get('details', [])[:3])}) status={a.get('status')}"
            for a in actions
        )
        text = f"{text}\n[Actions: {summary}]"
    return text


def trim_history(docs: list[dict]) -> list[ChatTurn]:
    """Model history must start with a user turn."""
    turns = [ChatTurn(role=d["role"], text=_turn_text(d)) for d in docs if d.get("role") in ("user", "assistant")]
    while turns and turns[0].role != "user":
        turns.pop(0)
    return turns


class ChatService:
    def __init__(
        self,
        conversations: ConversationRepository,
        messages: MessageRepository,
        memories: MemoryRepository,
        games: GameRepository,
        sessions: SessionRepository,
        actions: ActionRepository,
        plans: PlanService,
        progress: ProgressService,
        recommendations: RecommendationService,
        core: CoreApiClient,
        runner: AgentRunner,
        settings: Settings,
    ):
        self._conversations = conversations
        self._messages = messages
        self._memories = memories
        self._games = games
        self._sessions = sessions
        self._actions = actions
        self._plans = plans
        self._progress = progress
        self._recommendations = recommendations
        self._core = core
        self._runner = runner
        self._settings = settings

    async def chat(self, ctx: ServiceContext, conversation_id: str | None, text: str) -> dict:
        conversation = None
        docs: list[dict] = []
        if conversation_id:
            conversation = await self._conversations.get_owned(ctx.user_id, conversation_id)
            if conversation is None:
                raise AppError(404, "NOT_FOUND", "Conversation not found")
            docs = await self._messages.recent(ctx.user_id, conversation["_id"], self._settings.max_history_messages)

        memories = await self._memories.list_for_user(ctx.user_id, limit=20)
        now = utcnow()
        local_now = now.astimezone(ZoneInfo(ctx.timezone))
        recent_user = [d["text"] for d in docs if d.get("role") == "user"][-2:] + [text]

        tool_ctx = ToolContext(
            service=ctx,
            today=local_now.date(),
            now=now,
            recent_user_messages=recent_user,
            games=self._games,
            sessions=self._sessions,
            memories=self._memories,
            actions=self._actions,
            plans=self._plans,
            core=self._core,
            progress=self._progress,
            recommendations=self._recommendations,
        )

        try:
            result = await self._runner.run(
                system_prompt=build_system_prompt(memories, local_now),
                history=trim_history(docs),
                user_message=text,
                ctx=tool_ctx,
            )
            reply_text, model, used = result.text, result.model, result.tools_used
        except LlmError:
            # If something was already saved, keep the chat in sync instead of losing the action cards.
            if not tool_ctx.action_cards:
                raise
            reply_text, model, used = PARTIAL_REPLY, "unavailable", []

        asked_at = utcnow()
        if conversation is None:
            conversation = await self._conversations.create(ctx.user_id, make_title(text), asked_at)
        user_message = await self._messages.add(ctx.user_id, conversation["_id"], "user", text, asked_at)
        answered_at = utcnow()
        assistant_message = await self._messages.add(
            ctx.user_id, conversation["_id"], "assistant", reply_text, answered_at,
            actions=tool_ctx.action_cards, stats=tool_ctx.stats,
        )
        await self._actions.attach(ctx.user_id, [a["_id"] for a in tool_ctx.action_cards], conversation["_id"], assistant_message["_id"])
        conversation = await self._conversations.touch(ctx.user_id, conversation["_id"], answered_at) or conversation

        logger.info("chat request_id=%s model=%s history=%d tools=%s", ctx.request_id, model, len(docs), used)
        return {
            "conversation": conversation,
            "userMessage": user_message,
            "assistantMessage": assistant_message,
            "effects": to_jsonable(tool_ctx.effects),
        }
