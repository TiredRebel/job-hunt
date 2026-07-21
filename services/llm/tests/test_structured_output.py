"""Regression tests for structured provider output handling."""

import httpx

from llm.providers.ollama import OllamaProvider
from llm.schemas import CompletionRequest, NormalizedJob


async def test_ollama_accepts_json_wrapped_in_markdown_fence() -> None:
    """Cloud models may add a Markdown fence around an otherwise valid schema response."""
    response = """```json
{
  "title": "Python AI Lead",
  "company": null,
  "location": null,
  "remote": null,
  "employment_type": null,
  "seniority": null,
  "salary_min": null,
  "salary_max": null,
  "salary_currency": null,
  "description_md": "Role details"
}
```"""

    async def handler(_request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"message": {"content": response}})

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    provider = OllamaProvider("ollama-cloud", "https://ollama.com", "key", client)

    result = await provider.complete_structured(
        CompletionRequest(model="glm-5.2:cloud", prompt="Normalize this job"),
        NormalizedJob,
    )

    assert result.title == "Python AI Lead"
    assert result.description_md == "Role details"
    await client.aclose()
