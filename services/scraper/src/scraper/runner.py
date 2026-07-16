"""Scrape-run orchestration.

Coordinates one run for one source: builds queries from keyword
dictionaries, walks the adapter's discover/fetch pipeline, persists raw
postings with dedup, and finalizes ``scraper.scrape_runs`` bookkeeping.
Depends only on ports and domain models — never on concrete adapters.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass

from scraper.db import Database, SourceRow
from scraper.fetchers import FetchBlockedError, FetchUnavailableError
from scraper.models import RunStats, RunStatus, SearchQuery
from scraper.ports import SourceAdapter
from scraper.queries import build_search_queries

logger = logging.getLogger(__name__)


@dataclass(frozen=True, slots=True)
class RunResult:
    """Outcome of a completed scrape run.

    Attributes:
        run_id: Id of the ``scraper.scrape_runs`` row.
        status: Terminal run status.
        stats: Final counters.
    """

    run_id: int
    status: RunStatus
    stats: RunStats


async def run_scrape(
    db: Database,
    adapter: SourceAdapter,
    source: SourceRow,
    run_id: int,
    *,
    max_leads_per_query: int = 50,
) -> RunResult:
    """Execute one scrape run for ``source`` using ``adapter``.

    Per-lead failures are counted and skipped (run ends ``partial``);
    only run-level failures (e.g. lost DB) mark the run ``failed``. ``run_id``
    is created by the caller (before backgrounding this coroutine) so
    ``POST /scrape/{slug}`` can return it synchronously.

    Args:
        db: Open database facade.
        adapter: Adapter matching ``source["slug"]``.
        source: Source row the run belongs to.
        run_id: Id of the already-created ``scraper.scrape_runs`` row.
        max_leads_per_query: Cap on fetched leads per search query.

    Returns:
        The finalized run outcome.
    """
    queries = build_search_queries(await db.search_dictionaries(), source["slug"])
    stats = RunStats()
    logger.info("run %d: source=%s queries=%d", run_id, source["slug"], len(queries))
    try:
        seen: set[str] = set()
        for query in queries:
            await _scrape_query(
                db, adapter, source, query, run_id, stats, seen, max_leads_per_query
            )
    except Exception as exc:  # noqa: BLE001 — run-level failure is recorded, not raised.
        logger.exception("run %d failed", run_id)
        await db.finish_run(run_id, RunStatus.FAILED, stats, error=str(exc))
        return RunResult(run_id=run_id, status=RunStatus.FAILED, stats=stats)
    status = RunStatus.SUCCESS if stats.errors == 0 else RunStatus.PARTIAL
    await db.finish_run(run_id, status, stats)
    logger.info("run %d finished: %s %s", run_id, status.value, stats.as_dict())
    return RunResult(run_id=run_id, status=status, stats=stats)


async def _scrape_query(
    db: Database,
    adapter: SourceAdapter,
    source: SourceRow,
    query: SearchQuery,
    run_id: int,
    stats: RunStats,
    seen: set[str],
    max_leads: int,
) -> None:
    """Discover and persist leads for a single search query.

    Args:
        db: Open database facade.
        adapter: Source adapter in use.
        source: Source row (for id/slug).
        query: Search query to run.
        run_id: Current run id.
        stats: Counters mutated in place.
        seen: External ids already handled in this run (mutated in place).
        max_leads: Cap on fetched leads for this query.
    """
    fetched_for_query = 0
    async for lead in adapter.discover(query):
        stats.discovered += 1
        if lead.external_id in seen:
            continue
        seen.add(lead.external_id)
        if fetched_for_query >= max_leads:
            continue
        fetched_for_query += 1
        try:
            posting = await adapter.fetch_detail(lead)
        except FetchBlockedError as exc:
            logger.warning("run %d: blocked on %s (%s)", run_id, lead.url, exc)
            stats.skipped += 1
            continue
        except FetchUnavailableError as exc:
            logger.warning("run %d: fetcher unavailable for %s (%s)", run_id, lead.url, exc)
            stats.skipped += 1
            continue
        except Exception:  # noqa: BLE001 — one bad vacancy must not sink the run.
            logger.exception("run %d: failed to fetch %s", run_id, lead.url)
            stats.errors += 1
            continue
        if posting is None:
            stats.skipped += 1
            continue
        stats.fetched += 1
        if await db.insert_raw(run_id, source["id"], posting):
            stats.inserted += 1
        else:
            stats.duplicates += 1
