"""dou.ua adapter — SSR HTML, the lowest-risk source (docs/SOURCES.md).

Listing: ``jobs.dou.ua/vacancies/?search=<term>``; detail pages are static.
"""

from __future__ import annotations

import re
from datetime import UTC, date, datetime

from bs4 import BeautifulSoup, Tag

from scraper.adapters._html import StaticSourceDefinition
from scraper.models import JobLead

_DEFAULT_LIST_URL = "https://jobs.dou.ua/vacancies/"
_VACANCY_ID = re.compile(r"/vacancies/(\d+)/")
_CONTENT_SELECTOR = "div.b-typo.vacancy-section"
_MONTHS = {
    "січня": 1,
    "лютого": 2,
    "березня": 3,
    "квітня": 4,
    "травня": 5,
    "червня": 6,
    "липня": 7,
    "серпня": 8,
    "вересня": 9,
    "жовтня": 10,
    "листопада": 11,
    "грудня": 12,
}
_POSTED_DATE = re.compile(r"^(?P<day>\d{1,2})\s+(?P<month>[а-яіїєґ]+)$", re.IGNORECASE)


def parse_posted_at(value: str, today: date | None = None) -> datetime | None:
    """Parse DOU's day-and-Ukrainian-month listing date into a UTC timestamp."""
    match = _POSTED_DATE.fullmatch(value.strip())
    if match is None:
        return None
    month = _MONTHS.get(match.group("month").lower())
    if month is None:
        return None
    reference = today or datetime.now(UTC).date()
    try:
        candidate = date(reference.year, month, int(match.group("day")))
    except ValueError:
        return None
    if candidate > reference:
        candidate = candidate.replace(year=candidate.year - 1)
    return datetime(candidate.year, candidate.month, candidate.day, tzinfo=UTC)


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
        date_node = card.select_one("div.date")
        posted_at = parse_posted_at(date_node.get_text(" ", strip=True)) if date_node else None
        leads.append(
            JobLead(
                external_id=match.group(1),
                url=href,
                title=title,
                company=company,
                posted_at=posted_at,
            )
        )
    return leads


DOU_SOURCE = StaticSourceDefinition(
    slug="dou",
    default_list_url=_DEFAULT_LIST_URL,
    search_parameter="search",
    content_selector=_CONTENT_SELECTOR,
    parse_list=parse_list,
)
