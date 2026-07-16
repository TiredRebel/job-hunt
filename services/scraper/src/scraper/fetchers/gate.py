"""Politeness gate shared by every fetcher transport.

Extracted from the original ``PoliteClient`` (Phase 2) so that a browser
render obeys exactly the same robots.txt decisions and per-domain pacing as
a plain HTTP request to the same host (docs/SOURCES.md politeness rules are
fetcher-agnostic; see design.md D2 in
openspec/changes/phase-2-crawl4ai-fetch-ladder).
"""

from __future__ import annotations

import asyncio
import random
import time
import urllib.robotparser
from urllib.parse import urlsplit, urlunsplit

import httpx

from scraper.fetchers.base import DEFAULT_USER_AGENT, FetchBlockedError


class PolitenessGate:
    """Per-host robots.txt cache and minimum-delay-with-jitter pacing.

    One instance is shared across all fetcher transports in a process, so
    the same per-host budget and robots decision applies whichever
    transport a given request goes through.
    """

    def __init__(
        self,
        *,
        user_agent: str = DEFAULT_USER_AGENT,
        min_delay: float = 2.0,
        jitter: float = 1.0,
        timeout: float = 30.0,
        respect_robots: bool = True,
        transport: httpx.AsyncBaseTransport | None = None,
    ) -> None:
        """Initialize the gate.

        Args:
            user_agent: Descriptive UA string used both for robots.txt
                evaluation and reported to fetchers that need to set headers.
            min_delay: Minimum seconds between two requests to one domain.
            jitter: Upper bound of the random extra delay in seconds.
            timeout: Timeout for robots.txt lookups.
            respect_robots: Whether to consult robots.txt before fetching.
            transport: Optional custom transport for the internal robots.txt
                client (tests inject ``httpx.MockTransport`` here; production
                leaves this ``None`` for the real network transport).
        """
        self._robots_client = httpx.AsyncClient(
            headers={"User-Agent": user_agent}, timeout=timeout, transport=transport
        )
        self.user_agent = user_agent
        self._min_delay = min_delay
        self._jitter = jitter
        self._respect_robots = respect_robots
        self._robots: dict[str, urllib.robotparser.RobotFileParser | None] = {}
        self._last_request: dict[str, float] = {}
        self._locks: dict[str, asyncio.Lock] = {}

    async def acquire(self, url: str) -> None:
        """Check robots.txt and pace the request for ``url``'s host.

        Args:
            url: Absolute URL the caller is about to fetch.

        Raises:
            FetchBlockedError: Robots.txt disallows ``url`` for our UA.
        """
        host = urlsplit(url).netloc
        lock = self._locks.setdefault(host, asyncio.Lock())
        async with lock:
            if self._respect_robots and not await self._allowed(url):
                raise FetchBlockedError(f"robots.txt disallows {url}")
            await self._pause(host)

    async def aclose(self) -> None:
        """Release the internal robots.txt HTTP client."""
        await self._robots_client.aclose()

    async def _pause(self, host: str) -> None:
        """Sleep until the per-domain delay (plus jitter) has elapsed."""
        now = time.monotonic()
        elapsed = now - self._last_request.get(host, float("-inf"))
        # Jitter is politeness, not cryptography — the stdlib PRNG is fine.
        wait = self._min_delay - elapsed + random.uniform(0.0, self._jitter)  # noqa: S311
        if wait > 0:
            await asyncio.sleep(wait)
        self._last_request[host] = time.monotonic()

    async def _allowed(self, url: str) -> bool:
        """Check robots.txt for ``url``, caching one parser per host."""
        parts = urlsplit(url)
        host = parts.netloc
        if host not in self._robots:
            robots_url = urlunsplit((parts.scheme, host, "/robots.txt", "", ""))
            parser: urllib.robotparser.RobotFileParser | None = None
            try:
                response = await self._robots_client.get(robots_url)
                if response.status_code == 200:
                    parser = urllib.robotparser.RobotFileParser()
                    parser.parse(response.text.splitlines())
            except httpx.HTTPError:
                parser = None  # Unreachable robots.txt → default allow.
            self._robots[host] = parser
        cached = self._robots[host]
        return cached is None or cached.can_fetch(self.user_agent, url)
