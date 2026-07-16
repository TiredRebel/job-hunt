"""Adapter registry: maps ``core.sources.slug`` to adapter factories.

The registry is config-driven — enabling/disabling a source happens in the
database (``core.sources.enabled``), not in code. Each source's
``fetch_strategy`` selects a fetcher via a caller-supplied factory (see
design.md D3 in openspec/changes/phase-2-crawl4ai-fetch-ladder); adapters
that already own a content-probe CSS selector (for fingerprinting) expose it
as a ``content_selector`` class attribute so the same selector sharpens the
JS-shell escalation heuristic without duplicating the string.
"""

from __future__ import annotations

from collections.abc import Callable
from typing import Any

from scraper.adapters.dou import DouAdapter
from scraper.adapters.jobua import JobUaAdapter
from scraper.adapters.reddit import RedditAdapter
from scraper.adapters.upwork import UpworkAdapter
from scraper.adapters.workua import WorkUaAdapter
from scraper.fetchers import PageFetcher
from scraper.ports import SourceAdapter

AdapterFactory = Callable[[dict[str, Any], PageFetcher], SourceAdapter]

#: Resolves a source's ``fetch_strategy`` (plus an optional adapter-owned
#: content-probe selector) to the fetcher an adapter should use.
FetcherFactory = Callable[[str, str | None], PageFetcher]

_FACTORIES: dict[str, AdapterFactory] = {
    DouAdapter.slug: DouAdapter,
    WorkUaAdapter.slug: WorkUaAdapter,
    JobUaAdapter.slug: JobUaAdapter,
    RedditAdapter.slug: RedditAdapter,
    UpworkAdapter.slug: UpworkAdapter,
}


class UnknownSourceError(LookupError):
    """Raised when no adapter is registered for a source slug."""


def known_slugs() -> frozenset[str]:
    """Return the slugs with a registered adapter.

    Returns:
        Immutable set of adapter slugs.
    """
    return frozenset(_FACTORIES)


def create_adapter(
    slug: str, config: dict[str, Any], fetch_strategy: str, fetchers: FetcherFactory
) -> SourceAdapter:
    """Instantiate the adapter registered for ``slug``.

    Args:
        slug: Source slug from ``core.sources``.
        config: Source ``config`` JSONB passed to the adapter.
        fetch_strategy: ``core.sources.fetch_strategy`` for this source.
        fetchers: Factory resolving ``fetch_strategy`` to a fetcher.

    Returns:
        A fresh adapter instance (adapters are per-run, they cache listings).

    Raises:
        UnknownSourceError: When ``slug`` has no registered adapter.
        UnsupportedStrategyError: When ``fetchers`` can't resolve
            ``fetch_strategy`` (unknown value, or a known strategy whose
            fetcher isn't available — e.g. crawl4ai not installed).
    """
    factory = _FACTORIES.get(slug)
    if factory is None:
        raise UnknownSourceError(f"no adapter registered for source '{slug}'")
    content_probe = getattr(factory, "content_selector", None)
    fetcher = fetchers(fetch_strategy, content_probe)
    return factory(config, fetcher)
