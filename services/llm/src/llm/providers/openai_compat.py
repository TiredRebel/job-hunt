"""OpenAI-compatible adapter (Ollama Cloud, OpenRouter, Groq, vLLM, LM Studio, OpenAI).

One adapter, many providers — a registry row supplies ``base_url`` plus the
name of the API-key env var.  Adding such a provider is a DB insert, no code.
"""

from typing import Any

import httpx
from pydantic import BaseModel, ValidationError

from llm.errors import SchemaValidationError
from llm.providers.base import post_json, probe
from llm.schemas import CompletionRequest, CompletionResult, ProviderHealth


class OpenAICompatProvider:
    """``kind='openai-compatible'`` — ``/chat/completions`` with bearer auth."""

    kind = "openai-compatible"

    def __init__(
        self, slug: str, base_url: str, api_key: str | None, client: httpx.AsyncClient
    ) -> None:
        """Bind the adapter to a registry row and shared HTTP client."""
        self.slug = slug
        self._base_url = base_url.rstrip("/")
        self._client = client
        self._headers: dict[str, str] = {}
        if api_key is not None:
            self._headers["Authorization"] = f"Bearer {api_key}"

    def _payload(self, req: CompletionRequest) -> dict[str, object]:
        messages: list[dict[str, str]] = []
        if req.system is not None:
            messages.append({"role": "system", "content": req.system})
        messages.append({"role": "user", "content": req.prompt})
        payload: dict[str, object] = {
            "model": req.model,
            "messages": messages,
            "temperature": req.temperature,
        }
        if req.max_tokens is not None:
            payload["max_tokens"] = req.max_tokens
        return payload

    async def _chat(self, payload: dict[str, object]) -> tuple[str, int | None, int | None]:
        data = await post_json(
            self._client, f"{self._base_url}/chat/completions", payload, self._headers
        )
        choices: Any = data.get("choices") or [{}]
        text = str((choices[0].get("message") or {}).get("content", ""))
        usage: Any = data.get("usage") or {}
        tokens_in = usage.get("prompt_tokens")
        tokens_out = usage.get("completion_tokens")
        return (
            text,
            int(tokens_in) if isinstance(tokens_in, int) else None,
            int(tokens_out) if isinstance(tokens_out, int) else None,
        )

    async def complete(self, req: CompletionRequest) -> CompletionResult:
        """Run a free-text completion via ``/chat/completions``."""
        text, tokens_in, tokens_out = await self._chat(self._payload(req))
        return CompletionResult(text=text, tokens_in=tokens_in, tokens_out=tokens_out)

    async def complete_structured[ModelT: BaseModel](
        self, req: CompletionRequest, schema: type[ModelT]
    ) -> ModelT:
        """Run a schema-constrained completion via ``response_format=json_schema``."""
        payload = self._payload(req)
        payload["response_format"] = {
            "type": "json_schema",
            "json_schema": {"name": schema.__name__, "schema": schema.model_json_schema()},
        }
        text, _, _ = await self._chat(payload)
        try:
            return schema.model_validate_json(text)
        except ValidationError as exc:
            raise SchemaValidationError(str(exc)) from exc

    async def health(self) -> ProviderHealth:
        """Probe the endpoint via ``/models``."""
        ok, detail = await probe(self._client, f"{self._base_url}/models", self._headers)
        return ProviderHealth(ok=ok, detail=detail)
