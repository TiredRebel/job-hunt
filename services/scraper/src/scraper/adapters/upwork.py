"""Upwork adapter — best-effort RSS, graceful degradation (docs/SOURCES.md).

Upwork sits behind aggressive anti-bot protection and most value requires
login; per project policy we never bypass bot detection. This adapter tries
the legacy public RSS search feed and, when blocked or served a challenge
page, reports no leads for the rest of the run instead of poisoning stats.
The manual alternative (saved-search email alerts via n8n IMAP) is
documented in docs/SOURCES.md.
"""

from __future__ import annotations

import email.utils
import logging
from collections.abc import AsyncIterator
from datetime import datetime
from typing import Any, TypedDict

from defusedxml import ElementTree

from scraper.dedup import content_fingerprint
from scraper.fetch import FetchBlockedError, PoliteClient
from scraper.models import JobLead, RawJobPosting, SearchQuery

logger = logging.getLogger(__name__)

_DEFAULT_FEED_URL = "https://www.upwork.com/ab/feed/jobs/rss"


class RssItem(TypedDict):
    """Relevant fields of one RSS ``<item>``."""

    guid: str
    link: str
    title: str
    description: str
    pub_date: datetime | None


def parse_feed(text: str) -> list[RssItem]:
    """Parse an RSS 2.0 feed into items.

    Args:
        text: Raw XML feed body.

    Returns:
        Well-formed items; the empty list when the body is not valid XML
        (e.g. an HTML challenge page was served instead of the feed).
    """
    try:
        root = ElementTree.fromstring(text)
    except ElementTree.ParseError:
        return []
    items: list[RssItem] = []
    for node in root.iter("item"):
        link = (node.findtext("link") or "").strip()
        title = (node.findtext("title") or "").strip()
        if not link or not title:
            continue
        pub_date_text = node.findtext("pubDate")
        pub_date: datetime | None = None
        if pub_date_text:
            try:
                pub_date = email.utils.parsedate_to_datetime(pub_date_text)
            except (TypeError, ValueError):
                pub_date = None
        items.append(
            RssItem(
                guid=(node.findtext("guid") or link).strip(),
                link=link,
                title=title,
                description=(node.findtext("description") or "").strip(),
                pub_date=pub_date,
            )
        )
    return items


class UpworkAdapter:
    """Upwork source adapter (best-effort RSS with graceful degradation)."""

    slug = "upwork"

    def __init__(self, config: dict[str, Any], client: PoliteClient) -> None:
        """Initialize the adapter.

        Args:
            config: ``core.sources.config`` JSONB (supports ``rss_url``).
            client: Shared polite HTTP client.
        """
        self._feed_url = str(config.get("rss_url") or _DEFAULT_FEED_URL)
        self._client = client
        self._blocked = False
        self._items: dict[str, RssItem] = {}

    async def discover(self, query: SearchQuery) -> AsyncIterator[JobLead]:
        """Yield leads from the RSS search feed, or nothing when blocked.

        Args:
            query: Search intent.

        Yields:
            Leads parsed from the feed.
        """
        if self._blocked:
            return
        try:
            response = await self._client.get(
                self._feed_url, params={"q": query.term, "sort": "recency"}
            )
        except FetchBlockedError as exc:
            self._blocked = True
            logger.warning("upwork feed blocked, degrading to no-op: %s", exc)
            return
        items = parse_feed(response.text)
        if not items and "<rss" not in response.text[:2000].lower():
            self._blocked = True
            logger.warning("upwork served a non-RSS payload (challenge page?); degrading")
            return
        for item in items:
            self._items[item["guid"]] = item
            yield JobLead(
                external_id=item["guid"],
                url=item["link"],
                title=item["title"],
                posted_at=item["pub_date"],
            )

    async def fetch_detail(self, lead: JobLead) -> RawJobPosting | None:
        """Materialize a posting from the cached feed item (no page fetch).

        Args:
            lead: Lead from :meth:`discover`.

        Returns:
            The raw posting, or ``None`` if the cache entry vanished.
        """
        item = self._items.get(lead.external_id)
        if item is None:
            return None
        return RawJobPosting(
            lead=lead,
            raw_html=item["description"],
            content_hash=content_fingerprint(f"{item['title']}\n{item['description']}"),
        )
