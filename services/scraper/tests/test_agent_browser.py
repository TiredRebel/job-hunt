"""Tests for :class:`AgentBrowserFetcher`.

Exercises real subprocesses (using this interpreter, ``sys.executable``, as
a portable stand-in "CLI") rather than faking ``_run`` — the actual
agent-browser CLI's exact contract is unverified (see design.md D6 in
openspec/changes/phase-2-crawl4ai-fetch-ladder), so these tests cover the
generic subprocess-handling contract: missing command, timeout, non-zero
exit, empty output, and both plausible output shapes (plain text and JSON
with a recognized content field).
"""

from __future__ import annotations

import sys

import pytest
from conftest import ALLOW_ALL_TRANSPORT

from scraper.fetchers import FetchUnavailableError, PolitenessGate
from scraper.fetchers.agent_browser import AgentBrowserFetcher


def _gate() -> PolitenessGate:
    return PolitenessGate(min_delay=0.0, jitter=0.0, transport=ALLOW_ALL_TRANSPORT)


def _fetcher(script: str, *, timeout_s: float = 5.0) -> AgentBrowserFetcher:
    """Build a fetcher whose "CLI" is this interpreter running ``script``."""
    command = f'"{sys.executable}" -c "{script}"'
    return AgentBrowserFetcher(_gate(), command=command, timeout_s=timeout_s)


async def test_missing_command_raises_unavailable() -> None:
    fetcher = AgentBrowserFetcher(_gate(), command="definitely-not-a-real-binary-xyz")

    with pytest.raises(FetchUnavailableError, match="not found"):
        await fetcher.get("https://www.upwork.com/search")


async def test_timeout_raises_unavailable() -> None:
    fetcher = _fetcher("import time; time.sleep(5)", timeout_s=0.2)

    with pytest.raises(FetchUnavailableError, match="timed out"):
        await fetcher.get("https://www.upwork.com/search")


async def test_nonzero_exit_raises_unavailable() -> None:
    fetcher = _fetcher(
        "import sys; sys.stderr.write('boom'); sys.exit(1)",
    )

    with pytest.raises(FetchUnavailableError, match="exited 1"):
        await fetcher.get("https://www.upwork.com/search")


async def test_empty_output_raises_unavailable() -> None:
    fetcher = _fetcher("pass")

    with pytest.raises(FetchUnavailableError, match="no output"):
        await fetcher.get("https://www.upwork.com/search")


async def test_plain_text_stdout_is_used_as_is() -> None:
    fetcher = _fetcher("print('rendered page text')")

    result = await fetcher.get("https://www.upwork.com/search")

    assert result.text == "rendered page text"
    assert result.rendered is True


async def test_json_output_with_html_field_is_extracted() -> None:
    fetcher = _fetcher(
        "import json; print(json.dumps({'html': '<html>rendered</html>'}))",
    )

    result = await fetcher.get("https://www.upwork.com/search")

    assert result.text == "<html>rendered</html>"


async def test_json_field_priority_prefers_html_over_others() -> None:
    fetcher = _fetcher(
        "import json; print(json.dumps({'content': 'c', 'html': 'h', 'text': 't'}))",
    )

    result = await fetcher.get("https://www.upwork.com/search")

    assert result.text == "h"


async def test_url_and_params_are_passed_as_the_final_argument() -> None:
    fetcher = _fetcher("import sys; print(sys.argv[-1])")

    result = await fetcher.get("https://www.upwork.com/search", params={"q": "python developer"})

    assert result.text.startswith("https://www.upwork.com/search?")
    assert "q=python" in result.text
