"""Ports (interfaces) of the scraper service.

Adapters in :mod:`scraper.adapters` implement :class:`SourceAdapter`;
the runner in :mod:`scraper.runner` depends only on this protocol.
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from typing import Protocol, runtime_checkable

from scraper.fetchers.base import FetchResult
from scraper.models import JobLead, RawJobPosting, SearchQuery


@runtime_checkable
class SourceAdapter(Protocol):
    """Port implemented by every job-source integration.

    Attributes:
        slug: Source identifier matching ``core.sources.slug``.
    """

    slug: str

    def discover(self, query: SearchQuery) -> AsyncIterator[JobLead]:
        """Yield vacancy leads matching ``query`` from listing pages.

        Args:
            query: Search intent built from keyword dictionaries.

        Returns:
            Async iterator of discovered leads (may be empty).
        """
        ...

    async def fetch_detail(self, lead: JobLead) -> RawJobPosting | None:
        """Fetch the detail payload for a discovered lead.

        Args:
            lead: Lead previously yielded by :meth:`discover`.

        Returns:
            The raw posting, or ``None`` when the source declined the fetch
            (e.g. anti-bot challenge) and the lead should be counted as skipped.
        """
        ...

    async def probe(self) -> FetchResult:
        """Fetch this adapter's listing URL once, through its own fetcher.

        Used only by the connectivity-test endpoint (``POST
        /sources/{slug}/test``) — a single fetch through the exact same
        fetcher/politeness path :meth:`discover` would use, without
        persisting anything.

        Returns:
            The fetch result.

        Raises:
            FetchBlockedError: Robots.txt disallows the URL, or the host
                answered with an anti-bot status.
            FetchUnavailableError: The transport's backing tool could not
                complete this attempt.
        """
        ...
