"""Adapter registry: maps ``core.sources.slug`` to adapter registrations.

The registry is config-driven — enabling/disabling a source happens in the
database (``core.sources.enabled``), not in code. Each source's
``fetch_strategy`` selects a fetcher via a caller-supplied factory (see
design.md D3 in openspec/changes/phase-2-crawl4ai-fetch-ladder). Content
selectors are explicit registration metadata because the fetcher strategy
needs them before an adapter is constructed.
"""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from typing import Any

from scraper.adapters._html import StaticHtmlAdapter, StaticSourceDefinition
from scraper.adapters.dou import DOU_SOURCE
from scraper.adapters.jobua import JOBUA_SOURCE
from scraper.adapters.reddit import RedditAdapter
from scraper.adapters.upwork import UpworkAdapter
from scraper.adapters.workua import WORKUA_SOURCE
from scraper.fetchers import PageFetcher, PolitenessOverrides, SourceBoundFetcher
from scraper.ports import SourceAdapter

AdapterFactory = Callable[[dict[str, Any], PageFetcher], SourceAdapter]

#: Resolves a source's ``fetch_strategy`` (plus an optional adapter-owned
#: content-probe selector) to the fetcher an adapter should use.
FetcherFactory = Callable[[str, str | None], PageFetcher]


@dataclass(frozen=True, slots=True)
class AdapterRegistration:
    """Bind an adapter factory to the probe metadata used by its fetcher.

    Attributes:
        factory: Constructor or factory for one source adapter instance.
        content_probe: Optional CSS selector used by the fetch strategy when
            deciding whether rendered content is present.
    """

    factory: AdapterFactory
    content_probe: str | None


def _static_registration(source: StaticSourceDefinition) -> AdapterRegistration:
    """Create one registration from a static source definition.

    The adapter and fetcher receive metadata from the same immutable source
    definition, preventing the detail selector and escalation probe from
    drifting apart.

    Args:
        source: Source-specific static HTML mechanics and parser.

    Returns:
        Registration for a :class:`StaticHtmlAdapter` bound to ``source``.
    """

    def factory(config: dict[str, Any], fetcher: PageFetcher) -> SourceAdapter:
        """Construct the shared adapter for ``source``."""
        return StaticHtmlAdapter(source, config, fetcher)

    return AdapterRegistration(factory=factory, content_probe=source.content_selector)


def _politeness_overrides_from_config(config: dict[str, Any]) -> PolitenessOverrides:
    """Read per-source politeness overrides from ``core.sources.config``.

    Recognizes ``min_delay`` (float), ``jitter`` (float), and
    ``respect_robots`` (bool) keys; any other keys or missing/wrong-typed
    values are ignored, leaving that field ``None`` (gate default) rather
    than raising — a config typo must not break scraping (see design.md D7
    in openspec/changes/phase-7-hardening).

    Args:
        config: The source's ``config`` JSONB.

    Returns:
        Overrides built from whichever recognized keys are present and
        correctly typed.
    """
    min_delay = config.get("min_delay")
    jitter = config.get("jitter")
    respect_robots = config.get("respect_robots")
    return PolitenessOverrides(
        min_delay=float(min_delay) if isinstance(min_delay, int | float) else None,
        jitter=float(jitter) if isinstance(jitter, int | float) else None,
        respect_robots=respect_robots if isinstance(respect_robots, bool) else None,
    )


_REGISTRATIONS: dict[str, AdapterRegistration] = {
    DOU_SOURCE.slug: _static_registration(DOU_SOURCE),
    WORKUA_SOURCE.slug: _static_registration(WORKUA_SOURCE),
    JOBUA_SOURCE.slug: _static_registration(JOBUA_SOURCE),
    RedditAdapter.slug: AdapterRegistration(factory=RedditAdapter, content_probe=None),
    UpworkAdapter.slug: AdapterRegistration(factory=UpworkAdapter, content_probe=None),
}


class UnknownSourceError(LookupError):
    """Raised when no adapter is registered for a source slug."""


def known_slugs() -> frozenset[str]:
    """Return the slugs with a registered adapter.

    Returns:
        Immutable set of adapter slugs.
    """
    return frozenset(_REGISTRATIONS)


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
    registration = _REGISTRATIONS.get(slug)
    if registration is None:
        raise UnknownSourceError(f"no adapter registered for source '{slug}'")
    fetcher = fetchers(fetch_strategy, registration.content_probe)
    overrides = _politeness_overrides_from_config(config)
    return registration.factory(config, SourceBoundFetcher(fetcher, overrides))
