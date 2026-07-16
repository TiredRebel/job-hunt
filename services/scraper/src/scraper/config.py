"""Runtime configuration for the scraper service.

Settings come from environment variables (``SCRAPER_`` prefix) with a
fallback to the repo-wide ``DATABASE_URL``; a local ``.env`` is honored
for development. Secrets never live in code (see CODING_STANDARDS.md).
"""

from __future__ import annotations

from functools import lru_cache

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict

from scraper.fetchers import DEFAULT_USER_AGENT


class Settings(BaseSettings):
    """Scraper service settings.

    Attributes:
        database_url: PostgreSQL DSN (``SCRAPER_DATABASE_URL`` or ``DATABASE_URL``).
        user_agent: UA string used by the polite HTTP client.
        min_delay_seconds: Minimum per-domain delay between requests.
        jitter_seconds: Upper bound of random extra delay.
        request_timeout_seconds: Total HTTP request timeout.
        respect_robots: Whether robots.txt is consulted before fetching.
        max_leads_per_query: Cap on leads fetched per search query per run.
        max_process_attempts: Failed-processing attempts allowed before a raw
            job is marked permanently failed (see ``POST /jobs_raw/{id}/mark``).
        crawl4ai_page_timeout_seconds: Maximum seconds to wait for a
            crawl4ai page render before treating it as unavailable.
        js_shell_text_threshold: Visible-text length below which a fetched
            page is treated as an unrendered JS shell (see
            ``scraper.fetchers.js_shell.is_js_shell``).
        agent_browser_cmd: Command used to invoke the agent-browser CLI
            (space-separated argv), for ``agent-browser``-strategy sources.
        agent_browser_timeout_seconds: Maximum seconds to wait for the
            agent-browser subprocess before treating it as unavailable.
    """

    model_config = SettingsConfigDict(env_prefix="SCRAPER_", env_file=".env", extra="ignore")

    database_url: str = Field(
        default="postgresql://localhost:5432/jobhunter",
        validation_alias=AliasChoices("SCRAPER_DATABASE_URL", "DATABASE_URL"),
    )
    user_agent: str = DEFAULT_USER_AGENT
    min_delay_seconds: float = 2.0
    jitter_seconds: float = 1.0
    request_timeout_seconds: float = 30.0
    respect_robots: bool = True
    max_leads_per_query: int = 50
    max_process_attempts: int = 3
    crawl4ai_page_timeout_seconds: float = 30.0
    js_shell_text_threshold: int = 200
    agent_browser_cmd: str = "npx -y agent-browser"
    agent_browser_timeout_seconds: float = 30.0


@lru_cache
def get_settings() -> Settings:
    """Return the process-wide settings singleton.

    Returns:
        Cached :class:`Settings` instance.
    """
    return Settings()
