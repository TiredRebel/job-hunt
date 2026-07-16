"""Tests for :class:`PolitenessGate` (robots.txt, delay+jitter, per-host
isolation) — no network, robots.txt is served via ``httpx.MockTransport``.
"""

from __future__ import annotations

import time

import httpx
import pytest

from scraper.fetchers import FetchBlockedError, PolitenessGate

_DISALLOW_ALL = "User-agent: *\nDisallow: /\n"
_ALLOW_ALL = "User-agent: *\nAllow: /\n"


def _robots_transport(bodies: dict[str, str]) -> httpx.MockTransport:
    """Build a mock transport serving a per-host robots.txt body.

    Args:
        bodies: Mapping of host to robots.txt text; a host with no entry
            answers 404 (default-allow, matching a real unreachable robots.txt).

    Returns:
        A transport usable as ``PolitenessGate(transport=...)``.
    """

    def handler(request: httpx.Request) -> httpx.Response:
        body = bodies.get(request.url.host)
        if body is None:
            return httpx.Response(404)
        return httpx.Response(200, text=body)

    return httpx.MockTransport(handler)


async def test_robots_deny_raises_blocked() -> None:
    gate = PolitenessGate(
        min_delay=0.0, jitter=0.0, transport=_robots_transport({"example.com": _DISALLOW_ALL})
    )

    with pytest.raises(FetchBlockedError):
        await gate.acquire("https://example.com/jobs")

    await gate.aclose()


async def test_robots_allow_does_not_raise() -> None:
    gate = PolitenessGate(
        min_delay=0.0, jitter=0.0, transport=_robots_transport({"example.com": _ALLOW_ALL})
    )

    await gate.acquire("https://example.com/jobs")  # must not raise

    await gate.aclose()


async def test_unreachable_robots_defaults_to_allow() -> None:
    gate = PolitenessGate(min_delay=0.0, jitter=0.0, transport=_robots_transport({}))

    await gate.acquire("https://example.com/jobs")  # 404 robots.txt → allow

    await gate.aclose()


async def test_respect_robots_false_skips_the_check() -> None:
    gate = PolitenessGate(
        min_delay=0.0,
        jitter=0.0,
        respect_robots=False,
        transport=_robots_transport({"example.com": _DISALLOW_ALL}),
    )

    await gate.acquire("https://example.com/jobs")  # disallowed, but not consulted

    await gate.aclose()


async def test_per_host_delay_is_enforced() -> None:
    gate = PolitenessGate(min_delay=0.15, jitter=0.0, transport=_robots_transport({}))

    start = time.monotonic()
    await gate.acquire("https://example.com/a")
    await gate.acquire("https://example.com/b")
    elapsed = time.monotonic() - start

    assert elapsed >= 0.15

    await gate.aclose()


async def test_different_hosts_do_not_wait_on_each_other() -> None:
    gate = PolitenessGate(min_delay=0.3, jitter=0.0, transport=_robots_transport({}))

    start = time.monotonic()
    await gate.acquire("https://a.example.com/x")
    await gate.acquire("https://b.example.com/x")
    elapsed = time.monotonic() - start

    # Two distinct hosts' first request each — neither should pay the other's delay.
    assert elapsed < 0.3

    await gate.aclose()
