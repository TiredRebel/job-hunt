"""Tests for scrape-run orchestration (fake DB and adapter, no network)."""

from __future__ import annotations

from collections.abc import AsyncIterator
from typing import cast

from scraper.db import Database, SourceRow
from scraper.dedup import content_fingerprint
from scraper.fetchers import FetchResult
from scraper.models import JobLead, RawJobPosting, RunStats, RunStatus, SearchQuery
from scraper.queries import SearchDictionaryRow
from scraper.runner import run_scrape

SOURCE: SourceRow = {
    "id": 1,
    "slug": "fake",
    "name": "Fake",
    "enabled": True,
    "fetch_strategy": "api",
    "config": {},
}


class FakeDb:
    """In-memory stand-in for :class:`scraper.db.Database`."""

    def __init__(self, terms: list[str]) -> None:
        """Seed the fake with search terms."""
        self._terms = terms
        self.inserted: list[RawJobPosting] = []
        self.finished: tuple[RunStatus, RunStats, str | None] | None = None
        self._keys: set[tuple[str, str]] = set()

    async def search_dictionaries(self) -> list[SearchDictionaryRow]:
        """Return the seeded search dictionary."""
        return [{"items": self._terms, "applies_to": []}]

    async def create_run(self, source_id: int) -> int:
        """Return a fixed run id."""
        return 42

    async def finish_run(
        self,
        run_id: int,
        status: RunStatus,
        stats: RunStats,
        error: str | None = None,
    ) -> None:
        """Record the terminal state."""
        self.finished = (status, stats, error)

    async def insert_raw(self, run_id: int, source_id: int, posting: RawJobPosting) -> bool:
        """Emulate the unique-constraint dedup."""
        key = (posting.lead.external_id, posting.content_hash)
        if key in self._keys:
            return False
        self._keys.add(key)
        self.inserted.append(posting)
        return True


def _lead(external_id: str) -> JobLead:
    return JobLead(external_id=external_id, url=f"https://x/{external_id}", title=external_id)


def _posting(lead: JobLead, text: str) -> RawJobPosting:
    return RawJobPosting(lead=lead, raw_html=text, content_hash=content_fingerprint(text))


class FakeAdapter:
    """Scripted adapter: behavior keyed by external id prefix."""

    slug = "fake"

    def __init__(self, leads: list[JobLead]) -> None:
        """Store the leads yielded for every query."""
        self._leads = leads

    async def discover(self, query: SearchQuery) -> AsyncIterator[JobLead]:
        """Yield the scripted leads."""
        for lead in self._leads:
            yield lead

    async def fetch_detail(self, lead: JobLead) -> RawJobPosting | None:
        """Return/skip/raise depending on the lead id prefix."""
        if lead.external_id.startswith("err"):
            raise ValueError("boom")
        if lead.external_id.startswith("skip"):
            return None
        return _posting(lead, f"content of {lead.external_id}")

    async def probe(self) -> FetchResult:
        """Unused by these tests; present to satisfy the protocol."""
        return FetchResult(text="", url="https://x/fake")


async def test_run_scrape_success_counts_and_dedup() -> None:
    db = FakeDb(terms=["python", "fastapi"])  # two queries yield the same leads
    adapter = FakeAdapter([_lead("a"), _lead("b")])

    result = await run_scrape(cast(Database, db), adapter, SOURCE, 42)

    assert result.status is RunStatus.SUCCESS
    # Second query re-discovers both leads but `seen` skips re-fetching.
    assert result.stats.discovered == 4
    assert result.stats.fetched == 2
    assert result.stats.inserted == 2
    assert result.stats.errors == 0
    assert db.finished is not None and db.finished[0] is RunStatus.SUCCESS


async def test_run_scrape_partial_on_lead_errors_and_skips() -> None:
    db = FakeDb(terms=["python"])
    adapter = FakeAdapter([_lead("a"), _lead("err1"), _lead("skip1")])

    result = await run_scrape(cast(Database, db), adapter, SOURCE, 42)

    assert result.status is RunStatus.PARTIAL
    assert result.stats.inserted == 1
    assert result.stats.errors == 1
    assert result.stats.skipped == 1


async def test_run_scrape_respects_per_query_cap() -> None:
    db = FakeDb(terms=["python"])
    adapter = FakeAdapter([_lead(str(n)) for n in range(5)])

    result = await run_scrape(cast(Database, db), adapter, SOURCE, 42, max_leads_per_query=2)

    assert result.stats.discovered == 5
    assert result.stats.fetched == 2


async def test_run_scrape_failed_on_fatal_error() -> None:
    class ExplodingAdapter(FakeAdapter):
        """Adapter whose discovery fails immediately."""

        def discover(self, query: SearchQuery) -> AsyncIterator[JobLead]:
            """Raise instead of yielding."""
            raise RuntimeError("listing down")

    db = FakeDb(terms=["python"])

    result = await run_scrape(cast(Database, db), ExplodingAdapter([]), SOURCE, 42)

    assert result.status is RunStatus.FAILED
    assert db.finished is not None
    assert db.finished[2] == "listing down"


async def test_run_scrape_failed_when_dictionary_is_malformed() -> None:
    """A non-string dictionary item must still finalize the run, not wedge it."""
    db = FakeDb(terms=cast("list[str]", [1, 2]))

    result = await run_scrape(cast(Database, db), FakeAdapter([]), SOURCE, 42)

    assert result.status is RunStatus.FAILED
    assert db.finished is not None
    assert db.finished[0] is RunStatus.FAILED
