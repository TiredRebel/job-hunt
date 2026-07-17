"""Ports (interfaces) of the LLM service, in :mod:`llm` domain terms.

All LLM access goes through the ``LLMProvider`` port; implementations live
in :mod:`llm.providers` (see docs/LLM_CONFIG.md).
"""

from typing import Protocol, TypeVar, runtime_checkable

from pydantic import BaseModel

from llm.schemas import CompletionRequest, CompletionResult, ProviderHealth

ModelT = TypeVar("ModelT", bound=BaseModel)


@runtime_checkable
class LLMProvider(Protocol):
    """A chat-completion backend (Ollama, OpenAI-compatible, Anthropic)."""

    slug: str

    async def complete(self, req: CompletionRequest) -> CompletionResult:
        """Run a free-text completion."""
        ...

    async def complete_structured(self, req: CompletionRequest, schema: type[ModelT]) -> ModelT:
        """Run a completion constrained to ``schema``; raise on invalid output."""
        ...

    async def health(self) -> ProviderHealth:
        """Probe connectivity; report ok/fail only (never key material)."""
        ...

    async def list_models(self) -> list[str]:
        """List models the provider currently reports as available.

        Raises:
            ProviderRequestError: On transport failures or non-2xx responses.
        """
        ...
