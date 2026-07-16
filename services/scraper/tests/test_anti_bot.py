"""Tests for anti-bot interstitial detection."""

from __future__ import annotations

from scraper.fetchers.anti_bot import looks_like_anti_bot_challenge


def test_cloudflare_just_a_moment_is_detected() -> None:
    # Same marker upwork.py's own challenge check already looks for.
    assert looks_like_anti_bot_challenge("<html><body>Just a moment...</body></html>") is True


def test_cloudflare_browser_verification_marker_is_detected() -> None:
    html = "<html><body><div id='cf-browser-verification'>Checking...</div></body></html>"

    assert looks_like_anti_bot_challenge(html) is True


def test_generic_enable_js_message_is_detected() -> None:
    html = "<html><body>Please enable JavaScript and cookies to continue</body></html>"

    assert looks_like_anti_bot_challenge(html) is True


def test_ordinary_shell_is_not_a_challenge() -> None:
    html = "<html><body><div id='root'></div><script>var x = 1;</script></body></html>"

    assert looks_like_anti_bot_challenge(html) is False


def test_ordinary_content_is_not_a_challenge() -> None:
    html = "<html><body><p>Senior Python Developer, remote, PostgreSQL.</p></body></html>"

    assert looks_like_anti_bot_challenge(html) is False


def test_detection_is_case_insensitive() -> None:
    assert looks_like_anti_bot_challenge("<html><body>JUST A MOMENT...</body></html>") is True
