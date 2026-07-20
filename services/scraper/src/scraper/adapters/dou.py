"""dou.ua adapter — SSR HTML, the lowest-risk source (docs/SOURCES.md).

Listing: ``jobs.dou.ua/vacancies/?search=<term>``; detail pages are static.
"""

from __future__ import annotations

import re

from bs4 import BeautifulSoup, Tag

from scraper.adapters._html import StaticSourceDefinition
from scraper.models import JobLead

_DEFAULT_LIST_URL = "https://jobs.dou.ua/vacancies/"
_VACANCY_ID = re.compile(r"/vacancies/(\d+)/")
_CONTENT_SELECTOR = "div.b-typo.vacancy-section"


def parse_list(html: str) -> list[JobLead]:
    """Parse a dou.ua listing page into leads.

    Args:
        html: Listing page HTML.

    Returns:
        Leads for every well-formed vacancy card; malformed cards are skipped.
    """
    soup = BeautifulSoup(html, "html.parser")
    leads: list[JobLead] = []
    for card in soup.select("li.l-vacancy"):
        link = card.select_one("a.vt")
        if not isinstance(link, Tag):
            continue
        href = str(link.get("href") or "")
        match = _VACANCY_ID.search(href)
        title = link.get_text(" ", strip=True)
        if match is None or not title:
            continue
        company_node = card.select_one("a.company")
        company = company_node.get_text(" ", strip=True) if company_node else None
        leads.append(JobLead(external_id=match.group(1), url=href, title=title, company=company))
    return leads


DOU_SOURCE = StaticSourceDefinition(
    slug="dou",
    default_list_url=_DEFAULT_LIST_URL,
    search_parameter="search",
    content_selector=_CONTENT_SELECTOR,
    parse_list=parse_list,
)
