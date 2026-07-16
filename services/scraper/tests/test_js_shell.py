"""Tests for the JS-shell detection heuristic (pure function, fixtures only)."""

from __future__ import annotations

from conftest import load_fixture

from scraper.fetchers.js_shell import is_js_shell

_REAL_LISTING_HTML = (
    "<html><body><ul class='lt'>"
    "<li class='l-vacancy'><a class='vt' href='/vacancies/1/'>Senior Python Developer</a>"
    "<a class='company'>Acme Corp</a>"
    "<p>We are looking for an experienced backend engineer with strong Python, FastAPI and "
    "PostgreSQL skills to join our remote-first team building a job-search platform used by "
    "thousands of candidates every day.</p></li>"
    "</ul></body></html>"
)


def test_real_listing_page_is_not_a_shell() -> None:
    assert is_js_shell(_REAL_LISTING_HTML) is False


def test_react_shell_is_detected() -> None:
    html = load_fixture("shells/react-shell.html")

    assert is_js_shell(html) is True


def test_script_and_style_content_is_ignored() -> None:
    html = (
        "<html><body>"
        "<script>var jobs = 'Senior Python Developer at Acme Corp for a long time';</script>"
        "<style>.title { content: 'Senior Python Developer'; }</style>"
        "</body></html>"
    )

    assert is_js_shell(html) is True


def test_content_probe_overrides_short_page() -> None:
    html = (
        "<html><body><div class='content'>Senior Python Developer, remote, "
        "PostgreSQL.</div></body></html>"
    )

    # Below the default 200-char threshold, but the probe finds real content.
    assert is_js_shell(html, content_probe="div.content") is False


def test_content_probe_matching_empty_node_falls_through_to_threshold() -> None:
    html = "<html><body><div class='content'></div></body></html>"

    assert is_js_shell(html, content_probe="div.content") is True


def test_content_probe_not_found_falls_through_to_threshold() -> None:
    long_text = "Senior Python Developer. " * 20  # well over the default threshold
    html = f"<html><body><div class='other'>{long_text}</div></body></html>"

    assert is_js_shell(html, content_probe="div.content") is False


def test_custom_text_threshold() -> None:
    html = "<html><body>Short but present.</body></html>"

    assert is_js_shell(html, text_threshold=200) is True
    assert is_js_shell(html, text_threshold=10) is False
