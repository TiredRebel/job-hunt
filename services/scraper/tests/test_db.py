"""Focused persistence regressions for raw-job date backfills."""

from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from datetime import UTC, datetime
from typing import Any, cast

from scraper.db import Database
from scraper.models import JobLead, RawJobPosting


class FakeCursor:
    """Minimal async cursor carrying rowcount and one optional row."""

    def __init__(self, *, rowcount: int = 0, row: dict[str, Any] | None = None) -> None:
        self.rowcount = rowcount
        self._row = row

    async def fetchone(self) -> dict[str, Any] | None:
        """Return the configured row."""
        return self._row


class FakeConnection:
    """Record SQL issued by ``Database.insert_raw``."""

    def __init__(self) -> None:
        self.calls: list[tuple[str, tuple[object, ...]]] = []

    async def execute(self, query: str, params: tuple[object, ...]) -> FakeCursor:
        """Return scripted cursors for insert, raw backfill, and core backfill."""
        self.calls.append((query, params))
        if query.startswith("INSERT INTO scraper.jobs_raw"):
            return FakeCursor(rowcount=0)
        if query.startswith("UPDATE scraper.jobs_raw"):
            return FakeCursor(rowcount=1, row={"id": 99})
        return FakeCursor(rowcount=1)


class FakePool:
    """Expose one fake connection through the pool context-manager shape."""

    def __init__(self, connection: FakeConnection) -> None:
        self._connection = connection

    @asynccontextmanager
    async def connection(self) -> AsyncIterator[FakeConnection]:
        """Yield the configured connection."""
        yield self._connection


async def test_authoritative_duplicate_date_overwrites_raw_and_core_without_requeue() -> None:
    posted_at = datetime(2026, 8, 5, tzinfo=UTC)
    posting = RawJobPosting(
        lead=JobLead(
            external_id="dou-1",
            url="https://jobs.dou.ua/vacancies/1/",
            title="Python Engineer",
            posted_at=posted_at,
            posted_at_is_authoritative=True,
        ),
        raw_html="Python vacancy",
        content_hash="hash",
    )
    connection = FakeConnection()
    database = Database.__new__(Database)
    database._pool = cast(Any, FakePool(connection))

    inserted = await database.insert_raw(10, 20, posting)

    assert inserted is False
    assert len(connection.calls) == 3
    raw_update, core_update = connection.calls[1:]
    assert "CASE WHEN %s THEN %s" in raw_update[0]
    assert raw_update[1] == (True, posted_at, posted_at, 20, "dou-1", "hash")
    assert "CASE WHEN %s THEN %s" in core_update[0]
    assert core_update[1] == (True, posted_at, posted_at, 99)
    assert all("processing_status" not in query for query, _params in connection.calls)


async def test_inferred_duplicate_date_only_fills_missing_values() -> None:
    posted_at = datetime(2026, 8, 5, tzinfo=UTC)
    posting = RawJobPosting(
        lead=JobLead(
            external_id="dou-1",
            url="https://jobs.dou.ua/vacancies/1/",
            title="Python Engineer",
            posted_at=posted_at,
        ),
        raw_html="Python vacancy",
        content_hash="hash",
    )
    connection = FakeConnection()
    database = Database.__new__(Database)
    database._pool = cast(Any, FakePool(connection))

    inserted = await database.insert_raw(10, 20, posting)

    assert inserted is False
    assert connection.calls[1][1] == (False, posted_at, posted_at, 20, "dou-1", "hash")
    assert connection.calls[2][1] == (False, posted_at, posted_at, 99)
    assert all("processing_status" not in query for query, _params in connection.calls)
