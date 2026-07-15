"""FastAPI entrypoint for the scraper service.

Run locally with ``uv run uvicorn scraper.main:app --port 8001``.
Endpoints: ``/health`` (docker-compose healthchecks, n8n gating),
``POST /scrape/{slug}`` (trigger a run), ``GET /runs`` (run history).
"""

from __future__ import annotations

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from datetime import UTC, datetime
from typing import Annotated

from fastapi import BackgroundTasks, FastAPI, HTTPException, Query, Request

from scraper.config import get_settings
from scraper.db import Database, RunRow, SourceRow
from scraper.fetch import PoliteClient
from scraper.registry import UnknownSourceError, create_adapter
from scraper.runner import run_scrape

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(application: FastAPI) -> AsyncIterator[None]:
    """Open shared resources (DB pool, HTTP client) for the app lifetime.

    Args:
        application: The FastAPI instance being started.

    Yields:
        Nothing; resources are attached to ``application.state``.
    """
    settings = get_settings()
    db = Database(settings.database_url)
    await db.open()
    client = PoliteClient(
        user_agent=settings.user_agent,
        min_delay=settings.min_delay_seconds,
        jitter=settings.jitter_seconds,
        timeout=settings.request_timeout_seconds,
        respect_robots=settings.respect_robots,
    )
    application.state.db = db
    application.state.client = client
    try:
        yield
    finally:
        await client.aclose()
        await db.close()


app = FastAPI(title="job-hunter scraper", version="0.2.0", lifespan=lifespan)


@app.get("/health")
async def health() -> dict[str, str]:
    """Report service liveness.

    Returns:
        Mapping with a static ``status`` marker and an ISO-8601 timestamp.
    """
    return {"status": "ok", "timestamp": datetime.now(UTC).isoformat()}


@app.post("/scrape/{slug}", status_code=202)
async def trigger_scrape(
    slug: str, request: Request, background: BackgroundTasks
) -> dict[str, str]:
    """Schedule a scrape run for one source.

    The run executes in the background; poll ``GET /runs`` for progress.

    Args:
        slug: Source slug (``core.sources.slug``).
        request: Request (carries app state).
        background: FastAPI background task queue.

    Returns:
        Acknowledgement payload.

    Raises:
        HTTPException: 404 for unknown sources, 409 for disabled ones.
    """
    db: Database = request.app.state.db
    source: SourceRow | None = await db.get_source(slug)
    if source is None:
        raise HTTPException(status_code=404, detail=f"unknown source '{slug}'")
    if not source["enabled"]:
        raise HTTPException(status_code=409, detail=f"source '{slug}' is disabled")
    try:
        adapter = create_adapter(slug, source["config"], request.app.state.client)
    except UnknownSourceError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    settings = get_settings()
    background.add_task(
        run_scrape, db, adapter, source, max_leads_per_query=settings.max_leads_per_query
    )
    logger.info("scheduled scrape run for %s", slug)
    return {"status": "accepted", "source": slug}


@app.get("/runs")
async def list_runs(
    request: Request, limit: Annotated[int, Query(ge=1, le=200)] = 20
) -> list[RunRow]:
    """Return recent scrape runs, newest first.

    Args:
        request: Request (carries app state).
        limit: Maximum number of runs to return.

    Returns:
        Run rows including source slug, status and stats.
    """
    db: Database = request.app.state.db
    return await db.list_runs(limit=limit)
