import logging
import time
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.db import create_client, ensure_indexes
from app.errors import error_body, register_error_handlers
from app.llm.gemini_client import GeminiClient, LlmError
from app.routers import chat, health

logger = logging.getLogger("kairo")


def configure_logging(level: str) -> None:
    logging.basicConfig(
        level=getattr(logging, level.upper(), logging.INFO),
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    configure_logging(settings.log_level)

    client = create_client(settings)
    app.state.mongo_client = client
    app.state.db = client[settings.mongo_db_name]
    try:
        await ensure_indexes(app.state.db)
    except Exception as exc:  # keep serving /health; /v1/health will report the database error
        logger.error("Could not reach MongoDB at startup: %s", type(exc).__name__)

    app.state.llm = GeminiClient(settings)
    if not app.state.llm.is_configured:
        logger.warning("GEMINI_API_KEY is not set; /v1/chat will return AI_NOT_CONFIGURED")

    logger.info("Kairo AI service started (environment=%s, model=%s)", settings.environment, settings.gemini_model)
    yield
    await client.close()


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="Kairo AI Service",
        version=health.SERVICE_VERSION,
        lifespan=lifespan,
        docs_url=None if settings.is_production else "/docs",
        redoc_url=None,
        openapi_url=None if settings.is_production else "/openapi.json",
    )

    register_error_handlers(app)

    @app.exception_handler(LlmError)
    async def handle_llm_error(request: Request, exc: LlmError):
        return JSONResponse(status_code=exc.status_code, content=error_body(exc.code, exc.message))

    @app.middleware("http")
    async def log_requests(request: Request, call_next):
        started = time.perf_counter()
        request_id = request.headers.get("x-request-id") or uuid.uuid4().hex[:12]
        response = await call_next(request)
        elapsed_ms = (time.perf_counter() - started) * 1000
        response.headers["X-Request-ID"] = request_id[:64]
        if request.url.path != "/health":
            logger.info("%s %s -> %s (%.0f ms) request_id=%s", request.method, request.url.path, response.status_code, elapsed_ms, request_id[:64])
        return response

    app.include_router(health.router)
    app.include_router(chat.router)
    return app


app = create_app()
