import logging
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

from app.config import Settings
from app.errors import AppError
from app.llm.gemini_client import ChatTurn, LlmClient
from app.llm.prompts import build_system_prompt, make_title
from app.repositories.conversations import ConversationRepository, MessageRepository
from app.repositories.memories import MemoryRepository
from app.security import ServiceContext

logger = logging.getLogger("kairo.chat")


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def trim_history(docs: list[dict]) -> list[ChatTurn]:
    """Model history must start with a user turn."""
    turns = [ChatTurn(role=d["role"], text=d["text"]) for d in docs if d.get("role") in ("user", "assistant")]
    while turns and turns[0].role != "user":
        turns.pop(0)
    return turns


class ChatService:
    def __init__(
        self,
        conversations: ConversationRepository,
        messages: MessageRepository,
        memories: MemoryRepository,
        llm: LlmClient,
        settings: Settings,
    ):
        self._conversations = conversations
        self._messages = messages
        self._memories = memories
        self._llm = llm
        self._settings = settings

    async def chat(self, ctx: ServiceContext, conversation_id: str | None, text: str) -> dict:
        conversation = None
        history: list[ChatTurn] = []
        if conversation_id:
            conversation = await self._conversations.get_owned(ctx.user_id, conversation_id)
            if conversation is None:
                raise AppError(404, "NOT_FOUND", "Conversation not found")
            docs = await self._messages.recent(ctx.user_id, conversation["_id"], self._settings.max_history_messages)
            history = trim_history(docs)

        memories = await self._memories.list_for_user(ctx.user_id, limit=20)
        local_now = utcnow().astimezone(ZoneInfo(ctx.timezone))
        system_prompt = build_system_prompt(memories, local_now)

        # Ask the model first: if it fails nothing is saved, so "Retry" never duplicates messages.
        reply = await self._llm.generate(system_prompt=system_prompt, history=history, user_message=text)

        asked_at = utcnow()
        if conversation is None:
            conversation = await self._conversations.create(ctx.user_id, make_title(text), asked_at)
        user_message = await self._messages.add(ctx.user_id, conversation["_id"], "user", text, asked_at)
        answered_at = utcnow()
        assistant_message = await self._messages.add(ctx.user_id, conversation["_id"], "assistant", reply.text, answered_at)
        conversation = await self._conversations.touch(ctx.user_id, conversation["_id"], answered_at) or conversation

        logger.info(
            "chat request_id=%s model=%s history=%d tokens_in=%s tokens_out=%s",
            ctx.request_id, reply.model, len(history), reply.input_tokens, reply.output_tokens,
        )
        return {"conversation": conversation, "userMessage": user_message, "assistantMessage": assistant_message}
