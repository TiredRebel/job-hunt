"""Request/response models for the REST surface."""

from typing import Literal

from pydantic import BaseModel, Field

from llm.db import ProviderRow
from llm.resolver import PipelineName
from llm.schemas import CoverLetter, JobSummary, MatchResult, NormalizedJob, ProfileInput


class ProcessJobRequest(BaseModel):
    """Input for ``POST /process/job`` — raw posting plus optional profile."""

    job_id: int | None = None
    title: str
    body: str
    source_url: str | None = None
    profile: ProfileInput | None = None


class ProcessJobResponse(BaseModel):
    """Output of the processing graph; later stages are None when skipped."""

    normalized: NormalizedJob
    summary: JobSummary
    match: MatchResult | None = None
    cover_letter: CoverLetter | None = None


class MatchRequest(BaseModel):
    """Input for ``POST /match`` — an already-normalized job plus profile."""

    job_id: int | None = None
    job: NormalizedJob
    summary: JobSummary | None = None
    profile: ProfileInput


class CoverLetterRequest(BaseModel):
    """Input for ``POST /cover-letter`` — an already-normalized job plus profile."""

    job_id: int | None = None
    job: NormalizedJob
    profile: ProfileInput


class ProviderPublic(BaseModel):
    """Registry row as exposed over REST (key *names* only, never values)."""

    slug: str
    name: str
    kind: str
    base_url: str
    default_model: str
    api_key_env: str | None = None
    pipeline_overrides: dict[str, dict[str, object]]
    is_active: bool

    @classmethod
    def from_row(cls, row: ProviderRow) -> "ProviderPublic":
        """Project a DB row onto the public shape (drops ``params``)."""
        return cls.model_validate(row.model_dump(exclude={"params"}))


class SetActiveProviderRequest(BaseModel):
    """Input for ``PUT /providers/active``."""

    slug: str


class CreateProviderRequest(BaseModel):
    """Input for ``POST /providers``. Rows are created inactive."""

    slug: str = Field(pattern=r"^[a-z0-9-]+$")
    name: str | None = Field(default=None, min_length=1)
    kind: Literal["ollama", "openai-compatible", "anthropic"] = "openai-compatible"
    base_url: str = Field(min_length=1)
    default_model: str = Field(min_length=1)
    api_key_env: str | None = Field(default=None, pattern=r"^[A-Z_][A-Z0-9_]*$")


class PipelineOverride(BaseModel):
    """One pipeline's model and/or temperature override."""

    model: str | None = None
    temperature: float | None = Field(default=None, ge=0, le=2)


class UpdateProviderRequest(BaseModel):
    """Input for ``PATCH /providers/{slug}``. Omitted fields are left untouched.

    ``api_key_env`` is nullable so an explicit ``null`` (clear the key
    requirement) round-trips distinctly from omitting the field — callers
    check ``"api_key_env" in payload.model_fields_set`` to tell the two apart.
    """

    name: str | None = Field(default=None, min_length=1)
    default_model: str | None = Field(default=None, min_length=1)
    base_url: str | None = Field(default=None, min_length=1)
    api_key_env: str | None = Field(default=None, pattern=r"^[A-Z_][A-Z0-9_]*$")
    pipeline_overrides: dict[PipelineName, PipelineOverride] | None = None


class ProviderTestResponse(BaseModel):
    """Outcome of ``POST /providers/{slug}/test``."""

    ok: bool
    detail: str | None = None
    elapsed_ms: int | None = None


class ProviderConnectionTestRequest(BaseModel):
    """Unsaved connection fields accepted by ``POST /providers/test``."""

    kind: Literal["ollama", "openai-compatible", "anthropic"]
    base_url: str = Field(min_length=1)
    default_model: str = Field(min_length=1)
    api_key_env: str | None = Field(default=None, pattern=r"^[A-Z_][A-Z0-9_]*$")


class ModelListResponse(BaseModel):
    """Outcome of ``GET /providers/{slug}/models``."""

    models: list[str]
    error: str | None = None
