"""Anthropic (Claude API) adapter — tool-use for structured output."""

from typing import Any

import httpx
from pydantic import BaseModel, ValidationError

from llm.errors import SchemaValidationError
from llm.providers.base import get_json, post_json, probe
from llm.schemas import CompletionRequest, CompletionResult, ProviderHealth

_API_VERSION = "2023-06-01"
_DEFAULT_MAX_TOKENS = 2048
_TOOL_NAME = "emit_result"


class AnthropicProvider:
    """``kind='anthropic'`` — ``/v1/messages`` with ``x-api-key`` auth."""

    kind = "anthropic"

    def __init__(
        self, slug: str, base_url: str, api_key: str | None, client: httpx.AsyncClient
    ) -> None:
        """Bind the adapter to a registry row and shared HTTP client."""
        self.slug = slug
        self._base_url = base_url.rstrip("/")
        self._client = client
        self._headers = {
            "x-api-key": api_key or "",
            "anthropic-version": _API_VERSION,
        }

    def _payload(self, req: CompletionRequest) -> dict[str, object]:
        payload: dict[str, object] = {
            "model": req.model,
            "max_tokens": req.max_tokens or _DEFAULT_MAX_TOKENS,
            "messages": [{"role": "user", "content": req.prompt}],
            "temperature": req.temperature,
        }
        if req.system is not None:
            payload["system"] = req.system
        return payload

    async def _messages(self, payload: dict[str, object]) -> dict[str, object]:
        return await post_json(
            self._client, f"{self._base_url}/v1/messages", payload, self._headers
        )

    @staticmethod
    def _usage(data: dict[str, object]) -> tuple[int | None, int | None]:
        usage: Any = data.get("usage") or {}
        tokens_in = usage.get("input_tokens")
        tokens_out = usage.get("output_tokens")
        return (
            int(tokens_in) if isinstance(tokens_in, int) else None,
            int(tokens_out) if isinstance(tokens_out, int) else None,
        )

    async def complete(self, req: CompletionRequest) -> CompletionResult:
        """Run a free-text completion via ``/v1/messages``."""
        data = await self._messages(self._payload(req))
        blocks: Any = data.get("content") or []
        text = "".join(str(b.get("text", "")) for b in blocks if b.get("type") == "text")
        tokens_in, tokens_out = self._usage(data)
        return CompletionResult(text=text, tokens_in=tokens_in, tokens_out=tokens_out)

    async def complete_structured[ModelT: BaseModel](
        self, req: CompletionRequest, schema: type[ModelT]
    ) -> ModelT:
        """Run a schema-constrained completion via forced tool use."""
        payload = self._payload(req)
        payload["tools"] = [
            {
                "name": _TOOL_NAME,
                "description": "Return the structured result.",
                "input_schema": schema.model_json_schema(),
            }
        ]
        payload["tool_choice"] = {"type": "tool", "name": _TOOL_NAME}
        data = await self._messages(payload)
        blocks: Any = data.get("content") or []
        for block in blocks:
            if block.get("type") == "tool_use" and block.get("name") == _TOOL_NAME:
                try:
                    return schema.model_validate(block.get("input"))
                except ValidationError as exc:
                    raise SchemaValidationError(str(exc)) from exc
        raise SchemaValidationError("no tool_use block in Anthropic response")

    async def health(self) -> ProviderHealth:
        """Probe the API via ``/v1/models``."""
        ok, detail = await probe(self._client, f"{self._base_url}/v1/models", self._headers)
        return ProviderHealth(ok=ok, detail=detail)

    async def list_models(self) -> list[str]:
        """List models via ``/v1/models``."""
        data = await get_json(self._client, f"{self._base_url}/v1/models", self._headers)
        items: Any = data.get("data") or []
        return [str(item["id"]) for item in items if isinstance(item, dict) and "id" in item]
