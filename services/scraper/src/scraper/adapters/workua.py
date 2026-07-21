"""work.ua adapter — SSR HTML with clean structure (docs/SOURCES.md).

Listing: ``www.work.ua/jobs/?search=<term>``; parsers are fixture-tested to
catch the occasional layout change early.
"""

from __future__ import annotations

import re
from urllib.parse import urljoin

from bs4 import BeautifulSoup, Tag

from scraper.adapters._html import StaticSourceDefinition
from scraper.models import JobLead

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


WORKUA_SOURCE = StaticSourceDefinition(
    slug="workua",
    default_list_url=_DEFAULT_LIST_URL,
    search_parameter="search",
    content_selector=_CONTENT_SELECTOR,
    parse_list=parse_list,
)
