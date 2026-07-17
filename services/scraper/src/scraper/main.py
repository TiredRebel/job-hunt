"""FastAPI entrypoint for the scraper service.

Run locally with ``uv run uvicorn scraper.main:app --port 8001``.
Endpoints: ``/health`` (docker-compose healthchecks, n8n gating),
``POST /scrape/{slug}`` (trigger a run), ``GET /runs`` (run history),
``GET /jobs_raw/unprocessed`` + ``POST /jobs_raw/{id}/mark`` (the Phase 6
processing-chain feed — the gateway owns ``core.*`` and never queries
``scraper.jobs_raw`` directly, per docs/ARCHITECTURE.md §3), ``GET
/adapters`` (registered adapter slugs) + ``POST /sources/{slug}/test`` (a
side-effect-free connectivity check, for the sources-page-crud change).
"""

from __future__ import annotations

import logging
import time
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from datetime import UTC, datetime
from typing import Annotated, Literal

from fastapi import BackgroundTasks, FastAPI, HTTPException, Query, Request
from pydantic import BaseModel

from scraper.config import get_settings
from scraper.db import Database, RawJobRow, RunRow, SourceRow
from scraper.fetchers import (
    AgentBrowserFetcher,
    Crawl4aiFetcher,
    EscalatingFetcher,
    FetchBlockedError,
    FetchUnavailableError,
    HttpxFetcher,
    PageFetcher,
    PolitenessGate,
    UnsupportedStrategyError,
)
from scraper.models import ProcessingStatus
from scraper.registry import FetcherFactory, UnknownSourceError, create_adapter, known_slugs
from scraper.runner import run_scrape

logger = logging.getLogger(__name__)


def build_fetcher_factory(
    base: PageFetcher,
    *,
    crawl4ai: PageFetcher,
    agent_browser: PageFetcher,
    js_shell_text_threshold: int,
) -> FetcherFactory:
    """Resolve a source's ``fetch_strategy`` to the fetcher its adapter uses.

    ``api`` sources use ``base`` (plain HTTP) directly. ``crawl4ai`` and
    ``agent-browser`` sources each get a fresh :class:`EscalatingFetcher` per
    adapter (i.e. per run), so escalation memory is scoped to that run. A
    strategy with no available fetcher raises
    :class:`UnsupportedStrategyError` rather than silently falling back to
    plain HTTP (see design.md D3 in openspec/changes/phase-2-crawl4ai-fetch-ladder).

    Args:
        base: The plain-HTTP fetcher shared by every strategy.
        crawl4ai: The rendering fetcher backing ``crawl4ai``-strategy sources.
        agent_browser: The rendering fetcher backing
            ``agent-browser``-strategy sources.
        js_shell_text_threshold: Visible-text threshold for the escalation
            heuristic.

    Returns:
        A callable resolving ``(fetch_strategy, content_probe)`` to a fetcher.
    """

    def resolve(fetch_strategy: str, content_probe: str | None) -> PageFetcher:
        if fetch_strategy == "api":
            return base
        if fetch_strategy == "crawl4ai":
            return EscalatingFetcher(
                base,
                crawl4ai,
                content_probe=content_probe,
                text_threshold=js_shell_text_threshold,
            )
        if fetch_strategy == "agent-browser":
            return EscalatingFetcher(
                base,
                agent_browser,
                content_probe=content_probe,
                text_threshold=js_shell_text_threshold,
            )
        raise UnsupportedStrategyError(f"unknown fetch_strategy '{fetch_strategy}'")

    return resolve


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
    gate = PolitenessGate(
        user_agent=settings.user_agent,
        min_delay=settings.min_delay_seconds,
        jitter=settings.jitter_seconds,
        timeout=settings.request_timeout_seconds,
        respect_robots=settings.respect_robots,
    )
    client = HttpxFetcher(gate, timeout=settings.request_timeout_seconds)
    crawl4ai_fetcher = Crawl4aiFetcher(gate, page_timeout_s=settings.crawl4ai_page_timeout_seconds)
    agent_browser_fetcher = AgentBrowserFetcher(
        gate,
        command=settings.agent_browser_cmd,
        timeout_s=settings.agent_browser_timeout_seconds,
    )
    application.state.db = db
    application.state.client = client
    application.state.fetchers = build_fetcher_factory(
        client,
        crawl4ai=crawl4ai_fetcher,
        agent_browser=agent_browser_fetcher,
        js_shell_text_threshold=settings.js_shell_text_threshold,
    )
    try:
        yield
    finally:
        await crawl4ai_fetcher.aclose()
        await client.aclose()
        await gate.aclose()
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
) -> dict[str, str | int]:
    """Schedule a scrape run for one source.

    The run row is created synchronously so callers (the API gateway, n8n)
    get a real ``runId`` back; the scrape work itself executes in the
    background — poll ``GET /runs`` for progress.

    Args:
        slug: Source slug (``core.sources.slug``).
        request: Request (carries app state).
        background: FastAPI background task queue.

    Returns:
        Acknowledgement payload including the new run id.

    Raises:
        HTTPException: 404 for unknown sources, 409 for disabled ones, 500
            when the source's ``fetch_strategy`` has no available fetcher.
    """
    db: Database = request.app.state.db
    source: SourceRow | None = await db.get_source(slug)
    if source is None:
        raise HTTPException(status_code=404, detail=f"unknown source '{slug}'")
    if not source["enabled"]:
        raise HTTPException(status_code=409, detail=f"source '{slug}' is disabled")
    try:
        adapter = create_adapter(
            slug, source["config"], source["fetch_strategy"], request.app.state.fetchers
        )
    except UnknownSourceError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except UnsupportedStrategyError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    settings = get_settings()
    run_id = await db.create_run(source["id"])
    background.add_task(
        run_scrape,
        db,
        adapter,
        source,
        run_id,
        max_leads_per_query=settings.max_leads_per_query,
    )
    logger.info("scheduled scrape run %d for %s", run_id, slug)
    return {"status": "accepted", "source": slug, "runId": run_id}


