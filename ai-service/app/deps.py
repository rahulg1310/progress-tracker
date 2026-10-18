"""Dependency providers. Tests override these with in-memory fakes."""

from fastapi import Depends, Request
from pymongo.asynchronous.database import AsyncDatabase

from app.agent.runner import AgentRunner
from app.clients.core_api import CoreApiClient
from app.clients.rawg import RawgClient
from app.config import Settings, get_settings
from app.llm.gemini_client import LlmClient
from app.repositories.actions import ActionRepository
from app.repositories.conversations import ConversationRepository, MessageRepository
from app.repositories.gamification import BriefingRepository, GoalRepository
from app.repositories.library import GameRepository, SessionRepository
from app.repositories.memories import MemoryRepository
from app.repositories.plans import PlanRepository
from app.services.action_service import ActionService
from app.services.chat_service import ChatService
from app.services.plan_service import PlanService
from app.services.progress_service import ProgressService
from app.services.recommendation_service import RecommendationService


def get_db(request: Request) -> AsyncDatabase:
    return request.app.state.db


def get_llm(request: Request) -> LlmClient:
    return request.app.state.llm


def get_core_api(request: Request) -> CoreApiClient:
    return request.app.state.core_api


def get_rawg(request: Request) -> RawgClient:
    return request.app.state.rawg


def get_conversation_repo(db: AsyncDatabase = Depends(get_db)) -> ConversationRepository:
    return ConversationRepository(db)


def get_message_repo(db: AsyncDatabase = Depends(get_db)) -> MessageRepository:
    return MessageRepository(db)


def get_memory_repo(db: AsyncDatabase = Depends(get_db)) -> MemoryRepository:
    return MemoryRepository(db)


def get_game_repo(db: AsyncDatabase = Depends(get_db)) -> GameRepository:
    return GameRepository(db)


def get_session_repo(db: AsyncDatabase = Depends(get_db)) -> SessionRepository:
    return SessionRepository(db)


def get_action_repo(db: AsyncDatabase = Depends(get_db)) -> ActionRepository:
    return ActionRepository(db)


def get_plan_repo(db: AsyncDatabase = Depends(get_db)) -> PlanRepository:
    return PlanRepository(db)


def get_goal_repo(db: AsyncDatabase = Depends(get_db)) -> GoalRepository:
    return GoalRepository(db)


def get_briefing_repo(db: AsyncDatabase = Depends(get_db)) -> BriefingRepository:
    return BriefingRepository(db)


def get_plan_service(
    plans: PlanRepository = Depends(get_plan_repo),
    games: GameRepository = Depends(get_game_repo),
    sessions: SessionRepository = Depends(get_session_repo),
) -> PlanService:
    return PlanService(plans, games, sessions)


def get_progress_service(
    games: GameRepository = Depends(get_game_repo),
    sessions: SessionRepository = Depends(get_session_repo),
    goals: GoalRepository = Depends(get_goal_repo),
    briefings: BriefingRepository = Depends(get_briefing_repo),
    plans: PlanService = Depends(get_plan_service),
    llm: LlmClient = Depends(get_llm),
) -> ProgressService:
    return ProgressService(games, sessions, goals, briefings, plans, llm)


def get_recommendation_service(
    games: GameRepository = Depends(get_game_repo),
    rawg: RawgClient = Depends(get_rawg),
) -> RecommendationService:
    return RecommendationService(games, rawg)


def get_chat_service(
    conversations: ConversationRepository = Depends(get_conversation_repo),
    messages: MessageRepository = Depends(get_message_repo),
    memories: MemoryRepository = Depends(get_memory_repo),
    games: GameRepository = Depends(get_game_repo),
    sessions: SessionRepository = Depends(get_session_repo),
    actions: ActionRepository = Depends(get_action_repo),
    plans: PlanService = Depends(get_plan_service),
    progress: ProgressService = Depends(get_progress_service),
    recommendations: RecommendationService = Depends(get_recommendation_service),
    core: CoreApiClient = Depends(get_core_api),
    llm: LlmClient = Depends(get_llm),
    settings: Settings = Depends(get_settings),
) -> ChatService:
    return ChatService(conversations, messages, memories, games, sessions, actions, plans, progress, recommendations, core, AgentRunner(llm), settings)


def get_action_service(
    actions: ActionRepository = Depends(get_action_repo),
    messages: MessageRepository = Depends(get_message_repo),
    conversations: ConversationRepository = Depends(get_conversation_repo),
    core: CoreApiClient = Depends(get_core_api),
) -> ActionService:
    return ActionService(actions, messages, conversations, core)
