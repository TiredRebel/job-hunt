"""job.ua adapter (SSR HTML; work.ua overlap handled by fingerprint dedup, docs/SOURCES.md)."""

from __future__ import annotations

import re
from collections.abc import AsyncIterator
from typing import Any
from urllib.parse import urljoin

from bs4 import BeautifulSoup, Tag

from scraper.adapters._html import build_posting
from scraper.fetchers import FetchResult, PageFetcher
from scraper.models import JobLead, RawJobPosting, SearchQuery

_DEFAULT_LIST_URL = "https://www.job.ua/vacancy/"
_BASE_URL = "https://www.job.ua"
_VACANCY_ID = re.compile(r"/vacancy/(?:[\w-]+/)*?(\d+)")
_CONTENT_SELECTOR = "div.vacancy-description"


def parse_list(html: str) -> list[JobLead]:
    """Parse a job.ua search results page into leads.

    Args:
        html: Listing page HTML.

    Returns:
        Leads for every well-formed vacancy card; malformed cards are skipped.
    """
    soup = BeautifulSoup(html, "html.parser")
    leads: list[JobLead] = []
    for card in soup.select("div.vacancy-item"):
        link = card.select_one("a.vacancy-title")
        if not isinstance(link, Tag):
            continue
        href = str(link.get("href") or "")
        match = _VACANCY_ID.search(href)
        title = link.get_text(" ", strip=True)
        if match is None or not title:
            continue
        company_node = card.select_one("a.vacancy-company, span.vacancy-company")
        company = company_node.get_text(" ", strip=True) if company_node else None
        leads.append(
            JobLead(
                external_id=match.group(1),
                url=urljoin(_BASE_URL, href),
                title=title,
                company=company,
            )
        )
    return leads


class JobUaAdapter:
    """job.ua source adapter (crawl4ai-strategy static fetching)."""

    slug = "jobua"
    content_selector = _CONTENT_SELECTOR

    def __init__(self, config: dict[str, Any], fetcher: PageFetcher) -> None:
        """Initialize the adapter.

        Args:
            config: ``core.sources.config`` JSONB (supports ``list_url``).
            fetcher: Page fetcher selected for this source's strategy.
        """
        self._list_url = str(config.get("list_url") or _DEFAULT_LIST_URL)
        self._fetcher = fetcher

    async def discover(self, query: SearchQuery) -> AsyncIterator[JobLead]:
        """Yield leads from the search listing for ``query``.

        Args:
            query: Search intent.

        Yields:
            Parsed vacancy leads.
        """
        result = await self._fetcher.get(self._list_url, params={"q": query.term})
        for lead in parse_list(result.text):
            yield lead

    async def fetch_detail(self, lead: JobLead) -> RawJobPosting | None:
        """Fetch and fingerprint the vacancy detail page.

        Args:
            lead: Lead from :meth:`discover`.

        Returns:
            The raw posting.
        """
        result = await self._fetcher.get(lead.url)
        return build_posting(lead, result.text, _CONTENT_SELECTOR)

    async def probe(self) -> FetchResult:
        """Fetch the listing URL once, for connectivity testing."""
        return await self._fetcher.get(self._list_url)
