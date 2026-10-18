from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """All configuration comes from environment variables (or ai-service/.env)."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    environment: str = "development"
    log_level: str = "INFO"

    # Shared with Express. Express signs a short-lived token per request; we verify it.
    service_auth_secret: str = Field(min_length=32)
    service_token_audience: str = "kairo-ai"
    service_token_issuer: str = "kairo-core"
    service_token_max_age_seconds: int = 120

    mongo_uri: str
    mongo_db_name: str = Field(min_length=1)

    gemini_api_key: str = ""
    gemini_model: str = "gemini-3.5-flash-lite"
    gemini_fallback_model: str = "gemini-3.6-flash"
    gemini_timeout_seconds: float = Field(default=30, gt=0, le=120)
    gemini_max_output_tokens: int = Field(default=1024, ge=64, le=8192)
    # Testing only: point the SDK at a local fake Gemini server. Leave empty in real use.
    gemini_base_url: str = ""

    max_history_messages: int = Field(default=20, ge=2, le=100)

    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()
