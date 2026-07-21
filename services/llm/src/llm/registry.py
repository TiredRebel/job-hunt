"""Provider factories: build an ``LLMProvider`` from a ``core.llm_providers`` row."""

from collections.abc import Callable

import httpx

from llm.credentials import CredentialCipher
from llm.db import ProviderRow
from llm.errors import UnknownProviderKindError
from llm.ports import LLMProvider
from llm.providers.anthropic import AnthropicProvider
from llm.providers.base import resolve_api_key
from llm.providers.ollama import OllamaProvider
from llm.providers.openai_compat import OpenAICompatProvider

ProviderFactory = Callable[[ProviderRow, httpx.AsyncClient, CredentialCipher], LLMProvider]


def _api_key(row: ProviderRow, cipher: CredentialCipher) -> str | None:
    """Return the direct key, falling back to a pre-migration env reference."""
    if row.api_key_ciphertext:
        return cipher.decrypt(row.api_key_ciphertext)
    return resolve_api_key(row.api_key_env)


def _ollama(row: ProviderRow, client: httpx.AsyncClient, cipher: CredentialCipher) -> LLMProvider:
    return OllamaProvider(row.slug, row.base_url, _api_key(row, cipher), client)


def _openai_compat(
    row: ProviderRow, client: httpx.AsyncClient, cipher: CredentialCipher
) -> LLMProvider:
    return OpenAICompatProvider(row.slug, row.base_url, _api_key(row, cipher), client)


def _anthropic(
    row: ProviderRow, client: httpx.AsyncClient, cipher: CredentialCipher
) -> LLMProvider:
    return AnthropicProvider(row.slug, row.base_url, _api_key(row, cipher), client)


_FACTORIES: dict[str, ProviderFactory] = {
    "ollama": _ollama,
    "openai-compatible": _openai_compat,
    "anthropic": _anthropic,
}


def build_provider(
    row: ProviderRow, client: httpx.AsyncClient, cipher: CredentialCipher
) -> LLMProvider:
    """Instantiate the adapter registered for ``row.kind``.

    Raises:
        UnknownProviderKindError: If no factory is registered for the kind.
    """
    factory = _FACTORIES.get(row.kind)
    if factory is None:
        raise UnknownProviderKindError(f"no provider factory for kind {row.kind!r}")
    return factory(row, client, cipher)
