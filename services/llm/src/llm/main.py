"""FastAPI entrypoint for the LLM service.

Run locally with ``uv run uvicorn llm.main:app --port 8002``.
Exposes ``/health`` for docker-compose healthchecks and n8n gating, the
processing/matching pipelines, and the provider admin endpoints.
"""

import asyncio
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from datetime import UTC, datetime
from functools import partial
from typing import Annotated, cast

import httpx
from fastapi import Depends, FastAPI, HTTPException, Request

from llm.api import (
    MatchRequest,
    ProcessJobRequest,
    ProcessJobResponse,
    ProviderPublic,
    SetActiveProviderRequest,
)
from llm.config import get_settings
from llm.db import Db, create_pool
from llm.errors import LlmError, NoActiveProviderError, UnknownProviderError
from llm.listener import listen_config_changes
from llm.pipelines import prompts
from llm.pipelines.engine import run_structured
from llm.pipelines.graph import GraphDeps, ProcessState, run_process_graph
from llm.registry import build_provider
from llm.resolver import ProviderResolver
from llm.schemas import MatchResult


@asynccontextmanager
async def _lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Wire pool, HTTP client, resolver and the NOTIFY listener.

    Tests pre-populate ``app.state`` and set ``wired=True`` to skip real I/O.
    """
    if getattr(app.state, "wired", False):
        yield
        return
    settings = get_settings()
    pool = create_pool(settings.database_url)
    await pool.open()
    db = Db(pool)
    client = httpx.AsyncClient(timeout=settings.request_timeout_s)
    resolver = ProviderResolver(
        db.active_provider,
        partial(build_provider, client=client),
        settings.provider_cache_ttl_s,
    )
    listener = asyncio.create_task(
        listen_config_changes(settings.database_url, resolver.invalidate)
    )
    app.state.db = db
    app.state.resolver = resolver
    app.state.graph_deps = GraphDeps(
        resolver=resolver,
        record=db.record_run,
        cover_letter_threshold=settings.cover_letter_threshold,
    )
    app.state.wired = True
    try:
        yield
    finally:
        listener.cancel()
        await client.aclose()
        await pool.close()


app = FastAPI(title="job-hunter llm", version="0.1.0", lifespan=_lifespan)


def _db(request: Request) -> Db:
    """Fetch the DB layer from app state."""
    return cast(Db, request.app.state.db)


def _resolver(request: Request) -> ProviderResolver:
    """Fetch the provider resolver from app state."""
    return cast(ProviderResolver, request.app.state.resolver)


def _graph_deps(request: Request) -> GraphDeps:
    """Fetch the graph dependencies from app state."""
    return cast(GraphDeps, request.app.state.graph_deps)


DbDep = Annotated[Db, Depends(_db)]
ResolverDep = Annotated[ProviderResolver, Depends(_resolver)]
GraphDepsDep = Annotated[GraphDeps, Depends(_graph_deps)]


@app.get("/health")
async def health() -> dict[str, str]:
    """Report service liveness.

    Returns:
        Mapping with a static ``status`` marker and an ISO-8601 timestamp.
    """
    return {"status": "ok", "timestamp": datetime.now(UTC).isoformat()}


@app.post("/process/job")
async def process_job(payload: ProcessJobRequest, deps: GraphDepsDep) -> ProcessJobResponse:
    """Run the full pipeline graph over one raw posting."""
    initial: ProcessState = {
        "job_id": payload.job_id,
        "title": payload.title,
        "body": payload.body,
        "source_url": payload.source_url,
        "profile": payload.profile,
    }
    try:
        final = await run_process_graph(deps, initial)
    except NoActiveProviderError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except LlmError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return ProcessJobResponse(
        normalized=final["normalized"],
        summary=final["summary"],
        match=final.get("match"),
        cover_letter=final.get("cover_letter"),
    )


@app.post("/match")
async def match(payload: MatchRequest, deps: GraphDepsDep) -> MatchResult:
    """Score one normalized job against a profile (single pipeline call)."""
    try:
        resolved = await deps.resolver.resolve("match")
        return await run_structured(
            resolved,
            "match",
            MatchResult,
            prompts.MATCH_SYSTEM,
            prompts.match_prompt(payload.job, payload.summary, payload.profile),
            deps.record,
            payload.job_id,
        )
    except NoActiveProviderError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except LlmError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@app.get("/providers")
async def list_providers(db: DbDep) -> list[ProviderPublic]:
    """List registry rows (env-var names only, never key values)."""
    return [ProviderPublic.from_row(row) for row in await db.list_providers()]


@app.put("/providers/active")
async def set_active_provider(
    payload: SetActiveProviderRequest, db: DbDep, resolver: ResolverDep
) -> ProviderPublic:
    """Hot-switch the active provider (DB update + NOTIFY, local cache drop)."""
    try:
        row = await db.set_active(payload.slug)
    except UnknownProviderError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    resolver.invalidate()
    return ProviderPublic.from_row(row)
