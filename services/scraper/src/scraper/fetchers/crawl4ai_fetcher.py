"""crawl4ai-backed rendering fetcher for JS-shell escalation.

crawl4ai is an optional dependency (see pyproject's ``browser`` group); the
import happens lazily inside this module so the rest of the service runs
without it installed. Returns rendered **raw HTML**, not markdown, so
existing BeautifulSoup parsers and content fingerprints behave identically
to the plain-HTTP path (docs/SOURCES.md, ADR-006; design.md D5 in
openspec/changes/phase-2-crawl4ai-fetch-ladder).
"""

from __future__ import annotations

import asyncio
from typing import TYPE_CHECKING, Any

import httpx

from scraper.fetchers.base import (
    BLOCKED_STATUS_CODES,
    FetchBlockedError,
    FetchResult,
    FetchUnavailableError,
)
from scraper.fetchers.gate import PolitenessGate

if TYPE_CHECKING:
    from crawl4ai import AsyncWebCrawler


class Crawl4aiFetcher:
    """Browser-rendered fetcher via crawl4ai's ``AsyncWebCrawler``.

    The browser is started lazily on first use and must be closed via
    :meth:`aclose` when the service shuts down. One instance is meant to be
    shared across an entire run (or the process lifetime), reusing the same
    browser for every render.
    """

    def __init__(self, gate: PolitenessGate, *, page_timeout_s: float = 30.0) -> None:
        """Initialize the fetcher.

        Args:
            gate: Shared politeness gate (robots + per-host pacing).
            page_timeout_s: Maximum seconds to wait for a page render.
        """
        self._gate = gate
        self._page_timeout_ms = int(page_timeout_s * 1000)
        self._crawler: AsyncWebCrawler | None = None
        self._start_lock = asyncio.Lock()

    async def get(self, url: str, *, params: dict[str, str] | None = None) -> FetchResult:
        """Render ``url`` politely through crawl4ai.

        Args:
            url: Absolute URL to fetch.
            params: Optional query parameters merged into the URL.

        Returns:
            The rendered page as a transport-agnostic result.

        Raises:
            FetchBlockedError: Robots.txt disallows the URL, or the render
                reported an anti-bot HTTP status.
            FetchUnavailableError: The render timed out or otherwise failed
                to complete.
        """
        full_url = str(httpx.URL(url, params=params)) if params else url
        await self._gate.acquire(full_url)
        return await self._run(full_url)

    async def aclose(self) -> None:
        """Close the underlying browser, if one was started."""
        if self._crawler is not None:
            await self._crawler.close()
            self._crawler = None

    async def _ensure_started(self) -> AsyncWebCrawler:
        """Lazily start (once) and return the underlying crawler.

        Raises:
            FetchUnavailableError: crawl4ai isn't installed — names the
                install command rather than surfacing a bare import error.
        """
        if self._crawler is None:
            async with self._start_lock:
                if self._crawler is None:
                    try:
                        from crawl4ai import AsyncWebCrawler, BrowserConfig
                    except ImportError as exc:
                        raise FetchUnavailableError(
                            "crawl4ai is not installed — install with "
                            "'uv sync --group browser' then "
                            "'uv run playwright install chromium'"
                        ) from exc

                    crawler = AsyncWebCrawler(
                        config=BrowserConfig(headless=True, user_agent=self._gate.user_agent)
                    )
                    await crawler.start()
                    self._crawler = crawler
        return self._crawler

    async def _run(self, url: str) -> FetchResult:
        """Render ``url`` and map the result/failure to fetcher semantics.

        Isolated as its own coroutine so tests can fake it without a real
        browser or the optional crawl4ai dependency installed.
        """
        crawler = await self._ensure_started()  # raises the actionable error first
        from crawl4ai import CacheMode, CrawlerRunConfig

        run_config = CrawlerRunConfig(
            cache_mode=CacheMode.BYPASS,
            wait_until="domcontentloaded",
            page_timeout=self._page_timeout_ms,
        )
        try:
            result: Any = await crawler.arun(url=url, config=run_config)
        except Exception as exc:  # noqa: BLE001 — tool failure, not host refusal
            raise FetchUnavailableError(f"crawl4ai failed to render {url}: {exc}") from exc

        if not result.success:
            status = getattr(result, "status_code", None)
            if status in BLOCKED_STATUS_CODES:
                raise FetchBlockedError(f"crawl4ai got HTTP {status} rendering {url}")
            raise FetchUnavailableError(f"crawl4ai failed to render {url}: {result.error_message}")
        return FetchResult(text=result.html, url=url, rendered=True)
