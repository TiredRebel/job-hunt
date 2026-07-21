"""Runtime configuration for the LLM service.

Settings come from environment variables (``LLM_`` prefix) with a fallback to
the repo-wide ``DATABASE_URL``; a local ``.env`` is honored for development.
Secrets never live in code (see CODING_STANDARDS.md).
"""

import os
from functools import lru_cache

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """LLM service settings read from the environment."""

    model_config = SettingsConfigDict(env_prefix="LLM_", env_file=".env", extra="ignore")

    database_url: str = Field(
        default="postgresql://localhost:5432/jobhunter",
        validation_alias=AliasChoices("LLM_DATABASE_URL", "DATABASE_URL"),
    )
    request_timeout_s: float = 120.0
    provider_cache_ttl_s: float = 30.0
    cover_letter_threshold: int = 80
    log_level: str = "info"
    provider_retry_attempts: int = 3
    internal_api_token: str = Field(
        validation_alias=AliasChoices("LLM_INTERNAL_API_TOKEN", "INTERNAL_API_TOKEN"),
        min_length=16,
    )


@lru_cache
def get_settings() -> Settings:
    """Return the cached settings singleton."""
    return Settings(internal_api_token=os.environ.get("INTERNAL_API_TOKEN", ""))
