"""Polite HTTP fetching shared by all adapters.

Enforces the politeness rules from docs/SOURCES.md: descriptive User-Agent,
robots.txt respect, per-domain minimum delay with jitter. No CAPTCHA
bypassing or bot-detection evasion — anti-bot responses raise
:class:`FetchBlockedError` so adapters can degrade gracefully.
"""

from __future__ import annotations

import asyncio
import random
import time
import urllib.robotparser
from urllib.parse import urlsplit, urlunsplit

import httpx

DEFAULT_USER_AGENT = "job-hunter-scraper/0.1 (personal job-search tool; polite crawler)"
_BLOCKED_STATUS = frozenset({401, 403, 407, 429, 503})


class FetchBlockedError(RuntimeError):
    """Raised when a host refuses the request (robots.txt or anti-bot status)."""


class PoliteClient:
    """Async HTTP client with per-domain rate limiting and robots.txt checks.

    A single instance is shared by all adapters so that the per-domain delay
    is enforced across concurrent scrape runs within this process.
    """

    def __init__(
        self,
        *,
        user_agent: str = DEFAULT_USER_AGENT,
        min_delay: float = 2.0,
        jitter: float = 1.0,
        timeout: float = 30.0,
        respect_robots: bool = True,
    ) -> None:
        """Initialize the client.

        Args:
            user_agent: Descriptive UA string sent with every request.
            min_delay: Minimum seconds between two requests to one domain.
            jitter: Upper bound of the random extra delay in seconds.
            timeout: Total request timeout in seconds.
            respect_robots: Whether to consult robots.txt before fetching.
        """
        self._client = httpx.AsyncClient(
            headers={"User-Agent": user_agent},
            timeout=timeout,
            follow_redirects=True,
        )
        self._user_agent = user_agent
        self._min_delay = min_delay
        self._jitter = jitter
        self._respect_robots = respect_robots
        self._robots: dict[str, urllib.robotparser.RobotFileParser | None] = {}
        self._last_request: dict[str, float] = {}
        self._locks: dict[str, asyncio.Lock] = {}

    async def get(self, url: str, *, params: dict[str, str] | None = None) -> httpx.Response:
        """Fetch ``url`` politely.

        Args:
            url: Absolute URL to fetch.
            params: Optional query parameters merged into the URL.

        Returns:
            The successful HTTP response.

        Raises:
            FetchBlockedError: When robots.txt disallows the URL or the host
                answers with an anti-bot status code (401/403/407/429/503).
            httpx.HTTPStatusError: For other non-2xx responses.
        """
        host = urlsplit(url).netloc
        lock = self._locks.setdefault(host, asyncio.Lock())
        async with lock:
            if self._respect_robots and not await self._allowed(url):
                raise FetchBlockedError(f"robots.txt disallows {url}")
            await self._pause(host)
            response = await self._client.get(url, params=params)
        if response.status_code in _BLOCKED_STATUS:
            raise FetchBlockedError(f"{host} answered HTTP {response.status_code} for {url}")
        response.raise_for_status()
        return response

    async def aclose(self) -> None:
        """Release the underlying connection pool."""
        await self._client.aclose()

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
                response = await self._client.get(robots_url)
                if response.status_code == 200:
                    parser = urllib.robotparser.RobotFileParser()
                    parser.parse(response.text.splitlines())
            except httpx.HTTPError:
                parser = None  # Unreachable robots.txt → default allow.
            self._robots[host] = parser
        cached = self._robots[host]
        return cached is None or cached.can_fetch(self._user_agent, url)
