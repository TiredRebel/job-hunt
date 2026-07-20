"""Shared mechanics and helpers for static-HTML source adapters.

Source-specific modules provide immutable definitions and listing parsers;
:class:`StaticHtmlAdapter` owns the lifecycle shared by those sources.
"""

from __future__ import annotations

from collections.abc import AsyncIterator, Callable, Mapping
from dataclasses import dataclass

from bs4 import BeautifulSoup

from scraper.dedup import content_fingerprint
from scraper.fetchers import FetchResult, PageFetcher
from scraper.models import JobLead, RawJobPosting, SearchQuery

type StaticListParser = Callable[[str], list[JobLead]]


@dataclass(frozen=True, slots=True)
class StaticSourceDefinition:
    """Immutable source-specific configuration for a static HTML adapter.

    Attributes:
        slug: Stable source identifier used by the source registry.
        default_list_url: Listing URL used when configuration has no override.
        search_parameter: Query-string key used for the search term.
        content_selector: CSS selector for the meaningful detail-page content.
        parse_list: Source-specific parser for recorded listing HTML.
    """

    slug: str
    default_list_url: str
    search_parameter: str
    content_selector: str
    parse_list: StaticListParser


class StaticHtmlAdapter:
    """Implement the shared discovery and detail lifecycle for static HTML.

    The adapter depends only on :class:`~scraper.fetchers.PageFetcher` and
    delegates listing markup to the parser in its source definition. Keeping
    the definition explicit preserves source-specific query parameters and
    selectors without duplicating transport and fingerprinting mechanics.
    """

    slug: str = ""

    def __init__(
        self,
        source: StaticSourceDefinition,
        config: Mapping[str, object],
        fetcher: PageFetcher,
    ) -> None:
        """Initialize a static HTML adapter.

        Args:
            source: Immutable source mechanics and listing parser.
            config: Source configuration; ``list_url`` may override the
                definition's default listing URL.
            fetcher: Page-fetching port selected for the source strategy.
        """
        self._source = source
        self._list_url = str(config.get("list_url") or source.default_list_url)
        self._fetcher = fetcher
        self.slug = source.slug

    async def discover(self, query: SearchQuery) -> AsyncIterator[JobLead]:
        """Yield parsed leads from one source-specific search request.

        Args:
            query: Search intent whose term is sent under the configured
                source query parameter.

        Yields:
            Vacancy leads parsed from the listing response.
        """
        result = await self._fetcher.get(
            self._list_url,
            params={self._source.search_parameter: query.term},
        )
        for lead in self._source.parse_list(result.text):
            yield lead

    async def fetch_detail(self, lead: JobLead) -> RawJobPosting | None:
        """Fetch, extract, and fingerprint one vacancy detail page.

        Args:
            lead: Lead previously yielded by :meth:`discover`.

        Returns:
            The extracted posting, or ``None`` when the shared helper returns
            no posting for a future source-specific implementation.
        """
        result = await self._fetcher.get(lead.url)
        return build_posting(lead, result.text, self._source.content_selector)

    async def probe(self) -> FetchResult:
        """Fetch the configured listing URL for a connectivity check.

        Returns:
            The transport result from the source's listing URL.
        """
        return await self._fetcher.get(self._list_url)


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

    ``raw_html`` stores the extracted description *text*, not the page's
    HTML, despite the column name — it flows straight into the LLM's
    normalize prompt with no cleaning step of its own, and a full rendered
    page (scripts, nav, cookie banners and all) overwhelms a small model
    into producing near-empty structured output. Extracting once here and
    reusing the same text for the fingerprint keeps both consumers in sync.

    Args:
        lead: Discovered lead the HTML belongs to.
        html: Detail page HTML.
        content_selector: CSS selector of the vacancy description block.

    Returns:
        Posting ready for persistence.
    """
    text = extract_text(html, content_selector)
    return RawJobPosting(
        lead=lead,
        raw_html=text,
        content_hash=content_fingerprint(text),
    )
