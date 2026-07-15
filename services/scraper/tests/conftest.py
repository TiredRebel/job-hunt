"""Shared test doubles and fixture helpers for the scraper test suite."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

FIXTURES = Path(__file__).parent / "fixtures"


def load_fixture(relative: str) -> str:
    """Read a recorded fixture file as text.

    Args:
        relative: Path relative to ``tests/fixtures``.

    Returns:
        Fixture content.
    """
    return (FIXTURES / relative).read_text(encoding="utf-8")


class FakeResponse:
    """Minimal stand-in for ``httpx.Response``."""

    def __init__(self, text: str) -> None:
        """Store the body."""
        self.text = text

    def json(self) -> Any:
        """Decode the body as JSON."""
        return json.loads(self.text)


class FakeClient:
    """Stand-in for :class:`scraper.fetch.PoliteClient` (no network)."""

    def __init__(self, text: str = "", error: Exception | None = None) -> None:
        """Configure the canned response or error."""
        self._text = text
        self._error = error
        self.calls: list[tuple[str, dict[str, str] | None]] = []

    async def get(self, url: str, *, params: dict[str, str] | None = None) -> FakeResponse:
        """Record the call and return the canned response (or raise)."""
        self.calls.append((url, params))
        if self._error is not None:
            raise self._error
        return FakeResponse(self._text)

    async def aclose(self) -> None:
        """No-op close."""
