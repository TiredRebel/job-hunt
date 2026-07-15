"""work.ua adapter — SSR HTML with clean structure (docs/SOURCES.md).

Listing: ``www.work.ua/jobs/?search=<term>``; parsers are fixture-tested to
catch the occasional layout change early.
"""

from __future__ import annotations

import re
from collections.abc import AsyncIterator
from typing import Any
from urllib.parse import urljoin

from bs4 import BeautifulSoup, Tag

from scraper.adapters._html import build_posting
from scraper.fetch import PoliteClient
from scraper.models import JobLead, RawJobPosting, SearchQuery

_DEFAULT_LIST_URL = "https://www.work.ua/jobs/"
_BASE_URL = "https://www.work.ua"
_VACANCY_ID = re.compile(r"/jobs/(\d+)/")
_CONTENT_SELECTOR = "#job-description"


def parse_list(html: str) -> list[JobLead]:
    """Parse a work.ua search results page into leads.

    Args:
        html: Listing page HTML.

    Returns:
        Leads for every well-formed vacancy card; malformed cards are skipped.
    """
    soup = BeautifulSoup(html, "html.parser")
    leads: list[JobLead] = []
    for card in soup.select("div.job-link"):
        link = card.select_one("h2 a")
        if not isinstance(link, Tag):
            continue
        href = str(link.get("href") or "")
        match = _VACANCY_ID.search(href)
        title = link.get_text(" ", strip=True)
        if match is None or not title:
            continue
        company_node = card.select_one("span.strong-600")
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


class WorkUaAdapter:
    """work.ua source adapter (crawl4ai-strategy static fetching)."""

    slug = "workua"

    def __init__(self, config: dict[str, Any], client: PoliteClient) -> None:
        """Initialize the adapter.

        Args:
            config: ``core.sources.config`` JSONB (supports ``list_url``).
            client: Shared polite HTTP client.
        """
        self._list_url = str(config.get("list_url") or _DEFAULT_LIST_URL)
        self._client = client

    async def discover(self, query: SearchQuery) -> AsyncIterator[JobLead]:
        """Yield leads from the search listing for ``query``.

        Args:
            query: Search intent.

        Yields:
            Parsed vacancy leads.
        """
        response = await self._client.get(self._list_url, params={"search": query.term})
        for lead in parse_list(response.text):
            yield lead

    async def fetch_detail(self, lead: JobLead) -> RawJobPosting | None:
        """Fetch and fingerprint the vacancy detail page.

        Args:
            lead: Lead from :meth:`discover`.

        Returns:
            The raw posting.
        """
        response = await self._client.get(lead.url)
        return build_posting(lead, response.text, _CONTENT_SELECTOR)
