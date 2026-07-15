"""REST route definitions for the LLM service.

All endpoints live on :data:`router`, which ``llm.main`` mounts onto the
app. Handlers pull their collaborators (DB layer, provider resolver, graph
dependencies) from ``request.app.state`` via annotated FastAPI dependencies,
so tests can inject fakes by pre-populating state.
"""

from datetime import UTC, datetime
from typing import Annotated, cast

from fastapi import APIRouter, Depends, HTTPException, Request

from llm.api import (
    MatchRequest,
    ProcessJobRequest,
    ProcessJobResponse,
    ProviderPublic,
    SetActiveProviderRequest,
)
from llm.db import Db
from llm.errors import LlmError, NoActiveProviderError, UnknownProviderError
from llm.pipelines import prompts
from llm.pipelines.engine import run_structured
from llm.pipelines.graph import GraphDeps, ProcessState, run_process_graph
from llm.resolver import ProviderResolver
from llm.schemas import MatchResult

router = APIRouter()


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


@router.get("/health")
async def health() -> dict[str, str]:
    """Report service liveness.

    Returns:
        Mapping with a static ``status`` marker and an ISO-8601 timestamp.
    """
    return {"status": "ok", "timestamp": datetime.now(UTC).isoformat()}


@router.post("/process/job")
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


@router.post("/match")
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


@router.get("/providers")
async def list_providers(db: DbDep) -> list[ProviderPublic]:
    """List registry rows (env-var names only, never key values)."""
    return [ProviderPublic.from_row(row) for row in await db.list_providers()]


@router.put("/providers/active")
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
