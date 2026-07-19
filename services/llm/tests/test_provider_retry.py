"""Tests for the provider-adapter retry policy (base.post_json/get_json/probe).

Covers design.md D6 in openspec/changes/phase-7-hardening: transient
failures (network errors, HTTP 429/5xx) are retried with bounded backoff;
non-transient failures (other 4xx) are not.
"""

from __future__ import annotations

from dataclasses import dataclass

import httpx
import pytest

from llm.providers import base


@dataclass(frozen=True, slots=True)
class _FakeSettings:
    provider_retry_attempts: int = 3


def _patch_settings(monkeypatch: pytest.MonkeyPatch, attempts: int = 3) -> None:
    monkeypatch.setattr(
        base, "get_settings", lambda: _FakeSettings(provider_retry_attempts=attempts)
    )
    # Backoff would otherwise really sleep between attempts; keep tests fast.
    monkeypatch.setattr(
        base.tenacity,
        "wait_exponential_jitter",
        lambda **_kwargs: base.tenacity.wait_none(),
    )


def _sequenced_transport(statuses: list[int]) -> httpx.MockTransport:
    """Serve ``statuses`` in order, one per request; repeats the last for extras."""
    calls = {"count": 0}

    def handler(request: httpx.Request) -> httpx.Response:
        index = min(calls["count"], len(statuses) - 1)
        calls["count"] += 1
        status = statuses[index]
        if status == 200:
            return httpx.Response(200, json={"ok": True})
        return httpx.Response(status, json={"error": "boom"})

    transport = httpx.MockTransport(handler)
    transport.calls = calls  # type: ignore[attr-defined]
    return transport


async def test_transient_failure_then_success_is_retried(monkeypatch: pytest.MonkeyPatch) -> None:
    _patch_settings(monkeypatch, attempts=5)
    transport = _sequenced_transport([503, 503, 200])
    client = httpx.AsyncClient(transport=transport, base_url="https://provider.example.com")

    body = await base.get_json(client, "https://provider.example.com/models")

    assert body == {"ok": True}
    assert transport.calls["count"] == 3  # type: ignore[attr-defined]

    await client.aclose()


async def test_non_transient_failure_is_not_retried(monkeypatch: pytest.MonkeyPatch) -> None:
    _patch_settings(monkeypatch, attempts=5)
    transport = _sequenced_transport([400, 200, 200])
    client = httpx.AsyncClient(transport=transport, base_url="https://provider.example.com")

    with pytest.raises(base.ProviderRequestError):
        await base.get_json(client, "https://provider.example.com/models")

    assert transport.calls["count"] == 1  # type: ignore[attr-defined]

    await client.aclose()


async def test_retries_are_bounded_by_configured_attempts(monkeypatch: pytest.MonkeyPatch) -> None:
    _patch_settings(monkeypatch, attempts=3)
    transport = _sequenced_transport([503, 503, 503, 503])
    client = httpx.AsyncClient(transport=transport, base_url="https://provider.example.com")

    with pytest.raises(base.ProviderRequestError):
        await base.get_json(client, "https://provider.example.com/models")

    assert transport.calls["count"] == 3  # type: ignore[attr-defined]

    await client.aclose()


async def test_probe_reports_failure_after_exhausting_retries(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _patch_settings(monkeypatch, attempts=2)
    transport = _sequenced_transport([503, 503])
    client = httpx.AsyncClient(transport=transport, base_url="https://provider.example.com")

    ok, detail = await base.probe(client, "https://provider.example.com/models")

    assert ok is False
    assert detail is not None
    assert transport.calls["count"] == 2  # type: ignore[attr-defined]

    await client.aclose()
