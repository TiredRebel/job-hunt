"""Fetcher port, shared result type, and shared errors.

Every transport (plain HTTP, crawl4ai, agent-browser) implements
:class:`PageFetcher` and raises the same errors, so adapters and the runner
handle all three identically (see docs/SOURCES.md, ADR-006).
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol, runtime_checkable

DEFAULT_USER_AGENT = "job-hunter-scraper/0.1 (personal job-search tool; polite crawler)"

#: HTTP statuses treated as an anti-bot / rate-limit refusal, shared by every
#: transport that speaks HTTP status codes (plain HTTP and crawl4ai).
BLOCKED_STATUS_CODES = frozenset({401, 403, 407, 429, 503})


class FetchBlockedError(RuntimeError):
    """Raised when a host refuses the request (robots.txt or anti-bot status).

    Never caught to retry through a different transport — a host that
    answers this way has said no; escalating to a browser would be
    bot-detection evasion (ADR-006 policy).
    """


class FetchUnavailableError(RuntimeError):
    """Raised when a fetcher's backing tool is unavailable for this attempt.

    Covers a missing CLI/browser stack, a timeout, or empty output — cases
    where the *tool* failed, not the *host*. Callers treat this as a skipped
    lead, never a blocked one.
    """


class UnsupportedStrategyError(RuntimeError):
    """Raised when a source's ``fetch_strategy`` has no available fetcher.

    Covers both a genuinely unknown strategy value and a known strategy
    whose backing fetcher isn't installed (e.g. the optional crawl4ai
    dependency group). Raised once at adapter-creation time, never
    silently substituting a different transport.
    """


@dataclass(frozen=True, slots=True)
class FetchResult:
    """Result of a page fetch, transport-agnostic.

    Attributes:
        text: Response body / rendered HTML.
        url: Final URL after redirects.
        rendered: Whether a browser produced this (crawl4ai/agent-browser),
            as opposed to a plain HTTP response.
    """

    text: str
    url: str
    rendered: bool = False


@runtime_checkable
class PageFetcher(Protocol):
    """Port implemented by every page-fetching transport."""

    async def get(self, url: str, *, params: dict[str, str] | None = None) -> FetchResult:
        """Fetch ``url``, applying this transport's politeness and rendering.

        Args:
            url: Absolute URL to fetch.
            params: Optional query parameters merged into the URL.

        Returns:
            The fetched (or rendered) page.

        Raises:
            FetchBlockedError: Robots.txt disallows the URL, or the host
                answered with an anti-bot status.
            FetchUnavailableError: The transport's backing tool could not
                complete this attempt.
        """
        ...
