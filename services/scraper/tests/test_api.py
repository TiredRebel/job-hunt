"""API tests for the scrape/run endpoints (fake DB wired into app state)."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from fastapi.testclient import TestClient

from scraper.db import DeadLetterRow, RawJobRow, RunRow, SourceRow
from scraper.fetchers import (
    FetchBlockedError,
    FetchResult,
    FetchUnavailableError,
    PolitenessOverrides,
    UnsupportedStrategyError,
)
from scraper.main import app
from scraper.models import ProcessingStatus, RunStats, RunStatus
from scraper.queries import SearchDictionaryRow
from scraper.registry import known_slugs


class FakeDb:
    """Stand-in for the app-state Database."""

    def __init__(
        self,
        source: SourceRow | None = None,
        runs: list[RunRow] | None = None,
        raw_jobs: list[RawJobRow] | None = None,
    ) -> None:
        """Seed canned rows."""
        self._source = source
        self._runs = runs or []
        self.finished = False
        self.raw_jobs = {row["id"]: dict(row) for row in (raw_jobs or [])}

    async def get_source(self, slug: str) -> SourceRow | None:
        """Return the canned source."""
        return self._source

    async def list_runs(self, limit: int = 20) -> list[RunRow]:
        """Return the canned runs."""
        return self._runs[:limit]

    async def search_dictionaries(self) -> list[SearchDictionaryRow]:
        """No queries → background run finishes instantly."""
        return []

    async def create_run(self, source_id: int) -> int:
        """Return a fixed run id."""
        return 7

    async def finish_run(
        self, run_id: int, status: RunStatus, stats: RunStats, error: str | None = None
    ) -> None:
        """Record that the run was finalized."""
        self.finished = True

    async def list_unprocessed(self, limit: int) -> list[RawJobRow]:
        """Return the canned unprocessed rows."""
        return list(self.raw_jobs.values())[:limit]  # type: ignore[return-value]

    async def list_dead_letter(self, limit: int) -> list[DeadLetterRow]:
        """Return the canned rows that reached ``processing_status = 'failed'``."""
        failed = [row for row in self.raw_jobs.values() if row.get("processing_status") == "failed"]
        return failed[:limit]  # type: ignore[return-value]

    async def mark_processed(
        self, raw_id: int, status: ProcessingStatus, max_attempts: int
    ) -> bool:
        """Emulate the attempt-counter / terminal-status logic."""
        row = self.raw_jobs.get(raw_id)
        if row is None:
            return False
        if status is ProcessingStatus.DONE:
            row["processing_status"] = "done"
        else:
            row["process_attempts"] += 1
            if row["process_attempts"] >= max_attempts:
                row["processing_status"] = "failed"
        return True


def _source(slug: str = "dou", enabled: bool = True, fetch_strategy: str = "api") -> SourceRow:
    return {
        "id": 1,
        "slug": slug,
        "name": slug,
        "enabled": enabled,
        "fetch_strategy": fetch_strategy,
        "config": {},
    }


def _fake_fetchers(strategy: str, _probe: str | None) -> object:
    """Mirror the real factory's shape: only ``api`` resolves, no network."""
    if strategy == "api":
        return object()  # adapters only store it; never used to fetch in these tests
    raise UnsupportedStrategyError(f"fetch_strategy '{strategy}' has no fetcher available yet")


def _client(db: FakeDb) -> TestClient:
    app.state.db = db
    app.state.client = object()  # adapters only store it; no network in tests
    app.state.fetchers = _fake_fetchers
    return TestClient(app)


class FakeFetcher:
    """Controllable fetcher: returns a canned result or raises a canned error."""

    def __init__(self, result: FetchResult | None = None, error: Exception | None = None) -> None:
        """Store the canned outcome."""
        self._result = result
        self._error = error

    async def get(
        self,
        url: str,
        *,
        params: dict[str, str] | None = None,
        politeness: PolitenessOverrides | None = None,
    ) -> FetchResult:
        """Return the canned result, or raise the canned error."""
        del politeness
        if self._error is not None:
            raise self._error
        assert self._result is not None  # noqa: S101 — test helper invariant.
        return self._result


def _client_with_fetcher(db: FakeDb, fetcher: FakeFetcher) -> TestClient:
    def fetchers(strategy: str, _probe: str | None) -> object:
        if strategy == "api":
            return fetcher
        raise UnsupportedStrategyError(f"fetch_strategy '{strategy}' has no fetcher available yet")

    app.state.db = db
    app.state.client = object()
    app.state.fetchers = fetchers
    return TestClient(app)


def test_scrape_unknown_source_is_404() -> None:
    client = _client(FakeDb(source=None))

    response = client.post("/scrape/nope")

    assert response.status_code == 404


def test_scrape_disabled_source_is_409() -> None:
    client = _client(FakeDb(source=_source(enabled=False)))

    response = client.post("/scrape/dou")

    assert response.status_code == 409


def test_scrape_unregistered_adapter_is_404() -> None:
    client = _client(FakeDb(source=_source(slug="linkedin")))

    response = client.post("/scrape/linkedin")

    assert response.status_code == 404


def test_scrape_unsupported_strategy_is_500() -> None:
    client = _client(FakeDb(source=_source(fetch_strategy="crawl4ai")))

    response = client.post("/scrape/dou")

    assert response.status_code == 500


def test_scrape_accepted_and_run_finalized() -> None:
    db = FakeDb(source=_source())
    client = _client(db)

    response = client.post("/scrape/dou")

    assert response.status_code == 202
    assert response.json() == {"status": "accepted", "source": "dou", "runId": 7}
    assert db.finished  # background task completed within the test client


