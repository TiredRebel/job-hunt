"""Plain HTTP fetcher — the fetch ladder's cheapest rung (docs/SOURCES.md).

This is the renamed transport core of Phase 2's ``PoliteClient``: the
politeness bookkeeping now lives in :class:`~scraper.fetchers.gate.PolitenessGate`
(shared with the browser fetchers); this class owns only the httpx
transport and anti-bot status mapping.
"""

from __future__ import annotations

import httpx

from scraper.fetchers.base import (
    BLOCKED_STATUS_CODES,
    FetchBlockedError,
    FetchResult,
    PolitenessOverrides,
)
from scraper.fetchers.gate import PolitenessGate


class HttpxFetcher:
    """Async HTTP fetcher gated by a shared :class:`PolitenessGate`."""

    def __init__(self, gate: PolitenessGate, *, timeout: float = 30.0) -> None:
        """Initialize the fetcher.

        Args:
            gate: Shared politeness gate (robots + per-host pacing).
            timeout: Total request timeout in seconds.
        """
        self._gate = gate
        self._client = httpx.AsyncClient(
            headers={"User-Agent": gate.user_agent},
            timeout=timeout,
            follow_redirects=True,
        )

    async def get(
        self,
        url: str,
        *,
        params: dict[str, str] | None = None,
        politeness: PolitenessOverrides | None = None,
    ) -> FetchResult:
        """Fetch ``url`` politely over plain HTTP.

        Args:
            url: Absolute URL to fetch.
            params: Optional query parameters merged into the URL.
            politeness: Optional per-source pacing/robots overrides.

        Returns:
            The successful response as a transport-agnostic result.

        Raises:
            FetchBlockedError: Robots.txt disallows the URL or the host
                answered with an anti-bot status.
            httpx.HTTPStatusError: For other non-2xx responses.
        """
        await self._gate.acquire(url, overrides=politeness)
        response = await self._client.get(url, params=params)
        if response.status_code in BLOCKED_STATUS_CODES:
            host = httpx.URL(url).host
            raise FetchBlockedError(f"{host} answered HTTP {response.status_code} for {url}")
        response.raise_for_status()
        return FetchResult(
            text=response.text,
            url=str(response.url),
            rendered=False,
            status_code=response.status_code,
        )

    async def aclose(self) -> None:
        """Release the underlying connection pool."""
        await self._client.aclose()
