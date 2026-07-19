"""Shared test doubles and fixture helpers for the scraper test suite."""

from __future__ import annotations

from pathlib import Path

import httpx

from scraper.fetchers import FetchResult, PolitenessOverrides

FIXTURES = Path(__file__).parent / "fixtures"

#: Robots.txt transport that always answers 404 (default-allow) — for tests
#: that need a `PolitenessGate` but don't care about robots specifics.
ALLOW_ALL_TRANSPORT = httpx.MockTransport(lambda request: httpx.Response(404))


def load_fixture(relative: str) -> str:
    """Read a recorded fixture file as text.

    Args:
        relative: Path relative to ``tests/fixtures``.

    Returns:
        Fixture content.
    """
    return (FIXTURES / relative).read_text(encoding="utf-8")


class FakeFetcher:
    """Stand-in for :class:`scraper.fetchers.PageFetcher` (no network)."""

    def __init__(self, text: str = "", error: Exception | None = None) -> None:
        """Configure the canned response or error."""
        self._text = text
        self._error = error
        self.calls: list[tuple[str, dict[str, str] | None]] = []

    async def get(
        self,
        url: str,
        *,
        params: dict[str, str] | None = None,
        politeness: PolitenessOverrides | None = None,
    ) -> FetchResult:
        """Record the call and return the canned result (or raise)."""
        del politeness
        self.calls.append((url, params))
        if self._error is not None:
            raise self._error
        return FetchResult(text=self._text, url=url, rendered=False)

    async def aclose(self) -> None:
        """No-op close."""
