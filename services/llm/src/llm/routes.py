"""REST route definitions for the LLM service.

All endpoints live on :data:`router`, which ``llm.main`` mounts onto the
app. Handlers pull their collaborators (DB layer, provider resolver, graph
dependencies) from ``request.app.state`` via annotated FastAPI dependencies,
so tests can inject fakes by pre-populating state.
"""

import time
from datetime import UTC, datetime
from hmac import compare_digest
from typing import Annotated, Any, cast

from fastapi import APIRouter, Depends, HTTPException, Request

from llm.api import (
    CoverLetterRequest,
    CreateProviderRequest,
    MatchRequest,
    ModelListResponse,
    ProcessJobRequest,
    ProcessJobResponse,
    ProviderConnectionTestRequest,
    ProviderPublic,
    ProviderTestResponse,
    SetActiveProviderRequest,
    UpdateProviderRequest,
)
from llm.config import get_settings
from llm.credentials import CredentialCipher
from llm.db import UNSET, Db, ProviderRow
from llm.errors import (
    LlmError,
    MissingApiKeyError,
    NoActiveProviderError,
    PromptInjectionDetectedError,
    ProviderRequestError,
    UnknownProviderError,
    UnknownProviderKindError,
)
from llm.pipelines import prompts
from llm.pipelines.engine import run_structured
from llm.pipelines.graph import GraphDeps, ProcessState, run_process_graph
from llm.resolver import BuildProvider, ProviderResolver
from llm.schemas import CompletionRequest, CoverLetter, MatchResult

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


def _build_provider(request: Request) -> BuildProvider:
    """Fetch the provider factory from app state.

    Unlike the resolver (which only ever resolves the *active* row), this
    builds an adapter for any row — used to test or introspect a provider
    before (or without ever) switching to it.
    """
    return cast(BuildProvider, request.app.state.build_provider)


def _credential_cipher(request: Request) -> CredentialCipher:
    """Fetch the provider-credential cipher from app state."""
    return cast(CredentialCipher, request.app.state.credential_cipher)


def _require_internal_token(request: Request) -> None:
    """Reject direct calls to the saved-key draft-testing endpoint."""
    provided = request.headers.get("X-Internal-Token", "")
    expected = get_settings().internal_api_token
    if not compare_digest(provided, expected):
        raise HTTPException(status_code=401, detail="invalid internal token")


DbDep = Annotated[Db, Depends(_db)]
ResolverDep = Annotated[ProviderResolver, Depends(_resolver)]
GraphDepsDep = Annotated[GraphDeps, Depends(_graph_deps)]
BuildProviderDep = Annotated[BuildProvider, Depends(_build_provider)]
CredentialCipherDep = Annotated[CredentialCipher, Depends(_credential_cipher)]
InternalTokenDep = Annotated[None, Depends(_require_internal_token)]


@router.get("/health")
async def health() -> dict[str, str]:
    """Report service liveness.

    Returns:
        Mapping with a static ``status`` marker and an ISO-8601 timestamp.
    """
    return {"status": "ok", "timestamp": datetime.now(UTC).isoformat()}


@router.post("/process/job")
async def process_job(payload: ProcessJobRequest, deps: GraphDepsDep) -> ProcessJobResponse:
    """Run the full pipeline graph over one raw posting.

    ``pipeline_runs.job_id`` references ``core.jobs.id``, which does not
    exist yet at this point in a job's lifecycle (normalization is what
    eventually produces that row, downstream of this call). ``payload.job_id``
    is the caller's raw scraper job id, a different id space entirely, so it
    is never threaded into the graph state — recording ties to a real job id
    on the /match and /cover-letter paths instead, which operate on jobs
    already persisted in ``core.jobs``.
    """
    initial: ProcessState = {
        "job_id": None,
        "title": payload.title,
        "body": payload.body,
        "source_url": payload.source_url,
        "profile": payload.profile,
    }
    try:
        final = await run_process_graph(deps, initial)
    except NoActiveProviderError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except PromptInjectionDetectedError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
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
    except PromptInjectionDetectedError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except LlmError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.post("/cover-letter")
async def cover_letter(payload: CoverLetterRequest, deps: GraphDepsDep) -> CoverLetter:
    """Draft a cover letter for an already-normalized job (single pipeline call)."""
    try:
        resolved = await deps.resolver.resolve("cover_letter")
        return await run_structured(
            resolved,
            "cover_letter",
            CoverLetter,
            prompts.cover_letter_system(resolved.row.kind),
            prompts.cover_letter_prompt(payload.job, payload.profile),
            deps.record,
            payload.job_id,
        )
    except NoActiveProviderError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except PromptInjectionDetectedError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except LlmError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.get("/providers")
async def list_providers(db: DbDep) -> list[ProviderPublic]:
    """List registry rows without API-key values or ciphertexts."""
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


@router.post("/providers", status_code=201)
async def create_provider(
    payload: CreateProviderRequest, db: DbDep, cipher: CredentialCipherDep
) -> ProviderPublic:
    """Register a new provider row. Always created inactive (no NOTIFY)."""
    row = await db.create_provider(
        payload.slug,
        payload.name or payload.slug,
        payload.kind,
        payload.base_url,
        payload.default_model,
        cipher.encrypt(payload.api_key.get_secret_value()) if payload.api_key else None,
    )
    if row is None:
        raise HTTPException(status_code=409, detail=f"provider {payload.slug!r} already exists")
    return ProviderPublic.from_row(row)


