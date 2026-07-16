"""Domain models for the scraper service.

Framework-free frozen dataclasses form the innermost layer of the clean
architecture (see docs/ARCHITECTURE.md §5). Database and HTTP concerns
depend on these types, never the other way around.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import datetime
from enum import StrEnum


class RunStatus(StrEnum):
    """Lifecycle states of a scrape run (mirrors ``scraper.scrape_runs.status``)."""

    RUNNING = "running"
    SUCCESS = "success"
    PARTIAL = "partial"
    FAILED = "failed"


class ProcessingStatus(StrEnum):
    """Lifecycle states of a raw job (mirrors ``scraper.jobs_raw.processing_status``)."""

    PENDING = "pending"
    QUEUED = "queued"
    DONE = "done"
    FAILED = "failed"


@dataclass(frozen=True, slots=True)
class SearchQuery:
    """A single search intent derived from keyword dictionaries.

    Attributes:
        term: Search phrase forwarded to the source (e.g. ``"python developer"``).
    """

    term: str


@dataclass(frozen=True, slots=True)
class JobLead:
    """Lightweight reference to a vacancy discovered on a listing page.

    Attributes:
        external_id: Stable identifier of the vacancy within the source.
        url: Canonical detail-page URL.
        title: Vacancy title as shown on the listing.
        company: Employer name when the listing exposes it.
        posted_at: Publication timestamp when the listing exposes it.
    """

    external_id: str
    url: str
    title: str
    company: str | None = None
    posted_at: datetime | None = None


@dataclass(frozen=True, slots=True)
class RawJobPosting:
    """Fetched vacancy payload ready for persistence into ``scraper.jobs_raw``.

    Attributes:
        lead: The lead this posting was fetched for.
        raw_html: Raw HTML (or JSON/RSS text) of the detail payload.
        content_hash: Fingerprint of the meaningful content, used for dedup.
    """

    lead: JobLead
    raw_html: str
    content_hash: str


@dataclass(slots=True)
class RunStats:
    """Mutable counters accumulated while a scrape run progresses.

    Attributes:
        discovered: Leads yielded by ``SourceAdapter.discover``.
        fetched: Detail payloads successfully fetched.
        inserted: New ``jobs_raw`` rows written.
        duplicates: Postings skipped because an identical row already exists.
        skipped: Leads the adapter declined to fetch (e.g. blocked source).
        errors: Leads that raised and were skipped.
    """

    discovered: int = 0
    fetched: int = 0
    inserted: int = 0
    duplicates: int = 0
    skipped: int = 0
    errors: int = 0

    def as_dict(self) -> dict[str, int]:
        """Serialize counters for the ``scrape_runs.stats`` JSONB column.

        Returns:
            Plain mapping of counter names to values.
        """
        return {key: int(value) for key, value in asdict(self).items()}
