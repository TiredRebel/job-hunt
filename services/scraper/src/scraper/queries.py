"""Search-query construction from ``core.keyword_dictionaries`` rows.

Dictionaries with ``kind = 'search'`` hold JSON arrays of search phrases.
``applies_to`` scopes a dictionary to specific source slugs; an empty array
means "all sources". Queries are re-read on every run so dashboard edits
take effect without restarts.
"""

from __future__ import annotations

from typing import NotRequired, TypedDict

from scraper.models import SearchQuery


class SearchDictionaryRow(TypedDict):
    """Subset of a ``keyword_dictionaries`` row needed to build queries.

    Attributes:
        items: JSON array of search phrases.
        applies_to: Source slugs the dictionary is scoped to (empty = all).
    """

    items: list[str]
    applies_to: list[str]
    disabled_items: NotRequired[list[str]]


def build_search_queries(rows: list[SearchDictionaryRow], source_slug: str) -> list[SearchQuery]:
    """Build the de-duplicated query list for one source.

    Args:
        rows: Enabled ``kind='search'`` dictionary rows.
        source_slug: Slug of the source about to be scraped.

    Returns:
        Ordered, de-duplicated queries; empty when nothing applies.
    """
    seen: set[str] = set()
    queries: list[SearchQuery] = []
    for row in rows:
        if row["applies_to"] and source_slug not in row["applies_to"]:
            continue
        disabled = set(row.get("disabled_items", []))
        for raw_term in row["items"]:
            if raw_term in disabled:
                continue
            term = raw_term.strip()
            key = term.lower()
            if term and key not in seen:
                seen.add(key)
                queries.append(SearchQuery(term=term))
    return queries
