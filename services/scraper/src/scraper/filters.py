"""Keyword-dictionary filter rules for scrape and processing.

``exclude`` and ``exclude_employer`` dictionaries are matched case-insensitively.
``include`` hard-filtering applies only to the ``must-have`` slug (see
``docs/DATA_MODEL.md``).
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal, TypedDict

from scraper.models import JobLead

FilterKind = Literal["exclude", "exclude_employer", "include"]


class FilterDictionaryRow(TypedDict):
    """Subset of a ``keyword_dictionaries`` row used for filtering.

    Attributes:
        slug: Dictionary slug (``must-have`` is the only hard ``include`` filter).
        kind: Filter dictionary kind.
        items: JSON array of filter phrases.
        applies_to: Source slugs the dictionary is scoped to (empty = all).
    """

    slug: str
    kind: FilterKind
    items: list[str]
    applies_to: list[str]


@dataclass(frozen=True, slots=True)
class FilterRules:
    """Compiled, case-normalized filter terms for one source."""

    exclude_terms: tuple[str, ...]
    excluded_employers: tuple[str, ...]
    must_have_terms: tuple[str, ...]


def _normalize_term(term: str) -> str:
    return term.strip().lower()


def _applies_to(row: FilterDictionaryRow, source_slug: str) -> bool:
    applies_to = row["applies_to"]
    return not applies_to or source_slug in applies_to


def _list_items(row: FilterDictionaryRow) -> list[str]:
    return [entry for entry in row["items"] if isinstance(entry, str)]


def build_filter_rules(rows: list[FilterDictionaryRow], source_slug: str) -> FilterRules:
    """Compile enabled filter dictionaries for one source.

    Args:
        rows: Enabled filter dictionary rows.
        source_slug: Slug of the source being scraped or processed.

    Returns:
        De-duplicated, lower-cased terms ready for matching.
    """
    exclude: list[str] = []
    employers: list[str] = []
    must_have: list[str] = []
    seen_exclude: set[str] = set()
    seen_employers: set[str] = set()
    seen_must_have: set[str] = set()

    for row in rows:
        if not _applies_to(row, source_slug):
            continue
        for raw_term in _list_items(row):
            term = _normalize_term(raw_term)
            if not term:
                continue
            if row["kind"] == "exclude" and term not in seen_exclude:
                seen_exclude.add(term)
                exclude.append(term)
            elif row["kind"] == "exclude_employer" and term not in seen_employers:
                seen_employers.add(term)
                employers.append(term)
            elif (
                row["kind"] == "include"
                and row["slug"] == "must-have"
                and term not in seen_must_have
            ):
                seen_must_have.add(term)
                must_have.append(term)

    return FilterRules(
        exclude_terms=tuple(exclude),
        excluded_employers=tuple(employers),
        must_have_terms=tuple(must_have),
    )


def text_contains_any(haystack: str | None, terms: tuple[str, ...]) -> bool:
    """Return whether any ``terms`` appear in ``haystack`` (case-insensitive).

    Args:
        haystack: Text to scan.
        terms: Lower-cased terms to look for.

    Returns:
        ``True`` when at least one term is a substring of ``haystack``.
    """
    if not haystack or not terms:
        return False
    lowered = haystack.lower()
    return any(term in lowered for term in terms)


def company_matches(company: str | None, employers: tuple[str, ...]) -> bool:
    """Return whether ``company`` matches any excluded employer (ignore case).

    Args:
        company: Employer name from a listing or normalized job.
        employers: Lower-cased employer tokens to reject.

    Returns:
        ``True`` when the company name contains any excluded employer token.
    """
    if not company or not employers:
        return False
    lowered = company.strip().lower()
    return any(employer in lowered for employer in employers)


def should_skip_lead(lead: JobLead, rules: FilterRules) -> bool:
    """Return whether a discovered lead should be skipped before detail fetch.

    Args:
        lead: Vacancy lead from a listing page.
        rules: Compiled filter rules for the source.

    Returns:
        ``True`` when the lead matches an excluded employer on the listing.
    """
    return company_matches(lead.company, rules.excluded_employers)


def should_hide_job(
    *,
    title: str,
    company: str | None,
    description: str,
    rules: FilterRules,
) -> bool:
    """Return whether a normalized job should be stored as ``hidden``.

    Args:
        title: Normalized vacancy title.
        company: Normalized employer name, if known.
        description: Normalized description markdown.
        rules: Compiled filter rules for the source.

    Returns:
        ``True`` when any hard filter rule matches.
    """
    if company_matches(company, rules.excluded_employers):
        return True
    haystack = f"{title}\n{company or ''}\n{description}"
    if text_contains_any(haystack, rules.exclude_terms):
        return True
    if rules.must_have_terms and not all(
        text_contains_any(haystack, (term,)) for term in rules.must_have_terms
    ):
        return True
    return False