class AdapterListResponse(BaseModel):
    """Body for ``GET /adapters``."""

    slugs: list[str]


class SourceTestResponse(BaseModel):
    """Body for ``POST /sources/{slug}/test``."""

    status: Literal["ok", "no_adapter", "unsupported_strategy", "blocked", "failed"]
    detail: str
    http_status: int | None
    elapsed_ms: int | None


@app.get("/adapters")
async def list_adapters() -> AdapterListResponse:
    """Return the source slugs with a registered scraper adapter.

    Consumed by the gateway's adapter-awareness proxy (``GET
    /v1/sources/adapters``) so the dashboard can mark sources that exist in
    ``core.sources`` but can't be scraped yet.

    Returns:
        The registered adapter slugs, sorted.
    """
    return AdapterListResponse(slugs=sorted(known_slugs()))


@app.post("/sources/{slug}/test")
async def test_source(slug: str, request: Request) -> SourceTestResponse:
    """Test connectivity for one source without persisting anything.

    Resolves the adapter and fetcher exactly as a real scrape would, then
    performs one polite fetch of the adapter's listing URL (the same
    politeness gate a scrape uses — no bypass). No scrape-run row and no
    ``jobs_raw`` writes; this is a read-only connectivity check.

    Args:
        slug: Source slug (``core.sources.slug``).
        request: Request (carries app state).

    Returns:
        The test outcome. A failing outcome (``no_adapter``,
        ``unsupported_strategy``, ``blocked``, ``failed``) is still a 200
        response — the test itself succeeded in producing an answer; 502 is
        reserved for callers that can't reach this service at all.

    Raises:
        HTTPException: 404 when the source is unknown in the database.
    """
    db: Database = request.app.state.db
    source: SourceRow | None = await db.get_source(slug)
    if source is None:
        raise HTTPException(status_code=404, detail=f"unknown source '{slug}'")

    try:
        adapter = create_adapter(
            slug, source["config"], source["fetch_strategy"], request.app.state.fetchers
        )
    except UnknownSourceError as exc:
        return SourceTestResponse(
            status="no_adapter", detail=str(exc), http_status=None, elapsed_ms=None
        )
    except UnsupportedStrategyError as exc:
        return SourceTestResponse(
            status="unsupported_strategy", detail=str(exc), http_status=None, elapsed_ms=None
        )

    start = time.monotonic()
    try:
        result = await adapter.probe()
    except FetchBlockedError as exc:
        return SourceTestResponse(
            status="blocked",
            detail=str(exc),
            http_status=None,
            elapsed_ms=int((time.monotonic() - start) * 1000),
        )
    except FetchUnavailableError as exc:
        return SourceTestResponse(
            status="failed",
            detail=str(exc),
            http_status=None,
            elapsed_ms=int((time.monotonic() - start) * 1000),
        )
    except Exception as exc:  # noqa: BLE001 — a probe failure is reported, not raised.
        return SourceTestResponse(
            status="failed",
            detail=str(exc),
            http_status=None,
            elapsed_ms=int((time.monotonic() - start) * 1000),
        )

    return SourceTestResponse(
        status="ok",
        detail=f"fetched {result.url}",
        http_status=result.status_code,
        elapsed_ms=int((time.monotonic() - start) * 1000),
    )


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


@app.get("/jobs_raw/unprocessed")
async def list_unprocessed_jobs(
    request: Request, limit: Annotated[int, Query(ge=1, le=200)] = 20
) -> list[RawJobRow]:
    """Return raw jobs awaiting LLM processing, oldest first.

    Consumed by the gateway's Phase 6 automation feed
    (``GET /v1/automation/jobs/unprocessed``); the gateway never reads
    ``scraper.jobs_raw`` directly.

    Args:
        request: Request (carries app state).
        limit: Maximum number of rows to return.

    Returns:
        Raw job rows with ``processing_status`` in (``pending``, ``queued``).
    """
    db: Database = request.app.state.db
    return await db.list_unprocessed(limit=limit)


class MarkProcessedRequest(BaseModel):
    """Body for ``POST /jobs_raw/{id}/mark``."""

    status: Literal["done", "failed"]


@app.post("/jobs_raw/{raw_id}/mark")
async def mark_processed(
    raw_id: int, payload: MarkProcessedRequest, request: Request
) -> dict[str, str]:
    """Record the outcome of one LLM-processing attempt for a raw job.

    ``failed`` increments the attempt counter; the row only leaves the
    unprocessed feed once the configured attempt limit is reached.

    Args:
        raw_id: ``scraper.jobs_raw.id``.
        payload: Outcome of this attempt.
        request: Request (carries app state).

    Returns:
        Acknowledgement payload.

    Raises:
        HTTPException: 404 when ``raw_id`` is unknown.
    """
    db: Database = request.app.state.db
    settings = get_settings()
    updated = await db.mark_processed(
        raw_id, ProcessingStatus(payload.status), settings.max_process_attempts
    )
    if not updated:
        raise HTTPException(status_code=404, detail=f"unknown raw job {raw_id}")
    return {"status": "ok"}
