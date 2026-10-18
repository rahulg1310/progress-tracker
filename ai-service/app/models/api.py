"""Request/response shapes. Output field names match what the React app already uses."""

from datetime import date, datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

OBJECT_ID_PATTERN = r"^[a-f0-9]{24}$"
MAX_MESSAGE_CHARS = 2000


class ChatRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    conversationId: str | None = Field(default=None, pattern=OBJECT_ID_PATTERN)
    message: str = Field(min_length=1, max_length=MAX_MESSAGE_CHARS)

    @field_validator("message")
    @classmethod
    def not_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Message cannot be empty")
        return value


class OutModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True)


class ConversationOut(OutModel):
    id: str = Field(serialization_alias="_id")
    title: str
    lastMessageAt: datetime


class MessageOut(OutModel):
    id: str = Field(serialization_alias="_id")
    role: Literal["user", "assistant"]
    text: str
    createdAt: datetime
    actions: list[dict[str, Any]] | None = None
    stats: list[dict[str, Any]] | None = None


class MemoryOut(OutModel):
    id: str = Field(serialization_alias="_id")
    kind: str
    text: str
    createdAt: datetime


class ChatResponse(BaseModel):
    success: bool = True
    conversation: ConversationOut
    userMessage: MessageOut
    assistantMessage: MessageOut
    effects: dict[str, Any]


class ActionResponse(BaseModel):
    success: bool = True
    action: dict[str, Any]
    message: MessageOut | None = None
    effects: dict[str, Any]


class PlanCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    gameId: str = Field(pattern=OBJECT_ID_PATTERN)
    endDate: date
    dailyMinutes: int = Field(ge=15, le=480)
    estimatedHours: float | None = Field(default=None, gt=0, le=500)


class ConversationsResponse(BaseModel):
    success: bool = True
    conversations: list[ConversationOut]


class MessagesResponse(BaseModel):
    success: bool = True
    conversation: ConversationOut
    messages: list[MessageOut]


class MemoriesResponse(BaseModel):
    success: bool = True
    memories: list[MemoryOut]


class DeletedResponse(BaseModel):
    success: bool = True
    message: str


def conversation_out(doc: dict) -> ConversationOut:
    return ConversationOut(id=str(doc["_id"]), title=doc["title"], lastMessageAt=doc["lastMessageAt"])


def message_out(doc: dict) -> MessageOut:
    from app.agent.tools import to_jsonable  # local import avoids a cycle

    return MessageOut(
        id=str(doc["_id"]),
        role=doc["role"],
        text=doc["text"],
        createdAt=doc["createdAt"],
        actions=to_jsonable(doc["actions"]) if doc.get("actions") else None,
        stats=doc.get("stats") or None,
    )


def memory_out(doc: dict) -> MemoryOut:
    return MemoryOut(id=str(doc["_id"]), kind=doc["kind"], text=doc["text"], createdAt=doc["createdAt"])
