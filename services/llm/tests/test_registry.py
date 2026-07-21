"""Tests for provider factories and encrypted API-key resolution."""

import httpx
import pytest
from conftest import make_row

from llm.credentials import CredentialCipher
from llm.errors import UnknownProviderKindError
from llm.providers.anthropic import AnthropicProvider
from llm.providers.ollama import OllamaProvider
from llm.providers.openai_compat import OpenAICompatProvider
from llm.registry import build_provider
from llm.schemas import CompletionRequest


@pytest.fixture
def client() -> httpx.AsyncClient:
    return httpx.AsyncClient()


@pytest.fixture
def cipher() -> CredentialCipher:
    return CredentialCipher("test-internal-token-at-least-sixteen")


def test_builds_ollama(client: httpx.AsyncClient, cipher: CredentialCipher) -> None:
    provider = build_provider(make_row(kind="ollama"), client, cipher)

    assert isinstance(provider, OllamaProvider)
    assert provider.slug == "ollama-local"


@pytest.mark.asyncio
async def test_ollama_uses_the_directly_stored_api_key(cipher: CredentialCipher) -> None:
    """Ollama Cloud requests decrypt the configured key into bearer auth."""
    seen_headers: dict[str, str] = {}

    async def handler(request: httpx.Request) -> httpx.Response:
        seen_headers.update(request.headers)
        return httpx.Response(200, json={"message": {"content": "OK"}})

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport) as client:
        provider = build_provider(
            make_row(kind="ollama", api_key_ciphertext=cipher.encrypt("direct-secret")),
            client,
            cipher,
        )
        await provider.complete(CompletionRequest(model="glm-5.2", prompt="Ping", max_tokens=1))

    assert seen_headers["authorization"] == "Bearer direct-secret"


def test_builds_openai_compatible_with_or_without_a_key(
    client: httpx.AsyncClient, cipher: CredentialCipher
) -> None:
    assert isinstance(
        build_provider(make_row(slug="openrouter", kind="openai-compatible"), client, cipher),
        OpenAICompatProvider,
    )
    assert isinstance(
        build_provider(make_row(slug="local-vllm", kind="openai-compatible"), client, cipher),
        OpenAICompatProvider,
    )


def test_builds_anthropic(client: httpx.AsyncClient, cipher: CredentialCipher) -> None:
    assert isinstance(
        build_provider(make_row(slug="claude", kind="anthropic"), client, cipher), AnthropicProvider
    )


def test_unknown_kind_raises(client: httpx.AsyncClient, cipher: CredentialCipher) -> None:
    with pytest.raises(UnknownProviderKindError):
        build_provider(make_row(kind="mystery"), client, cipher)
