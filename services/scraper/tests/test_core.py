"""Tests for dedup fingerprinting and search-query building."""

from scraper.dedup import content_fingerprint
from scraper.models import SearchQuery
from scraper.queries import SearchDictionaryRow, build_search_queries


def test_fingerprint_ignores_whitespace_and_case() -> None:
    assert content_fingerprint("Senior  Python\n Dev") == content_fingerprint("senior python dev")


def test_fingerprint_differs_for_different_content() -> None:
    assert content_fingerprint("python dev") != content_fingerprint("rust dev")


def test_build_search_queries_dedup_and_scope() -> None:
    rows: list[SearchDictionaryRow] = [
        {"items": ["python", " FastAPI ", "python"], "applies_to": []},
        {"items": ["react"], "applies_to": ["workua"]},
        {"items": ["fastapi"], "applies_to": ["dou"]},
    ]

    queries = build_search_queries(rows, "dou")

    assert queries == [SearchQuery(term="python"), SearchQuery(term="FastAPI")]


def test_build_search_queries_empty_rows() -> None:
    assert build_search_queries([], "dou") == []


def test_build_search_queries_ignores_disabled_items() -> None:
    rows: list[SearchDictionaryRow] = [
        {"items": ["python", "react"], "disabled_items": ["react"], "applies_to": []}
    ]

    assert build_search_queries(rows, "dou") == [SearchQuery(term="python")]
