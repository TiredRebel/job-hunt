"""work.ua adapter — SSR HTML with clean structure (docs/SOURCES.md).

Listing: ``www.work.ua/jobs/?search=<term>``; parsers are fixture-tested to
catch the occasional layout change early.
"""

from __future__ import annotations

import re
from datetime import UTC, datetime
from urllib.parse import urljoin

from bs4 import BeautifulSoup, Tag

from scraper.adapters._dates import parse_ukrainian_calendar_date
from scraper.adapters._html import StaticSourceDefinition
from scraper.models import JobLead

_DEFAULT_LIST_URL = "https://www.work.ua/jobs/"
_BASE_URL = "https://www.work.ua"
_VACANCY_ID = re.compile(r"/jobs/(\d+)/")
_CONTENT_SELECTOR = "#job-description"
_VACANCY_DATE_PREFIX: re.Pattern[str] = re.compile(r"^вакансія\s+від\b", re.IGNORECASE)
_DATETIME_DATE: re.Pattern[str] = re.compile(
    r"^(?P<year>\d{4})-(?P<month>\d{2})-(?P<day>\d{2})(?:\D|$)"
)


def _parse_datetime_attribute(value: str) -> datetime | None:
    """Parse a Work.ua time element's leading ISO calendar date."""
    match = _DATETIME_DATE.match(value.strip())
    if match is None:
        return None
    try:
        return datetime(
            int(match.group("year")),
            int(match.group("month")),
            int(match.group("day")),
            tzinfo=UTC,
        )
    except ValueError:
        return None


def parse_detail_posted_at(html: str) -> datetime | None:
    """Parse Work.ua's authoritative publication date from vacancy HTML.

    Args:
        html: Complete vacancy detail HTML.

    Returns:
        The date from the matching ``time`` element's ``datetime`` attribute,
        falling back to its visible Ukrainian text, or ``None`` when absent.
    """
    soup = BeautifulSoup(html, "html.parser")
    time_nodes = soup.select("time")
    for time_node in time_nodes:
        visible = " ".join(time_node.get_text(" ", strip=True).replace("\u00a0", " ").split())
        if _VACANCY_DATE_PREFIX.match(visible) is None:
            continue
        attribute_date = _parse_datetime_attribute(str(time_node.get("datetime") or ""))
        return attribute_date or parse_ukrainian_calendar_date(visible)
    if len(time_nodes) == 1:
        return _parse_datetime_attribute(str(time_nodes[0].get("datetime") or ""))
    return None


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
    parse_detail_posted_at=parse_detail_posted_at,
)
