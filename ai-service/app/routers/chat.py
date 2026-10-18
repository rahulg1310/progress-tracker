from fastapi import APIRouter, Depends

from app.deps import get_chat_service, get_conversation_repo, get_memory_repo, get_message_repo
from app.errors import AppError
from app.models.api import (
    ChatRequest,
    ChatResponse,
    ConversationsResponse,
    DeletedResponse,
    MemoriesResponse,
    MessagesResponse,
    conversation_out,
    memory_out,
    message_out,
)
from app.repositories.conversations import ConversationRepository, MessageRepository
from app.repositories.memories import MemoryRepository
from app.security import ServiceContext, require_service_context
from app.services.chat_service import ChatService

router = APIRouter(prefix="/v1")


@router.post("/chat", response_model=ChatResponse)
async def chat(
    body: ChatRequest,
    ctx: ServiceContext = Depends(require_service_context),
    service: ChatService = Depends(get_chat_service),
):
    result = await service.chat(ctx, body.conversationId, body.message)
    return ChatResponse(
        conversation=conversation_out(result["conversation"]),
        userMessage=message_out(result["userMessage"]),
        assistantMessage=message_out(result["assistantMessage"]),
        effects=result["effects"],
    )


@router.get("/conversations", response_model=ConversationsResponse)
async def list_conversations(
    ctx: ServiceContext = Depends(require_service_context),
    conversations: ConversationRepository = Depends(get_conversation_repo),
):
    docs = await conversations.list_for_user(ctx.user_id)
    return ConversationsResponse(conversations=[conversation_out(d) for d in docs])


@router.get("/conversations/{conversation_id}/messages", response_model=MessagesResponse)
async def list_messages(
    conversation_id: str,
    ctx: ServiceContext = Depends(require_service_context),
    conversations: ConversationRepository = Depends(get_conversation_repo),
    messages: MessageRepository = Depends(get_message_repo),
):
    conversation = await conversations.get_owned(ctx.user_id, conversation_id)
    if conversation is None:
        raise AppError(404, "NOT_FOUND", "Conversation not found")
    docs = await messages.list_for_conversation(ctx.user_id, conversation["_id"])
    return MessagesResponse(conversation=conversation_out(conversation), messages=[message_out(d) for d in docs])


@router.delete("/conversations/{conversation_id}", response_model=DeletedResponse)
async def delete_conversation(
    conversation_id: str,
    ctx: ServiceContext = Depends(require_service_context),
    conversations: ConversationRepository = Depends(get_conversation_repo),
):
    if not await conversations.delete_owned(ctx.user_id, conversation_id):
        raise AppError(404, "NOT_FOUND", "Conversation not found")
    return DeletedResponse(message="Conversation deleted")


@router.get("/memories", response_model=MemoriesResponse)
async def list_memories(
    ctx: ServiceContext = Depends(require_service_context),
    memories: MemoryRepository = Depends(get_memory_repo),
):
    docs = await memories.list_for_user(ctx.user_id)
    return MemoriesResponse(memories=[memory_out(d) for d in docs])


@router.delete("/memories/{memory_id}", response_model=DeletedResponse)
async def delete_memory(
    memory_id: str,
    ctx: ServiceContext = Depends(require_service_context),
    memories: MemoryRepository = Depends(get_memory_repo),
):
    if not await memories.delete_owned(ctx.user_id, memory_id):
        raise AppError(404, "NOT_FOUND", "Memory not found")
    return DeletedResponse(message="Memory deleted")
