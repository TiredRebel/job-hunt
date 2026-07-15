"""Request/response models for the REST surface."""

from pydantic import BaseModel

from llm.db import ProviderRow
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


class ProviderPublic(BaseModel):
    """Registry row as exposed over REST (key *names* only, never values)."""

    slug: str
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
