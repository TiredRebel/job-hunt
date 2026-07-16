"""Tests for :class:`Crawl4aiFetcher`.

The crawl4ai call itself is isolated behind ``_run()`` and faked here (no
real browser, no network, works whether or not the optional ``crawl4ai``
dependency is installed) — except for
:func:`test_missing_dependency_raises_actionable_error`, which deliberately
exercises the real (unfaked) import path against this dev environment,
where crawl4ai is not installed.
"""

from __future__ import annotations

import pytest
from conftest import ALLOW_ALL_TRANSPORT

from scraper.fetchers import FetchBlockedError, FetchResult, FetchUnavailableError, PolitenessGate
from scraper.fetchers.crawl4ai_fetcher import Crawl4aiFetcher


def _gate() -> PolitenessGate:
    return PolitenessGate(min_delay=0.0, jitter=0.0, transport=ALLOW_ALL_TRANSPORT)


async def test_get_returns_the_run_result() -> None:
    fetcher = Crawl4aiFetcher(_gate())
    calls: list[str] = []

    async def fake_run(url: str) -> FetchResult:
        calls.append(url)
        return FetchResult(text="<html>rendered</html>", url=url, rendered=True)

    fetcher._run = fake_run  # type: ignore[method-assign]

    result = await fetcher.get("https://jobs.example.com/list")

    assert result.text == "<html>rendered</html>"
    assert result.rendered is True
    assert calls == ["https://jobs.example.com/list"]


async def test_params_are_merged_into_the_url() -> None:
    fetcher = Crawl4aiFetcher(_gate())
    seen_urls: list[str] = []

    async def fake_run(url: str) -> FetchResult:
        seen_urls.append(url)
        return FetchResult(text="", url=url, rendered=True)

    fetcher._run = fake_run  # type: ignore[method-assign]

    await fetcher.get("https://jobs.example.com/list", params={"search": "python dev"})

    assert len(seen_urls) == 1
    assert seen_urls[0].startswith("https://jobs.example.com/list?")
    assert "search=python" in seen_urls[0]


async def test_blocked_error_propagates() -> None:
    fetcher = Crawl4aiFetcher(_gate())

    async def fake_run(url: str) -> FetchResult:
        raise FetchBlockedError("crawl4ai got HTTP 403")

    fetcher._run = fake_run  # type: ignore[method-assign]

    with pytest.raises(FetchBlockedError):
        await fetcher.get("https://jobs.example.com/list")


async def test_unavailable_error_propagates() -> None:
    fetcher = Crawl4aiFetcher(_gate())

    async def fake_run(url: str) -> FetchResult:
        raise FetchUnavailableError("render timed out")

    fetcher._run = fake_run  # type: ignore[method-assign]

    with pytest.raises(FetchUnavailableError):
        await fetcher.get("https://jobs.example.com/list")


async def test_aclose_without_start_is_a_noop() -> None:
    fetcher = Crawl4aiFetcher(_gate())

    await fetcher.aclose()  # must not raise


async def test_missing_dependency_raises_actionable_error() -> None:
    fetcher = Crawl4aiFetcher(_gate())

    with pytest.raises(FetchUnavailableError, match="uv sync --group browser"):
        await fetcher.get("https://jobs.example.com/list")


@pytest.mark.skip(reason="live smoke test — requires crawl4ai + playwright installed, real network")
async def test_live_render_smoke() -> None:
    """Manual smoke test: renders a real page through crawl4ai.

    Run locally after ``uv sync --group browser && uv run playwright install
    chromium`` with ``uv run pytest tests/test_crawl4ai_fetcher.py -m ""
    -k test_live_render_smoke --no-skip`` (or temporarily remove the skip
    mark) to verify the real integration end to end.
    """
    fetcher = Crawl4aiFetcher(_gate())
    try:
        result = await fetcher.get("https://jobs.dou.ua/vacancies/")
        assert "<html" in result.text.lower()
        assert result.rendered is True
    finally:
        await fetcher.aclose()
