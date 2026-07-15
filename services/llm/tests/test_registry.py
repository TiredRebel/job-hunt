"""Tests for provider factories and API-key resolution."""

import httpx
import pytest
from conftest import make_row

from llm.errors import MissingApiKeyError, UnknownProviderKindError
from llm.providers.anthropic import AnthropicProvider
from llm.providers.ollama import OllamaProvider
from llm.providers.openai_compat import OpenAICompatProvider
from llm.registry import build_provider


@pytest.fixture
def client() -> httpx.AsyncClient:
    return httpx.AsyncClient()


def test_builds_ollama(client: httpx.AsyncClient) -> None:
    provider = build_provider(make_row(kind="ollama"), client)

    assert isinstance(provider, OllamaProvider)
    assert provider.slug == "ollama-local"


def test_builds_openai_compatible_with_key(
    client: httpx.AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("OPENROUTER_API_KEY", "test-key")
    row = make_row(slug="openrouter", kind="openai-compatible", api_key_env="OPENROUTER_API_KEY")

    provider = build_provider(row, client)

    assert isinstance(provider, OpenAICompatProvider)


def test_builds_openai_compatible_without_key_env(client: httpx.AsyncClient) -> None:
    row = make_row(slug="local-vllm", kind="openai-compatible", api_key_env=None)

    assert isinstance(build_provider(row, client), OpenAICompatProvider)


def test_builds_anthropic(client: httpx.AsyncClient, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("ANTHROPIC_API_KEY", "test-key")
    row = make_row(slug="claude", kind="anthropic", api_key_env="ANTHROPIC_API_KEY")

    assert isinstance(build_provider(row, client), AnthropicProvider)


def test_missing_key_env_raises(client: httpx.AsyncClient, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
    row = make_row(kind="openai-compatible", api_key_env="OPENROUTER_API_KEY")

    with pytest.raises(MissingApiKeyError):
        build_provider(row, client)


def test_unknown_kind_raises(client: httpx.AsyncClient) -> None:
    with pytest.raises(UnknownProviderKindError):
        build_provider(make_row(kind="mystery"), client)
