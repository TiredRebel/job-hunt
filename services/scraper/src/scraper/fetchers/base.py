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
class PolitenessOverrides:
    """Per-source overrides for the shared :class:`~scraper.fetchers.gate.PolitenessGate`.

    Every field defaults to ``None``, meaning "use the gate's own default for
    this value" — a source with no politeness keys in its ``config`` gets an
    all-``None`` instance, which is behaviorally identical to not overriding
    anything (see design.md D7 in openspec/changes/phase-7-hardening).

    Attributes:
        min_delay: Minimum seconds between two requests to this source's
            host, overriding the gate's default.
        jitter: Upper bound of the random extra delay, overriding the
            gate's default.
        respect_robots: Whether to consult robots.txt, overriding the
            gate's default.
    """

    min_delay: float | None = None
    jitter: float | None = None
    respect_robots: bool | None = None


@dataclass(frozen=True, slots=True)
class FetchResult:
    """Result of a page fetch, transport-agnostic.

    Attributes:
        text: Response body / rendered HTML.
        url: Final URL after redirects.
        rendered: Whether a browser produced this (crawl4ai/agent-browser),
            as opposed to a plain HTTP response.
        status_code: The transport's HTTP status code, when it has one.
            Plain HTTP always sets this; rendering transports (crawl4ai,
            agent-browser) leave it ``None`` — a rendered page has no single
            clean status to report.
    """

    text: str
    url: str
    rendered: bool = False
    status_code: int | None = None


@runtime_checkable
class PageFetcher(Protocol):
    """Port implemented by every page-fetching transport."""

    async def get(
        self,
        url: str,
        *,
        params: dict[str, str] | None = None,
        politeness: PolitenessOverrides | None = None,
    ) -> FetchResult:
        """Fetch ``url``, applying this transport's politeness and rendering.

        Args:
            url: Absolute URL to fetch.
            params: Optional query parameters merged into the URL.
            politeness: Optional per-source pacing/robots overrides for the
                shared politeness gate; ``None`` (the default) uses the
                gate's own defaults, matching pre-override behavior.

        Returns:
            The fetched (or rendered) page.

        Raises:
            FetchBlockedError: Robots.txt disallows the URL, or the host
                answered with an anti-bot status.
            FetchUnavailableError: The transport's backing tool could not
                complete this attempt.
        """
        ...


class SourceBoundFetcher:
    """Wraps a :class:`PageFetcher` with one source's fixed politeness overrides.

    Constructed fresh per source (cheap — holds no I/O resources of its own)
    so every strategy, including the plain-HTTP ``api`` strategy that
    otherwise reuses one process-wide fetcher instance, gets its source's
    ``core.sources.config`` politeness values applied without each concrete
    fetcher needing to be reconstructed per source (see design.md D7 in
    openspec/changes/phase-7-hardening).
    """

    def __init__(self, delegate: PageFetcher, overrides: PolitenessOverrides) -> None:
        """Bind ``overrides`` to every call made through this wrapper.

        Args:
            delegate: The underlying fetcher (shared/process-wide instance).
            overrides: This source's politeness overrides.
        """
        self._delegate = delegate
        self._overrides = overrides

    async def get(
        self,
        url: str,
        *,
        params: dict[str, str] | None = None,
        politeness: PolitenessOverrides | None = None,
    ) -> FetchResult:
        """Delegate to the wrapped fetcher with this source's overrides applied.

        Args:
            url: Absolute URL to fetch.
            params: Optional query parameters merged into the URL.
            politeness: Ignored — this wrapper's whole purpose is to supply
                the bound overrides regardless of what a caller passes.

        Returns:
            The delegate's result.
        """
        del politeness  # This wrapper's bound overrides are authoritative.
        return await self._delegate.get(url, params=params, politeness=self._overrides)
