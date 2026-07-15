"""API tests for the scrape/run endpoints (fake DB wired into app state)."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from fastapi.testclient import TestClient

from scraper.db import RunRow, SourceRow
from scraper.main import app
from scraper.models import RunStats, RunStatus
from scraper.queries import SearchDictionaryRow


class FakeDb:
    """Stand-in for the app-state Database."""

    def __init__(self, source: SourceRow | None = None, runs: list[RunRow] | None = None) -> None:
        """Seed canned rows."""
        self._source = source
        self._runs = runs or []
        self.finished = False

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


def _source(slug: str = "dou", enabled: bool = True) -> SourceRow:
    return {
        "id": 1,
        "slug": slug,
        "name": slug,
        "enabled": enabled,
        "fetch_strategy": "crawl4ai",
        "config": {},
    }


def _client(db: FakeDb) -> TestClient:
    app.state.db = db
    app.state.client = object()  # adapters only store it; no network in tests
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


def test_scrape_accepted_and_run_finalized() -> None:
    db = FakeDb(source=_source())
    client = _client(db)

    response = client.post("/scrape/dou")

    assert response.status_code == 202
    assert response.json() == {"status": "accepted", "source": "dou"}
    assert db.finished  # background task completed within the test client


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
