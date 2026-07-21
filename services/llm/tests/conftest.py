"""Shared fakes and fixtures for the LLM service tests."""

import os
from typing import Any

import pytest
from pydantic import BaseModel

from llm.db import UNSET, PipelineRunRecord, ProviderRow
from llm.errors import SchemaValidationError, UnknownProviderError
from llm.ports import LLMProvider
from llm.resolver import ProviderResolver
from llm.schemas import (
    CompletionRequest,
    CompletionResult,
    CoverLetter,
    JobSummary,
    MatchResult,
    NormalizedJob,
    ProfileInput,
    ProviderHealth,
)

os.environ.setdefault("INTERNAL_API_TOKEN", "test-internal-token-at-least-sixteen")

NORMALIZED = NormalizedJob(
    title="Senior Python Developer",
    company="Acme",
    location="Kyiv",
    remote=True,
    description_md="Build backend services in Python.",
)
SUMMARY = JobSummary(
    summary="Backend Python role at Acme.", tech_stack=["python", "postgresql"], red_flags=[]
)
MATCH_HIGH = MatchResult(score=91, explanation="strong fit", matched_skills=["python"])
MATCH_LOW = MatchResult(score=40, explanation="weak fit", missing_skills=["java"])
LETTER = CoverLetter(
    subject="Application: Senior Python Developer",
    body_md="I build backend services in Python.",
    grounded_on=["python"],
)
PROFILE = ProfileInput(summary="Backend dev, 8y Python.", skills=["python", "postgresql"])


class FakeProvider:
    """In-memory ``LLMProvider`` returning canned responses per schema type."""

    def __init__(
        self,
        responses: dict[type[BaseModel], BaseModel] | None = None,
        fail_times: int = 0,
        slug: str = "fake",
        models: list[str] | None = None,
        health_result: ProviderHealth | None = None,
        list_models_error: Exception | None = None,
        complete_error: Exception | None = None,
    ) -> None:
        self.slug = slug
        self.responses = responses or {}
        self.fail_times = fail_times
        self.calls: list[CompletionRequest] = []
        self.models = models if models is not None else ["model-a", "model-b"]
        self.health_result = health_result or ProviderHealth(ok=True)
        self.list_models_error = list_models_error
        self.complete_error = complete_error

    async def complete(self, req: CompletionRequest) -> CompletionResult:
        self.calls.append(req)
        if self.complete_error is not None:
            raise self.complete_error
        return CompletionResult(text="ok")

    async def complete_structured[ModelT: BaseModel](
        self, req: CompletionRequest, schema: type[ModelT]
    ) -> ModelT:
        self.calls.append(req)
        if self.fail_times > 0:
            self.fail_times -= 1
            raise SchemaValidationError("canned schema failure")
        result = self.responses[schema]
        assert isinstance(result, schema)
        return result

    async def health(self) -> ProviderHealth:
        return self.health_result

    async def list_models(self) -> list[str]:
        if self.list_models_error is not None:
            raise self.list_models_error
        return self.models


class FakeDb:
    """In-memory stand-in for :class:`llm.db.Db`."""

    def __init__(self, rows: list[ProviderRow]) -> None:
        self.rows = rows
        self.runs: list[PipelineRunRecord] = []
        self.notified = 0

    async def list_providers(self) -> list[ProviderRow]:
        return self.rows

    async def active_provider(self) -> ProviderRow | None:
        return next((r for r in self.rows if r.is_active), None)

    async def set_active(self, slug: str) -> ProviderRow:
        if all(r.slug != slug for r in self.rows):
            raise UnknownProviderError(f"no provider with slug {slug!r}")
        self.rows = [r.model_copy(update={"is_active": r.slug == slug}) for r in self.rows]
        self.notified += 1
        return next(r for r in self.rows if r.slug == slug)

    async def get_provider(self, slug: str) -> ProviderRow | None:
        return next((r for r in self.rows if r.slug == slug), None)

    async def create_provider(
        self,
        slug: str,
        name: str,
        kind: str,
        base_url: str,
        default_model: str,
        api_key_ciphertext: str | None = None,
    ) -> ProviderRow | None:
        if any(r.slug == slug for r in self.rows):
            return None
        row = ProviderRow(
            slug=slug,
            name=name,
            kind=kind,
            base_url=base_url,
            default_model=default_model,
            api_key_ciphertext=api_key_ciphertext,
            pipeline_overrides={},
            is_active=False,
        )
        self.rows.append(row)
        return row

    async def update_provider(
        self,
        slug: str,
        *,
        name: str | None = None,
        default_model: str | None = None,
        pipeline_overrides: dict[str, dict[str, Any]] | None = None,
        base_url: str | None = None,
        api_key_ciphertext: str | None = UNSET,
    ) -> ProviderRow | None:
        idx = next((i for i, r in enumerate(self.rows) if r.slug == slug), None)
        if idx is None:
            return None
        updates: dict[str, Any] = {}
        if default_model is not None:
            updates["default_model"] = default_model
        if name is not None:
            updates["name"] = name
        if pipeline_overrides is not None:
            updates["pipeline_overrides"] = pipeline_overrides
        if base_url is not None:
            updates["base_url"] = base_url
        if api_key_ciphertext is not UNSET:
            updates["api_key_ciphertext"] = api_key_ciphertext
        row = self.rows[idx].model_copy(update=updates)
        self.rows[idx] = row
        self.notified += 1
        return row

    async def delete_provider(self, slug: str) -> bool:
        idx = next((i for i, r in enumerate(self.rows) if r.slug == slug and not r.is_active), None)
        if idx is None:
            return False
        del self.rows[idx]
        return True

    async def record_run(self, run: PipelineRunRecord) -> None:
        self.runs.append(run)


def make_row(
    slug: str = "ollama-local",
    name: str = "Ollama local",
    kind: str = "ollama",
    overrides: dict[str, dict[str, Any]] | None = None,
    active: bool = True,
    default_model: str = "qwen3:14b",
    api_key_ciphertext: str | None = None,
) -> ProviderRow:
    """Build a ``core.llm_providers`` row for tests."""
    return ProviderRow(
        slug=slug,
        name=name,
        kind=kind,
        base_url="http://localhost:11434",
        default_model=default_model,
        api_key_ciphertext=api_key_ciphertext,
        pipeline_overrides=overrides or {},
        is_active=active,
    )


def all_responses() -> dict[type[BaseModel], BaseModel]:
    """Canned responses covering every pipeline schema (high match)."""
    return {
        NormalizedJob: NORMALIZED,
        JobSummary: SUMMARY,
        MatchResult: MATCH_HIGH,
        CoverLetter: LETTER,
    }


def make_resolver(provider: LLMProvider, row: ProviderRow | None = None) -> ProviderResolver:
    """Resolver that always resolves to ``provider``."""
    active_row = row or make_row()

    async def fetch() -> ProviderRow | None:
        return active_row

    return ProviderResolver(fetch, lambda _row: provider, ttl_s=30.0)


@pytest.fixture
def fake_provider() -> FakeProvider:
    return FakeProvider(all_responses())
