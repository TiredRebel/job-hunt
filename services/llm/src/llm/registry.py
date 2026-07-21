"""Provider factories: build an ``LLMProvider`` from a ``core.llm_providers`` row."""

from collections.abc import Callable

import httpx

from llm.db import ProviderRow
from llm.errors import UnknownProviderKindError
from llm.ports import LLMProvider
from llm.providers.anthropic import AnthropicProvider
from llm.providers.base import resolve_api_key
from llm.providers.ollama import OllamaProvider
from llm.providers.openai_compat import OpenAICompatProvider

ProviderFactory = Callable[[ProviderRow, httpx.AsyncClient], LLMProvider]


def _ollama(row: ProviderRow, client: httpx.AsyncClient) -> LLMProvider:
    return OllamaProvider(row.slug, row.base_url, resolve_api_key(row.api_key_env), client)


def _openai_compat(row: ProviderRow, client: httpx.AsyncClient) -> LLMProvider:
    return OpenAICompatProvider(row.slug, row.base_url, resolve_api_key(row.api_key_env), client)


def _anthropic(row: ProviderRow, client: httpx.AsyncClient) -> LLMProvider:
    return AnthropicProvider(row.slug, row.base_url, resolve_api_key(row.api_key_env), client)


_FACTORIES: dict[str, ProviderFactory] = {
    "ollama": _ollama,
    "openai-compatible": _openai_compat,
    "anthropic": _anthropic,
}


def build_provider(row: ProviderRow, client: httpx.AsyncClient) -> LLMProvider:
    """Instantiate the adapter registered for ``row.kind``.

    Raises:
        UnknownProviderKindError: If no factory is registered for the kind.
    """
    factory = _FACTORIES.get(row.kind)
    if factory is None:
        raise UnknownProviderKindError(f"no provider factory for kind {row.kind!r}")
    return factory(row, client)
