"""Tests for :class:`EscalatingFetcher` (fake primary/secondary, no network)."""

from __future__ import annotations

import pytest

from scraper.fetchers import (
    EscalatingFetcher,
    FetchBlockedError,
    FetchResult,
    FetchUnavailableError,
    PolitenessOverrides,
)

_SHELL_HTML = "<html><body><div id='root'></div><script>var x = 1;</script></body></html>"
_REAL_HTML = (
    "<html><body><p>Senior Python Developer wanted at Acme Corp. We are looking for an "
    "experienced backend engineer with strong Python, FastAPI and PostgreSQL skills to join "
    "our remote-first team building a job-search platform used by thousands of candidates "
    "across Ukraine and the wider region every single day.</p></body></html>"
)


class ScriptedFetcher:
    """Stand-in fetcher returning a canned result or raising a canned error."""

    def __init__(self, text: str = "", error: Exception | None = None) -> None:
        self._text = text
        self._error = error
        self.calls: list[str] = []

    async def get(
        self,
        url: str,
        *,
        params: dict[str, str] | None = None,
        politeness: PolitenessOverrides | None = None,
    ) -> FetchResult:
        del politeness
        self.calls.append(url)
        if self._error is not None:
            raise self._error
        return FetchResult(text=self._text, url=url, rendered=False)


async def test_static_page_needs_no_escalation() -> None:
    primary = ScriptedFetcher(text=_REAL_HTML)
    secondary = ScriptedFetcher(text="should never be used")
    fetcher = EscalatingFetcher(primary, secondary)

    result = await fetcher.get("https://jobs.example.com/list")

    assert result.text == _REAL_HTML
    assert result.rendered is False
    assert len(secondary.calls) == 0


async def test_js_shell_escalates_to_secondary() -> None:
    primary = ScriptedFetcher(text=_SHELL_HTML)
    secondary = ScriptedFetcher(text=_REAL_HTML)
    fetcher = EscalatingFetcher(primary, secondary)

    result = await fetcher.get("https://jobs.example.com/list")

    assert result.text == _REAL_HTML
    assert len(primary.calls) == 1
    assert len(secondary.calls) == 1


async def test_escalation_is_memoized_per_host() -> None:
    primary = ScriptedFetcher(text=_SHELL_HTML)
    secondary = ScriptedFetcher(text=_REAL_HTML)
    fetcher = EscalatingFetcher(primary, secondary)

    await fetcher.get("https://jobs.example.com/list")
    await fetcher.get("https://jobs.example.com/detail/1")

    # Second fetch to the same (already-escalated) host skips the primary entirely.
    assert len(primary.calls) == 1
    assert len(secondary.calls) == 2


async def test_different_hosts_escalate_independently() -> None:
    primary = ScriptedFetcher(text=_REAL_HTML)
    secondary = ScriptedFetcher(text=_REAL_HTML)
    fetcher = EscalatingFetcher(primary, secondary)

    await fetcher.get("https://a.example.com/list")
    await fetcher.get("https://b.example.com/list")

    assert len(primary.calls) == 2  # neither host escalated, both tried primary
    assert len(secondary.calls) == 0


async def test_blocked_response_propagates_without_escalation() -> None:
    primary = ScriptedFetcher(error=FetchBlockedError("HTTP 403"))
    secondary = ScriptedFetcher(text=_REAL_HTML)
    fetcher = EscalatingFetcher(primary, secondary)

    with pytest.raises(FetchBlockedError):
        await fetcher.get("https://jobs.example.com/list")

    assert len(secondary.calls) == 0


async def test_anti_bot_challenge_page_is_blocked_not_escalated() -> None:
    # A Cloudflare-style interstitial looks exactly like a JS shell to the
    # plain heuristic — rendering through it would be bot-detection evasion
    # (policy line), so it must raise FetchBlockedError, never escalate.
    primary = ScriptedFetcher(text="<html><body>Just a moment...</body></html>")
    secondary = ScriptedFetcher(text=_REAL_HTML)
    fetcher = EscalatingFetcher(primary, secondary)

    with pytest.raises(FetchBlockedError):
        await fetcher.get("https://www.upwork.com/search")

    assert len(secondary.calls) == 0


async def test_secondary_unavailable_propagates() -> None:
    primary = ScriptedFetcher(text=_SHELL_HTML)
    secondary = ScriptedFetcher(error=FetchUnavailableError("agent-browser CLI not found"))
    fetcher = EscalatingFetcher(primary, secondary)

    with pytest.raises(FetchUnavailableError):
        await fetcher.get("https://jobs.example.com/list")
