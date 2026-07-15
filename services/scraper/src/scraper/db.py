"""Persistence layer: PostgreSQL access via psycopg (async pool).

Only this module speaks SQL; the runner and adapters exchange domain models
from :mod:`scraper.models`. Tables live in the ``scraper`` schema plus the
shared ``core.sources`` / ``core.keyword_dictionaries`` (see DATA_MODEL.md).
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, TypedDict, cast

from psycopg.rows import dict_row
from psycopg.types.json import Json
from psycopg_pool import AsyncConnectionPool

from scraper.models import RawJobPosting, RunStats, RunStatus
from scraper.queries import SearchDictionaryRow


class SourceRow(TypedDict):
    """Row of ``core.sources`` used by the runner."""

    id: int
    slug: str
    name: str
    enabled: bool
    fetch_strategy: str
    config: dict[str, Any]


class RunRow(TypedDict):
    """Row of ``scraper.scrape_runs`` joined with the source slug."""

    id: int
    source: str
    started_at: datetime
    finished_at: datetime | None
    status: str
    stats: dict[str, Any]
    error: str | None


class Database:
    """Thin async facade over the connection pool."""

    def __init__(self, dsn: str) -> None:
        """Create the (closed) pool.

        Args:
            dsn: PostgreSQL connection string.
        """
        self._pool = AsyncConnectionPool(dsn, open=False, kwargs={"row_factory": dict_row})

    async def open(self) -> None:
        """Open the pool and verify connectivity."""
        await self._pool.open(wait=True, timeout=30.0)

    async def close(self) -> None:
        """Close the pool."""
        await self._pool.close()

    async def get_source(self, slug: str) -> SourceRow | None:
        """Load one source by slug.

        Args:
            slug: Value of ``core.sources.slug``.

        Returns:
            The source row, or ``None`` when unknown.
        """
        async with self._pool.connection() as conn:
            cursor = await conn.execute(
                "SELECT id, slug, name, enabled, fetch_strategy, config"
                " FROM core.sources WHERE slug = %s",
                (slug,),
            )
            row = await cursor.fetchone()
        return cast("SourceRow", row) if row is not None else None

    async def search_dictionaries(self) -> list[SearchDictionaryRow]:
        """Load enabled search dictionaries (re-read on every run).

        Returns:
            Rows feeding :func:`scraper.queries.build_search_queries`.
        """
        async with self._pool.connection() as conn:
            cursor = await conn.execute(
                "SELECT items, applies_to FROM core.keyword_dictionaries"
                " WHERE kind = 'search' AND enabled ORDER BY id",
            )
            rows = await cursor.fetchall()
        return [cast("SearchDictionaryRow", row) for row in rows]

    async def create_run(self, source_id: int) -> int:
        """Insert a ``running`` scrape-run row.

        Args:
            source_id: FK into ``core.sources``.

        Returns:
            The new run id.
        """
        async with self._pool.connection() as conn:
            cursor = await conn.execute(
                "INSERT INTO scraper.scrape_runs (source_id) VALUES (%s) RETURNING id",
                (source_id,),
            )
            row = await cursor.fetchone()
        assert row is not None  # noqa: S101 — RETURNING always yields a row.
        return int(cast("dict[str, Any]", row)["id"])

    async def finish_run(
        self,
        run_id: int,
        status: RunStatus,
        stats: RunStats,
        error: str | None = None,
    ) -> None:
        """Finalize a scrape-run row.

        Args:
            run_id: Id returned by :meth:`create_run`.
            status: Terminal status.
            stats: Counters serialized into the JSONB ``stats`` column.
            error: Optional fatal error description.
        """
        async with self._pool.connection() as conn:
            await conn.execute(
                "UPDATE scraper.scrape_runs SET finished_at = now(),"
                " status = %s, stats = %s, error = %s WHERE id = %s",
                (status.value, Json(stats.as_dict()), error, run_id),
            )

    async def insert_raw(self, run_id: int, source_id: int, posting: RawJobPosting) -> bool:
        """Persist a raw posting, deduplicating on the unique constraint.

        Args:
            run_id: Current scrape run.
            source_id: FK into ``core.sources``.
            posting: Fetched payload.

        Returns:
            ``True`` when a new row was inserted, ``False`` on duplicate
            (same ``source_id + external_id + content_hash``).
        """
        async with self._pool.connection() as conn:
            cursor = await conn.execute(
                "INSERT INTO scraper.jobs_raw (run_id, source_id, external_id, url,"
                " raw_html, content_hash) VALUES (%s, %s, %s, %s, %s, %s)"
                " ON CONFLICT (source_id, external_id, content_hash) DO NOTHING",
                (
                    run_id,
                    source_id,
                    posting.lead.external_id,
                    posting.lead.url,
                    posting.raw_html,
                    posting.content_hash,
                ),
            )
        return cursor.rowcount == 1

    async def list_runs(self, limit: int = 20) -> list[RunRow]:
        """List recent scrape runs, newest first.

        Args:
            limit: Maximum number of rows.

        Returns:
            Run rows joined with the source slug.
        """
        async with self._pool.connection() as conn:
            cursor = await conn.execute(
                "SELECT r.id, s.slug AS source, r.started_at, r.finished_at,"
                " r.status, r.stats, r.error"
                " FROM scraper.scrape_runs r"
                " JOIN core.sources s ON s.id = r.source_id"
                " ORDER BY r.id DESC LIMIT %s",
                (limit,),
            )
            rows = await cursor.fetchall()
        return [cast("RunRow", row) for row in rows]
