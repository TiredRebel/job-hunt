"""Pydantic contracts: provider I/O and pipeline structured outputs.

Every pipeline defines a schema here; providers must return schema-valid
JSON (structured-output discipline, see docs/LLM_CONFIG.md).
"""

from pydantic import BaseModel, Field

# ── provider I/O ─────────────────────────────────────────────────────


class CompletionRequest(BaseModel):
    """A single completion call to an ``LLMProvider``."""

    model: str
    prompt: str
    system: str | None = None
    temperature: float = 0.0
    max_tokens: int | None = None


class CompletionResult(BaseModel):
    """Free-text completion output with usage metadata."""

    text: str
    tokens_in: int | None = None
    tokens_out: int | None = None


class ProviderHealth(BaseModel):
    """Outcome of a provider connectivity probe (ok/fail only, no secrets)."""

    ok: bool
    detail: str | None = None


# ── pipeline inputs ──────────────────────────────────────────────────


class ProfileInput(BaseModel):
    """Candidate profile facts used for matching and cover letters."""

    summary: str
    skills: list[str] = Field(default_factory=list)
    preferences: str | None = None


# ── pipeline structured outputs ──────────────────────────────────────


class NormalizedJob(BaseModel):
    """Structured job extracted from a raw posting (pipeline ``normalize``)."""

    title: str
    company: str | None = None
    location: str | None = None
    remote: bool | None = None
    employment_type: str | None = None
    seniority: str | None = None
    salary_min: int | None = None
    salary_max: int | None = None
    salary_currency: str | None = None
    description_md: str


class JobSummary(BaseModel):
    """Summary, tech-stack tags and red flags (pipeline ``tag``)."""

    summary: str
    tech_stack: list[str] = Field(default_factory=list)
    red_flags: list[str] = Field(default_factory=list)


class MatchResult(BaseModel):
    """Profile match score with explanation (pipeline ``match``)."""

    score: int = Field(ge=0, le=100)
    explanation: str
    matched_skills: list[str] = Field(default_factory=list)
    missing_skills: list[str] = Field(default_factory=list)


class CoverLetter(BaseModel):
    """Grounded cover-letter draft (pipeline ``cover_letter``).

    ``grounded_on`` lists the exact job/profile facts the letter relies on,
    enforcing the anti-hallucination contract.
    """

    subject: str
    body_md: str
    grounded_on: list[str] = Field(default_factory=list)
