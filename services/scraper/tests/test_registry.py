"""Tests for per-source politeness override extraction and wrapping.

Covers ``registry.create_adapter``'s ``core.sources.config`` -> gate-override
plumbing (design.md D7 in openspec/changes/phase-7-hardening): the returned
adapter's fetcher is transparently wrapped so every call carries this
source's overrides, without the adapter itself knowing about politeness.
"""

from __future__ import annotations

from typing import Any, cast

from scraper.adapters.dou import DouAdapter
from scraper.fetchers import FetchResult, PageFetcher, PolitenessOverrides
from scraper.registry import create_adapter


class RecordingFetcher:
    """Fake fetcher recording the ``politeness`` value it receives per call."""

    def __init__(self) -> None:
        self.received: list[PolitenessOverrides | None] = []

    async def get(
        self,
        url: str,
        *,
        params: dict[str, str] | None = None,
        politeness: PolitenessOverrides | None = None,
    ) -> FetchResult:
        del params
        self.received.append(politeness)
        return FetchResult(text="", url=url, rendered=False)


def _single_fetcher_factory(fetcher: PageFetcher) -> Any:
    """Build a ``FetcherFactory`` that always returns ``fetcher``."""

    def factory(_strategy: str, _content_probe: str | None) -> PageFetcher:
        return fetcher

    return factory


async def test_source_config_overrides_reach_the_fetcher() -> None:
    fetcher = RecordingFetcher()
    config = {"min_delay": 5.0, "jitter": 2.0, "respect_robots": False}
    adapter = create_adapter("dou", config, "api", _single_fetcher_factory(fetcher))

    # SLF001: reaching into the adapter's fetcher to inspect the wrapping.
    await cast(DouAdapter, adapter)._fetcher.get("https://jobs.dou.ua/vacancies/1")  # noqa: SLF001

    expected = PolitenessOverrides(min_delay=5.0, jitter=2.0, respect_robots=False)
    assert fetcher.received == [expected]


async def test_source_with_no_politeness_keys_falls_back_to_gate_defaults() -> None:
    fetcher = RecordingFetcher()
    adapter = create_adapter("dou", {}, "api", _single_fetcher_factory(fetcher))

    await cast(DouAdapter, adapter)._fetcher.get("https://jobs.dou.ua/vacancies/1")  # noqa: SLF001

    assert fetcher.received == [PolitenessOverrides()]


async def test_wrong_typed_politeness_keys_are_ignored_not_raised() -> None:
    fetcher = RecordingFetcher()
    config = {"min_delay": "not-a-number", "respect_robots": "yes"}
    adapter = create_adapter("dou", config, "api", _single_fetcher_factory(fetcher))

    await cast(DouAdapter, adapter)._fetcher.get("https://jobs.dou.ua/vacancies/1")  # noqa: SLF001

    assert fetcher.received == [PolitenessOverrides()]
