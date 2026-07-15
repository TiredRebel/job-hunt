"""Tests for hot-switch provider resolution (cache, invalidation, overrides)."""

import pytest
from conftest import FakeProvider, make_row

from llm.db import ProviderRow
from llm.errors import ModelResolutionError, NoActiveProviderError
from llm.ports import LLMProvider
from llm.resolver import ProviderResolver


class CountingFetcher:
    def __init__(self, row: ProviderRow | None) -> None:
        self.row = row
        self.calls = 0

    async def __call__(self) -> ProviderRow | None:
        self.calls += 1
        return self.row


def build(_row: ProviderRow) -> LLMProvider:
    return FakeProvider()


async def test_caches_within_ttl() -> None:
    fetcher = CountingFetcher(make_row())
    resolver = ProviderResolver(fetcher, build, ttl_s=30.0)

    await resolver.resolve("normalize")
    await resolver.resolve("tag")

    assert fetcher.calls == 1


async def test_ttl_zero_refetches() -> None:
    fetcher = CountingFetcher(make_row())
    resolver = ProviderResolver(fetcher, build, ttl_s=0.0)

    await resolver.resolve("normalize")
    await resolver.resolve("normalize")

    assert fetcher.calls == 2


async def test_invalidate_drops_cache() -> None:
    fetcher = CountingFetcher(make_row())
    resolver = ProviderResolver(fetcher, build, ttl_s=30.0)

    await resolver.resolve("normalize")
    resolver.invalidate()
    await resolver.resolve("normalize")

    assert fetcher.calls == 2


async def test_no_active_provider_raises() -> None:
    resolver = ProviderResolver(CountingFetcher(None), build, ttl_s=30.0)

    with pytest.raises(NoActiveProviderError):
        await resolver.resolve("normalize")


async def test_pipeline_override_wins() -> None:
    row = make_row(overrides={"match": {"model": "qwen3:32b", "temperature": 0.2}})
    resolver = ProviderResolver(CountingFetcher(row), build, ttl_s=30.0)

    resolved = await resolver.resolve("match")

    assert resolved.model == "qwen3:32b"
    assert resolved.temperature == 0.2


async def test_falls_back_to_default_model() -> None:
    resolver = ProviderResolver(CountingFetcher(make_row()), build, ttl_s=30.0)

    resolved = await resolver.resolve("cover_letter")

    assert resolved.model == "qwen3:14b"
    assert resolved.temperature == 0.0


async def test_no_model_anywhere_raises() -> None:
    row = make_row(default_model="")
    resolver = ProviderResolver(CountingFetcher(row), build, ttl_s=30.0)

    with pytest.raises(ModelResolutionError):
        await resolver.resolve("normalize")
