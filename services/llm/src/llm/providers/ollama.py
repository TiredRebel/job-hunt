"""Local Ollama adapter (native ``/api/chat``, structured output via ``format``)."""

from typing import Any

import httpx
from pydantic import BaseModel, ValidationError

from llm.errors import SchemaValidationError
from llm.providers.base import post_json, probe
from llm.schemas import CompletionRequest, CompletionResult, ProviderHealth


class OllamaProvider:
    """``kind='ollama'`` — talks to a local Ollama daemon."""

    kind = "ollama"

    def __init__(self, slug: str, base_url: str, client: httpx.AsyncClient) -> None:
        """Bind the adapter to a registry row and shared HTTP client."""
        self.slug = slug
        self._base_url = base_url.rstrip("/")
        self._client = client

    def _payload(self, req: CompletionRequest) -> dict[str, object]:
        messages: list[dict[str, str]] = []
        if req.system is not None:
            messages.append({"role": "system", "content": req.system})
        messages.append({"role": "user", "content": req.prompt})
        options: dict[str, object] = {"temperature": req.temperature}
        if req.max_tokens is not None:
            options["num_predict"] = req.max_tokens
        return {"model": req.model, "messages": messages, "stream": False, "options": options}

    async def _chat(self, payload: dict[str, object]) -> tuple[str, int | None, int | None]:
        data = await post_json(self._client, f"{self._base_url}/api/chat", payload)
        message: Any = data.get("message") or {}
        text = str(message.get("content", ""))
        tokens_in = data.get("prompt_eval_count")
        tokens_out = data.get("eval_count")
        return (
            text,
            int(tokens_in) if isinstance(tokens_in, int) else None,
            int(tokens_out) if isinstance(tokens_out, int) else None,
        )

    async def complete(self, req: CompletionRequest) -> CompletionResult:
        """Run a free-text completion via ``/api/chat``."""
        text, tokens_in, tokens_out = await self._chat(self._payload(req))
        return CompletionResult(text=text, tokens_in=tokens_in, tokens_out=tokens_out)

    async def complete_structured[ModelT: BaseModel](
        self, req: CompletionRequest, schema: type[ModelT]
    ) -> ModelT:
        """Run a schema-constrained completion (Ollama ``format`` parameter)."""
        payload = self._payload(req)
        payload["format"] = schema.model_json_schema()
        text, _, _ = await self._chat(payload)
        try:
            return schema.model_validate_json(text)
        except ValidationError as exc:
            raise SchemaValidationError(str(exc)) from exc

    async def health(self) -> ProviderHealth:
        """Probe the daemon via ``/api/tags``."""
        ok, detail = await probe(self._client, f"{self._base_url}/api/tags")
        return ProviderHealth(ok=ok, detail=detail)
