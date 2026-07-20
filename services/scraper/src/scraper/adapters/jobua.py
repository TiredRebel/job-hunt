"""job.ua adapter (SSR HTML; work.ua overlap handled by fingerprint dedup, docs/SOURCES.md)."""

from __future__ import annotations

import re
from urllib.parse import urljoin

from bs4 import BeautifulSoup, Tag

from scraper.adapters._html import StaticSourceDefinition
from scraper.models import JobLead

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


JOBUA_SOURCE = StaticSourceDefinition(
    slug="jobua",
    default_list_url=_DEFAULT_LIST_URL,
    search_parameter="q",
    content_selector=_CONTENT_SELECTOR,
    parse_list=parse_list,
)