def _raw_job(job_id: int = 1, attempts: int = 0) -> dict[str, Any]:
    return {
        "id": job_id,
        "source_id": 1,
        "source_slug": "dou",
        "external_id": "ext-1",
        "url": "https://jobs.dou.ua/1",
        "title": "Senior Python Developer",
        "raw_html": "<html>...</html>",
        "fetched_at": datetime(2026, 7, 16, 9, 0, tzinfo=UTC),
        "process_attempts": attempts,
    }


def test_list_unprocessed_returns_rows() -> None:
    client = _client(FakeDb(raw_jobs=[_raw_job()]))  # type: ignore[list-item]

    response = client.get("/jobs_raw/unprocessed", params={"limit": 10})

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["title"] == "Senior Python Developer"


def test_list_dead_letter_returns_only_failed_rows() -> None:
    pending = _raw_job(job_id=1, attempts=0)
    failed = {
        **_raw_job(job_id=2, attempts=3),
        "processing_status": "failed",
        "processed_at": datetime(2026, 7, 16, 10, 0, tzinfo=UTC),
    }
    client = _client(FakeDb(raw_jobs=[pending, failed]))  # type: ignore[list-item]

    response = client.get("/jobs_raw/dead-letter", params={"limit": 10})

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["id"] == 2
    assert body[0]["process_attempts"] == 3


def test_mark_processed_done() -> None:
    db = FakeDb(raw_jobs=[_raw_job()])  # type: ignore[list-item]
    client = _client(db)

    response = client.post("/jobs_raw/1/mark", json={"status": "done"})

    assert response.status_code == 200
    assert db.raw_jobs[1]["processing_status"] == "done"


def test_mark_processed_failed_stays_pending_under_limit() -> None:
    db = FakeDb(raw_jobs=[_raw_job(attempts=0)])  # type: ignore[list-item]
    client = _client(db)

    response = client.post("/jobs_raw/1/mark", json={"status": "failed"})

    assert response.status_code == 200
    assert db.raw_jobs[1]["process_attempts"] == 1
    assert db.raw_jobs[1].get("processing_status") != "failed"


def test_mark_processed_failed_gives_up_after_limit() -> None:
    db = FakeDb(raw_jobs=[_raw_job(attempts=2)])  # type: ignore[list-item]
    client = _client(db)

    response = client.post("/jobs_raw/1/mark", json={"status": "failed"})

    assert response.status_code == 200
    assert db.raw_jobs[1]["processing_status"] == "failed"


def test_mark_processed_unknown_raw_id_404() -> None:
    client = _client(FakeDb())

    response = client.post("/jobs_raw/999/mark", json={"status": "done"})

    assert response.status_code == 404


def test_list_runs_returns_rows() -> None:
    run: dict[str, Any] = {
        "id": 7,
        "source": "dou",
        "started_at": datetime(2026, 7, 15, 12, 0, tzinfo=UTC),
        "finished_at": None,
        "status": "running",
        "stats": {},
        "error": None,
    }
    client = _client(FakeDb(runs=[run]))  # type: ignore[list-item]

    response = client.get("/runs", params={"limit": 5})

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["id"] == 7
    assert body[0]["source"] == "dou"


def test_list_adapters_returns_registered_slugs() -> None:
    client = _client(FakeDb())

    response = client.get("/adapters")

    assert response.status_code == 200
    assert response.json() == {"slugs": sorted(known_slugs())}


def test_test_source_unknown_source_is_404() -> None:
    client = _client(FakeDb(source=None))

    response = client.post("/sources/nope/test")

    assert response.status_code == 404


def test_test_source_no_adapter() -> None:
    client = _client(FakeDb(source=_source(slug="linkedin", fetch_strategy="api")))

    response = client.post("/sources/linkedin/test")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "no_adapter"
    assert body["http_status"] is None
    assert body["elapsed_ms"] is None


def test_test_source_unsupported_strategy() -> None:
    client = _client(FakeDb(source=_source(fetch_strategy="crawl4ai")))

    response = client.post("/sources/dou/test")

    assert response.status_code == 200
    assert response.json()["status"] == "unsupported_strategy"


def test_test_source_ok() -> None:
    result = FetchResult(
        text="<html></html>", url="https://jobs.dou.ua/vacancies/", status_code=200
    )
    client = _client_with_fetcher(FakeDb(source=_source()), FakeFetcher(result=result))

    response = client.post("/sources/dou/test")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["http_status"] == 200
    assert body["elapsed_ms"] is not None
    assert body["elapsed_ms"] >= 0


def test_test_source_blocked() -> None:
    client = _client_with_fetcher(
        FakeDb(source=_source(slug="upwork")),
        FakeFetcher(error=FetchBlockedError("robots.txt disallows this path")),
    )

    response = client.post("/sources/upwork/test")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "blocked"
    assert "robots.txt" in body["detail"]


def test_test_source_failed_on_unavailable_tool() -> None:
    client = _client_with_fetcher(
        FakeDb(source=_source()), FakeFetcher(error=FetchUnavailableError("agent-browser missing"))
    )

    response = client.post("/sources/dou/test")

    assert response.status_code == 200
    assert response.json()["status"] == "failed"


def test_test_source_failed_on_unexpected_error() -> None:
    client = _client_with_fetcher(FakeDb(source=_source()), FakeFetcher(error=RuntimeError("boom")))

    response = client.post("/sources/dou/test")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "failed"
    assert body["detail"] == "boom"


def test_no_test_source_side_effects() -> None:
    """The test endpoint must not create a run row or write jobs_raw."""
    db = FakeDb(source=_source())
    result = FetchResult(text="", url="https://jobs.dou.ua/vacancies/", status_code=200)
    client = _client_with_fetcher(db, FakeFetcher(result=result))

    client.post("/sources/dou/test")

    assert db.finished is False
