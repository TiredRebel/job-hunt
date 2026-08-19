"""Tests for keyword-dictionary filter rules."""

from scraper.filters import (
    FilterDictionaryRow,
    build_filter_rules,
    company_matches,
    should_hide_job,
    should_skip_lead,
    text_contains_any,
)
from scraper.models import JobLead


def _lead(company: str | None) -> JobLead:
    return JobLead(external_id="1", url="https://x/1", title="Developer", company=company)


def test_exclude_terms_are_case_insensitive() -> None:
    rows: list[FilterDictionaryRow] = [
        {
            "slug": "stop-words",
            "kind": "exclude",
            "items": ["WordPress"],
            "applies_to": [],
        }
    ]
    rules = build_filter_rules(rows, "dou")

    assert should_hide_job(
        title="Developer",
        company="Acme",
        description="Uses wordpress daily",
        rules=rules,
    )


def test_excluded_employers_are_case_insensitive() -> None:
    rows: list[FilterDictionaryRow] = [
        {
            "slug": "excluded-employers",
            "kind": "exclude_employer",
            "items": ["playtech"],
            "applies_to": [],
        }
    ]
    rules = build_filter_rules(rows, "dou")

    assert company_matches("Playtech", rules.excluded_employers)
    assert should_skip_lead(_lead("Playtech"), rules)
    assert should_hide_job(
        title="Fullstack Developer",
        company="Playtech",
        description="",
        rules=rules,
    )


def test_filter_rules_respect_applies_to() -> None:
    rows: list[FilterDictionaryRow] = [
        {
            "slug": "excluded-employers",
            "kind": "exclude_employer",
            "items": ["Playtech"],
            "applies_to": ["workua"],
        }
    ]
    rules = build_filter_rules(rows, "dou")

    assert not should_skip_lead(_lead("Playtech"), rules)


def test_must_have_only_compiles_from_must_have_slug() -> None:
    rows: list[FilterDictionaryRow] = [
        {
            "slug": "nice-to-have",
            "kind": "include",
            "items": ["remote"],
            "applies_to": [],
        },
        {
            "slug": "must-have",
            "kind": "include",
            "items": ["python"],
            "applies_to": [],
        },
    ]
    rules = build_filter_rules(rows, "dou")

    assert rules.must_have_terms == ("python",)
    assert should_hide_job(
        title="JS role",
        company="Acme",
        description="frontend only",
        rules=rules,
    )


def test_text_contains_any_handles_empty_haystack() -> None:
    assert not text_contains_any(None, ("python",))
