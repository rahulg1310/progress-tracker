import asyncio

from fastapi import APIRouter, Depends
from pymongo.asynchronous.database import AsyncDatabase

from app.deps import get_db, get_llm
from app.llm.gemini_client import LlmClient
from app.security import ServiceContext, require_service_context

router = APIRouter()

SERVICE_VERSION = "0.2.0"


@router.get("/health")
async def health():
    """Public liveness check for Render. Reveals nothing about configuration."""
    return {"status": "ok", "service": "kairo-ai", "version": SERVICE_VERSION}


@router.get("/v1/health")
async def health_detailed(
    ctx: ServiceContext = Depends(require_service_context),
    db: AsyncDatabase = Depends(get_db),
    llm: LlmClient = Depends(get_llm),
):
    """Authenticated readiness check (called by Express GET /ai/health)."""
    database = "ok"
    try:
        await asyncio.wait_for(db.command("ping"), timeout=5)
    except Exception:
        database = "error"
    gemini = "configured" if llm.is_configured else "missing_key"
    status = "ok" if database == "ok" and gemini == "configured" else "degraded"
    return {"success": True, "status": status, "database": database, "gemini": gemini, "model": llm.model}
