"""Shared fakes and fixtures for the LLM service tests."""

from typing import Any

import pytest
from pydantic import BaseModel

from llm.db import PipelineRunRecord, ProviderRow
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
    ) -> None:
        self.slug = slug
        self.responses = responses or {}
        self.fail_times = fail_times
        self.calls: list[CompletionRequest] = []

    async def complete(self, req: CompletionRequest) -> CompletionResult:
        self.calls.append(req)
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
        return ProviderHealth(ok=True)


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

    async def record_run(self, run: PipelineRunRecord) -> None:
        self.runs.append(run)


def make_row(
    slug: str = "ollama-local",
    kind: str = "ollama",
    overrides: dict[str, dict[str, Any]] | None = None,
    active: bool = True,
    default_model: str = "qwen3:14b",
    api_key_env: str | None = None,
) -> ProviderRow:
    """Build a ``core.llm_providers`` row for tests."""
    return ProviderRow(
        slug=slug,
        kind=kind,
        base_url="http://localhost:11434",
        default_model=default_model,
        api_key_env=api_key_env,
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
