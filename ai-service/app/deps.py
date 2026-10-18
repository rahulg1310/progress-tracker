"""Dependency providers. Tests override these with in-memory fakes."""

from fastapi import Depends, Request
from pymongo.asynchronous.database import AsyncDatabase

from app.config import Settings, get_settings
from app.llm.gemini_client import LlmClient
from app.repositories.conversations import ConversationRepository, MessageRepository
from app.repositories.memories import MemoryRepository
from app.services.chat_service import ChatService


def get_db(request: Request) -> AsyncDatabase:
    return request.app.state.db


def get_llm(request: Request) -> LlmClient:
    return request.app.state.llm


def get_conversation_repo(db: AsyncDatabase = Depends(get_db)) -> ConversationRepository:
    return ConversationRepository(db)


def get_message_repo(db: AsyncDatabase = Depends(get_db)) -> MessageRepository:
    return MessageRepository(db)


def get_memory_repo(db: AsyncDatabase = Depends(get_db)) -> MemoryRepository:
    return MemoryRepository(db)


def get_chat_service(
    conversations: ConversationRepository = Depends(get_conversation_repo),
    messages: MessageRepository = Depends(get_message_repo),
    memories: MemoryRepository = Depends(get_memory_repo),
    llm: LlmClient = Depends(get_llm),
    settings: Settings = Depends(get_settings),
) -> ChatService:
    return ChatService(conversations, messages, memories, llm, settings)
