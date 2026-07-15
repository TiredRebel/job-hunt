"""Shared HTML helpers for static-HTML adapters."""

from __future__ import annotations

from bs4 import BeautifulSoup

from scraper.dedup import content_fingerprint
from scraper.models import JobLead, RawJobPosting


def extract_text(html: str, selector: str) -> str:
    """Extract normalized text from the first node matching ``selector``.

    Falls back to whole-page text when the selector matches nothing, so a
    layout change degrades to a coarser fingerprint instead of crashing.

    Args:
        html: Full page HTML.
        selector: CSS selector of the main content block.

    Returns:
        Space-normalized visible text.
    """
    soup = BeautifulSoup(html, "html.parser")
    node = soup.select_one(selector)
    target = node if node is not None else soup
    return target.get_text(" ", strip=True)


def build_posting(lead: JobLead, html: str, content_selector: str) -> RawJobPosting:
    """Assemble a :class:`RawJobPosting` with a content-based fingerprint.

    Args:
        lead: Discovered lead the HTML belongs to.
        html: Detail page HTML.
        content_selector: CSS selector of the vacancy description block.

    Returns:
        Posting ready for persistence.
    """
    return RawJobPosting(
        lead=lead,
        raw_html=html,
        content_hash=content_fingerprint(extract_text(html, content_selector)),
    )
