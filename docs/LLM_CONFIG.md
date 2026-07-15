# LLM Configuration & Hot Switching

## Provider model

All LLM access goes through `services/llm`'s `LLMProvider` port:

```python
class LLMProvider(Protocol):
    slug: str
    async def complete(self, req: CompletionRequest) -> CompletionResult: ...
    async def complete_structured(self, req: CompletionRequest, schema: type[BaseModel]) -> BaseModel: ...
    async def health(self) -> ProviderHealth: ...
```

Implementations (infrastructure layer):

| kind | covers | notes |
|---|---|---|
| `ollama` | local Ollama (`http://localhost:11434`) | native `/api/chat`, structured output via `format` |
| `openai-compatible` | Ollama Cloud, OpenRouter, Groq, vLLM, LM Studio, OpenAI | one adapter, many providers — just `base_url` + key |
| `anthropic` | Claude API | tool-use for structured output |

Registry rows live in `core.llm_providers` (see DATA_MODEL.md). Adding an OpenAI-compatible provider = **inserting a row**, no code.

## Secrets policy

DB stores `api_key_env` — the **name** of an environment variable (e.g. `OPENROUTER_API_KEY`). Values live only in `.env`. The dashboard never displays or transmits key values; the "test connection" button reports only ok/fail.

## Hot switch flow

```
dashboard (LLM settings page)
   └─ PUT /api/llm/providers/active {slug}          (apps/api)
        └─ PUT /providers/active                    (services/llm)
             ├─ UPDATE core.llm_providers SET is_active ...
             └─ NOTIFY llm_config_changed
workers: LISTEN llm_config_changed → drop cached provider → next task resolves fresh
fallback: cache TTL 30s (covers missed NOTIFY)
```

No restarts; in-flight tasks finish on the old provider, next task uses the new one.

## Per-pipeline overrides

`pipeline_overrides` JSONB on the active provider row, e.g.:

```json
{
  "normalize":    { "model": "qwen3:8b",  "temperature": 0 },
  "tag":          { "model": "qwen3:8b",  "temperature": 0 },
  "match":        { "model": "qwen3:14b", "temperature": 0.2 },
  "cover_letter": { "model": "qwen3:32b", "temperature": 0.7 }
}
```

Resolution order: pipeline override → provider `default_model` → error (never silent fallback to a different provider).

## Structured output discipline

Every pipeline defines a pydantic schema (e.g. `NormalizedJob`, `MatchResult`). Providers must return schema-valid JSON (native structured output where supported; constrained retry ×2 otherwise → mark `pipeline_runs.status='failed'`, never persist garbage).

## Seed providers (migration 0003)

| slug | kind | base_url | default_model | api_key_env |
|---|---|---|---|---|
| `ollama-local` (active) | ollama | `http://localhost:11434` | `qwen3:14b` | — |
| `ollama-cloud` | openai-compatible | `https://ollama.com/v1` | `gpt-oss:120b` | `OLLAMA_CLOUD_API_KEY` |
| `openrouter` | openai-compatible | `https://openrouter.ai/api/v1` | *(set later)* | `OPENROUTER_API_KEY` |
