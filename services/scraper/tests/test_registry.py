"""Tests for explicit adapter registration and source-bound fetchers."""

from __future__ import annotations

import pytest

from scraper.fetchers import FetchResult, PageFetcher, PolitenessOverrides
from scraper.registry import FetcherFactory, UnknownSourceError, create_adapter, known_slugs


class RecordingFetcher:
    """Fake fetcher recording public adapter calls and politeness values."""

    def __init__(self) -> None:
        self.calls: list[tuple[str, dict[str, str] | None]] = []
        self.received: list[PolitenessOverrides | None] = []

    async def get(
        self,
        url: str,
        *,
        params: dict[str, str] | None = None,
        politeness: PolitenessOverrides | None = None,
    ) -> FetchResult:
        """Record one fetch and return an empty successful response."""
        self.calls.append((url, params))
        self.received.append(politeness)
        return FetchResult(text="", url=url, rendered=False)


def _single_fetcher_factory(
    fetcher: PageFetcher,
    probes: list[tuple[str, str | None]],
) -> FetcherFactory:
    """Build a typed factory that records strategy/probe wiring."""

    def factory(strategy: str, content_probe: str | None) -> PageFetcher:
        probes.append((strategy, content_probe))
        return fetcher

    return factory


def test_known_slugs_contains_every_registered_source() -> None:
    """The registry exposes exactly the five configured source adapters."""
    assert known_slugs() == frozenset({"dou", "workua", "jobua", "reddit", "upwork"})


@pytest.mark.parametrize(
    ("slug", "content_probe"),
    [
        ("dou", "div.b-typo.vacancy-section"),
        ("workua", "#job-description"),
        ("jobua", "div.vacancy-description"),
        ("reddit", None),
        ("upwork", None),
    ],
)
async def test_registry_passes_explicit_content_probe_for_each_source(
    slug: str,
    content_probe: str | None,
) -> None:
    """Each registration passes its exact probe metadata to the fetcher factory."""
    fetcher = RecordingFetcher()
    probes: list[tuple[str, str | None]] = []

    adapter = create_adapter(slug, {}, "api", _single_fetcher_factory(fetcher, probes))
    await adapter.probe()

    assert probes == [("api", content_probe)]


async def test_unknown_source_preserves_registry_error() -> None:
    """Unknown slugs fail before the fetcher factory is called."""
    probes: list[tuple[str, str | None]] = []

    with pytest.raises(
        UnknownSourceError,
        match="no adapter registered for source 'missing'",
    ):
        create_adapter("missing", {}, "api", _single_fetcher_factory(RecordingFetcher(), probes))

    assert probes == []


@pytest.mark.parametrize("slug", ["dou", "workua", "jobua", "reddit", "upwork"])
async def test_source_config_overrides_reach_fetcher_through_public_probe(slug: str) -> None:
    """Source politeness overrides apply without reaching into adapter internals."""
    fetcher = RecordingFetcher()
    probes: list[tuple[str, str | None]] = []
    config = {"min_delay": 5.0, "jitter": 2.0, "respect_robots": False}

    adapter = create_adapter(slug, config, "api", _single_fetcher_factory(fetcher, probes))
    await adapter.probe()

    assert fetcher.received == [
        PolitenessOverrides(min_delay=5.0, jitter=2.0, respect_robots=False)
    ]


async def test_wrong_typed_politeness_keys_are_ignored_not_raised() -> None:
    """Invalid source override values preserve gate defaults."""
    fetcher = RecordingFetcher()
    probes: list[tuple[str, str | None]] = []
    config = {"min_delay": "not-a-number", "respect_robots": "yes"}

    adapter = create_adapter("dou", config, "api", _single_fetcher_factory(fetcher, probes))
    await adapter.probe()

    assert fetcher.received == [PolitenessOverrides()]