async def _run_provider_test(
    row: ProviderRow, build_provider: BuildProviderDep
) -> ProviderTestResponse:
    """Run one bounded completion without changing the supplied provider row."""
    started = time.monotonic()
    try:
        provider = build_provider(row)
        await provider.complete(
            CompletionRequest(
                model=row.default_model,
                prompt="Reply with OK.",
                max_tokens=1,
            )
        )
    except (MissingApiKeyError, ProviderRequestError, UnknownProviderKindError, ValueError) as exc:
        return ProviderTestResponse(ok=False, detail=str(exc))
    elapsed_ms = round((time.monotonic() - started) * 1000)
    return ProviderTestResponse(ok=True, elapsed_ms=elapsed_ms)


@router.post("/providers/test")
async def test_provider_connection(
    payload: ProviderConnectionTestRequest,
    db: DbDep,
    build_provider: BuildProviderDep,
    cipher: CredentialCipherDep,
    _: InternalTokenDep,
) -> ProviderTestResponse:
    """Validate unsaved provider connection fields with a bounded completion.

    Args:
        payload: Draft connection fields; they are never persisted by this endpoint.
        db: Database access used only to reuse a saved key when requested.
        build_provider: Factory that creates an adapter from the draft row.
        cipher: Encryption helper for a typed draft key.

    Returns:
        The connection result without modifying provider configuration.
    """
    saved = await db.get_provider(payload.provider_slug) if payload.provider_slug else None
    if payload.provider_slug and saved is None:
        raise HTTPException(
            status_code=404, detail=f"no provider with slug {payload.provider_slug!r}"
        )
    api_key_ciphertext = (
        cipher.encrypt(payload.api_key.get_secret_value())
        if payload.api_key is not None
        else saved.api_key_ciphertext
        if saved is not None
        else None
    )
    row = ProviderRow(
        slug="connection-test",
        name="Connection test",
        kind=payload.kind,
        base_url=payload.base_url,
        default_model=payload.default_model,
        api_key_ciphertext=api_key_ciphertext,
    )
    return await _run_provider_test(row, build_provider)


@router.post("/providers/{slug}/test")
async def test_provider(
    slug: str, db: DbDep, build_provider: BuildProviderDep
) -> ProviderTestResponse:
    """Probe one provider and its configured default model.

    Builds the adapter fresh from the row (any row, active or not) so this
    never disturbs the resolver's cached active provider. The bounded
    completion validates the backend, model availability, and authentication
    together. Configuration or provider failures are reported as ``ok:
    false`` rather than a 500; only an unknown slug (404) short-circuits.

    Args:
        slug: Identifier of the provider to validate.
        db: Database access used to load the provider configuration.
        build_provider: Factory that creates a provider adapter from a row.

    Returns:
        The real-completion result and elapsed time, or an ``ok: false``
        response for configuration and provider failures.
    """
    row = await db.get_provider(slug)
    if row is None:
        raise HTTPException(status_code=404, detail=f"no provider with slug {slug!r}")
    return await _run_provider_test(row, build_provider)


@router.get("/providers/{slug}/models")
async def list_provider_models(
    slug: str, db: DbDep, build_provider: BuildProviderDep
) -> ModelListResponse:
    """List models the provider currently reports, without switching to it."""
    row = await db.get_provider(slug)
    if row is None:
        raise HTTPException(status_code=404, detail=f"no provider with slug {slug!r}")
    try:
        provider = build_provider(row)
        models = await provider.list_models()
    except (MissingApiKeyError, UnknownProviderKindError, ProviderRequestError) as exc:
        return ModelListResponse(models=[], error=str(exc))
    return ModelListResponse(models=models)


@router.patch("/providers/{slug}")
async def update_provider(
    slug: str,
    payload: UpdateProviderRequest,
    db: DbDep,
    resolver: ResolverDep,
    cipher: CredentialCipherDep,
) -> ProviderPublic:
    """Update editable fields (default model, overrides, base URL, API key).

    Omitted fields are left untouched; ``pipeline_overrides`` replaces the
    whole map rather than merging. ``api_key`` distinguishes "omitted"
    from an explicit ``null`` via ``model_fields_set`` so a caller can clear
    the key requirement without also having to resend every other field.
    """
    overrides: dict[str, dict[str, Any]] | None = None
    if payload.pipeline_overrides is not None:
        overrides = {
            key: override.model_dump(exclude_none=True)
            for key, override in payload.pipeline_overrides.items()
        }
    api_key_ciphertext = (
        (
            cipher.encrypt(payload.api_key.get_secret_value())
            if payload.api_key is not None
            else None
        )
        if "api_key" in payload.model_fields_set
        else UNSET
    )
    row = await db.update_provider(
        slug,
        name=payload.name,
        default_model=payload.default_model,
        pipeline_overrides=overrides,
        base_url=payload.base_url,
        api_key_ciphertext=api_key_ciphertext,
    )
    if row is None:
        raise HTTPException(status_code=404, detail=f"no provider with slug {slug!r}")
    resolver.invalidate()
    return ProviderPublic.from_row(row)


@router.delete("/providers/{slug}", status_code=204)
async def delete_provider(slug: str, db: DbDep) -> None:
    """Permanently remove a provider row.

    The active provider can never be deleted (409) — the resolver cache only
    ever holds the active row, so this guard also means a delete can never
    invalidate it and no NOTIFY is needed. A row activated between the
    active-check and the delete itself is caught by the delete's own
    ``AND NOT is_active`` predicate, which also maps to 409.
    """
    row = await db.get_provider(slug)
    if row is None:
        raise HTTPException(status_code=404, detail=f"no provider with slug {slug!r}")
    if row.is_active:
        raise HTTPException(status_code=409, detail="cannot delete the active provider")
    deleted = await db.delete_provider(slug)
    if not deleted:
        raise HTTPException(status_code=409, detail="cannot delete the active provider")
