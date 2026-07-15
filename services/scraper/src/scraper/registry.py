"""Adapter registry: maps ``core.sources.slug`` to adapter factories.

The registry is config-driven — enabling/disabling a source happens in the
database (``core.sources.enabled``), not in code.
"""

from __future__ import annotations

from collections.abc import Callable
from typing import Any

from scraper.adapters.dou import DouAdapter
from scraper.adapters.jobua import JobUaAdapter
from scraper.adapters.reddit import RedditAdapter
from scraper.adapters.upwork import UpworkAdapter
from scraper.adapters.workua import WorkUaAdapter
from scraper.fetch import PoliteClient
from scraper.ports import SourceAdapter

AdapterFactory = Callable[[dict[str, Any], PoliteClient], SourceAdapter]

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


def create_adapter(slug: str, config: dict[str, Any], client: PoliteClient) -> SourceAdapter:
    """Instantiate the adapter registered for ``slug``.

    Args:
        slug: Source slug from ``core.sources``.
        config: Source ``config`` JSONB passed to the adapter.
        client: Shared polite HTTP client.

    Returns:
        A fresh adapter instance (adapters are per-run, they cache listings).

    Raises:
        UnknownSourceError: When ``slug`` has no registered adapter.
    """
    factory = _FACTORIES.get(slug)
    if factory is None:
        raise UnknownSourceError(f"no adapter registered for source '{slug}'")
    return factory(config, client)
