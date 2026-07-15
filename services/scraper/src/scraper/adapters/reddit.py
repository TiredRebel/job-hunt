"""Reddit adapter — public JSON API, no scraping (docs/SOURCES.md).

Reads ``/r/<sub>/new.json`` per configured subreddit (cached per run within
the adapter instance) and filters posts by flair and search term. The
listing already contains the full selftext, so ``fetch_detail`` performs no
additional network requests.
"""

from __future__ import annotations

import json
from collections.abc import AsyncIterator
from datetime import UTC, datetime
from typing import Any

from scraper.dedup import content_fingerprint
from scraper.fetch import PoliteClient
from scraper.models import JobLead, RawJobPosting, SearchQuery

_DEFAULT_SUBREDDITS = ("forhire",)
_DEFAULT_FLAIRS = ("hiring",)
_LISTING_LIMIT = "100"


def parse_listing(payload: dict[str, Any]) -> list[dict[str, Any]]:
    """Extract post objects from a Reddit listing payload.

    Args:
        payload: Decoded ``new.json`` response body.

    Returns:
        The ``data`` mapping of each child post; malformed children are skipped.
    """
    data = payload.get("data")
    children = data.get("children", []) if isinstance(data, dict) else []
    posts: list[dict[str, Any]] = []
    for child in children:
        if isinstance(child, dict) and isinstance(child.get("data"), dict):
            posts.append(child["data"])
    return posts


def _matches(post: dict[str, Any], term: str, flairs: tuple[str, ...]) -> bool:
    """Check whether a post satisfies the flair and term filters.

    Args:
        post: Reddit post ``data`` mapping.
        term: Lowercased search term.
        flairs: Lowercased flair fragments; empty tuple disables the filter.

    Returns:
        ``True`` when the post should be surfaced as a lead.
    """
    title = str(post.get("title") or "")
    flair = str(post.get("link_flair_text") or "")
    haystack = f"{title}\n{post.get('selftext') or ''}".lower()
    flair_ok = not flairs or any(
        fragment in flair.lower() or f"[{fragment}]" in title.lower() for fragment in flairs
    )
    return flair_ok and term in haystack


class RedditAdapter:
    """Reddit source adapter (API-first strategy)."""

    slug = "reddit"

    def __init__(self, config: dict[str, Any], client: PoliteClient) -> None:
        """Initialize the adapter.

        Args:
            config: ``core.sources.config`` JSONB. Supports ``subreddits``
                (list of names) and ``flairs`` (required flair fragments).
            client: Shared polite HTTP client.
        """
        subreddits = config.get("subreddits") or list(_DEFAULT_SUBREDDITS)
        flairs = config.get("flairs")
        self._subreddits = tuple(str(name) for name in subreddits)
        self._flairs = tuple(
            str(flair).lower()
            for flair in (flairs if isinstance(flairs, list) else _DEFAULT_FLAIRS)
        )
        self._client = client
        self._listings: dict[str, list[dict[str, Any]]] = {}
        self._posts: dict[str, dict[str, Any]] = {}

    async def discover(self, query: SearchQuery) -> AsyncIterator[JobLead]:
        """Yield matching posts across the configured subreddits.

        Args:
            query: Search intent (matched against title + selftext).

        Yields:
            Leads for posts passing the flair/term filters.
        """
        term = query.term.lower()
        for subreddit in self._subreddits:
            for post in await self._listing(subreddit):
                if not _matches(post, term, self._flairs):
                    continue
                external_id = str(post.get("name") or "")
                permalink = str(post.get("permalink") or "")
                if not external_id or not permalink:
                    continue
                self._posts[external_id] = post
                created = post.get("created_utc")
                posted_at = (
                    datetime.fromtimestamp(float(created), tz=UTC)
                    if isinstance(created, (int, float))
                    else None
                )
                yield JobLead(
                    external_id=external_id,
                    url=f"https://www.reddit.com{permalink}",
                    title=str(post.get("title") or ""),
                    company=str(post.get("author")) if post.get("author") else None,
                    posted_at=posted_at,
                )

    async def fetch_detail(self, lead: JobLead) -> RawJobPosting | None:
        """Materialize a posting from the cached listing entry (no re-fetch).

        Args:
            lead: Lead from :meth:`discover`.

        Returns:
            The raw posting, or ``None`` if the cache entry vanished.
        """
        post = self._posts.get(lead.external_id)
        if post is None:
            return None
        text = f"{post.get('title') or ''}\n{post.get('selftext') or ''}"
        return RawJobPosting(
            lead=lead,
            raw_html=json.dumps(post, ensure_ascii=False, sort_keys=True),
            content_hash=content_fingerprint(text),
        )

    async def _listing(self, subreddit: str) -> list[dict[str, Any]]:
        """Fetch (or reuse) the ``new`` listing for one subreddit.

        Args:
            subreddit: Subreddit name without the ``r/`` prefix.

        Returns:
            Post ``data`` mappings.
        """
        if subreddit not in self._listings:
            response = await self._client.get(
                f"https://www.reddit.com/r/{subreddit}/new.json",
                params={"limit": _LISTING_LIMIT},
            )
            payload: dict[str, Any] = response.json()
            self._listings[subreddit] = parse_listing(payload)
        return self._listings[subreddit]
