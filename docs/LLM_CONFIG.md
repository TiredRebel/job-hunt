# LLM Configuration & Hot Switching

## Provider model

All LLM access goes through `services/llm`'s `LLMProvider` port:

```python
class LLMProvider(Protocol):
    slug: str
    async def complete(self, req: CompletionRequest) -> CompletionResult: ...
    async def complete_structured(self, req: CompletionRequest, schema: type[BaseModel]) -> BaseModel: ...
    async def health(self) -> ProviderHealth: ...
    async def list_models(self) -> list[str]: ...
```

Implementations (infrastructure layer):

| kind                | covers                                                  | notes                                               |
| ------------------- | ------------------------------------------------------- | --------------------------------------------------- |
| `ollama`            | local Ollama (`http://localhost:11434`)                 | native `/api/chat`, structured output via `format`  |
| `openai-compatible` | Ollama Cloud, OpenRouter, Groq, vLLM, LM Studio, OpenAI | one adapter, many providers — just `base_url` + key |
| `anthropic`         | Claude API                                              | tool-use for structured output                      |

Registry rows live in `core.llm_providers` (see DATA_MODEL.md). Adding an OpenAI-compatible provider = **inserting a row** — from the "LLM settings" dashboard page, no code or migration needed.

## Managing providers from the UI

The "LLM settings" page (`/settings/llm`) supports the full provider lifecycle except deletion:

- **Add provider** — creates a new, always-**inactive** row (`slug`/`kind` mandatory and permanent afterward, `base_url`/`default_model` mandatory, `api_key_env` optional). Switch to it via the existing active-provider radio once it's configured and tested.
- **Test connection** — every card, active or not, probes the _real_ backend by building the adapter for that row and calling its `health()` (or the equivalent listing endpoint). Never fakes success: a missing key or unreachable host reports `ok: false` with a detail (e.g. the exception class name, or `"environment variable '<NAME>' is not set"`), always as a 200 response — a 502 only means the LLM service itself couldn't be reached, not that the _provider_ is down.
- **Configure** — edits `base_url`, `api_key_env` (clearing the field sends an explicit "no key needed", distinct from leaving it alone), `default_model` (picked from a live `GET .../models` list when the provider is reachable, or typed freely when it's not — a cloud provider's model list requires a valid key, and a local Ollama may not have pulled a model yet, both legitimate states), and the four pipeline overrides (`normalize`/`tag`/`match`/`cover_letter`). Saving replaces the whole `pipeline_overrides` map (not a merge).
- **Deleting a provider is not supported from the UI** — if you created one by mistake, drop the row directly: `DELETE FROM core.llm_providers WHERE slug = '<slug>';`.

## Secrets policy

DB stores `api_key_env` — the **name** of an environment variable (e.g. `OPENROUTER_API_KEY`), never a raw key value; the API rejects raw values outright since there is no field for one. Add the real value to `.env` and **restart the LLM service** — it reads `os.environ` at request time, so an unset env var surfaces as a diagnosable `MissingApiKeyError` (via Test connection) rather than a silent failure. The dashboard never displays or transmits key values.

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
  "normalize": { "model": "qwen3:8b", "temperature": 0 },
  "tag": { "model": "qwen3:8b", "temperature": 0 },
  "match": { "model": "qwen3:14b", "temperature": 0.2 },
  "cover_letter": { "model": "qwen3:32b", "temperature": 0.7 }
}
```

Resolution order: pipeline override → provider `default_model` → error (never silent fallback to a different provider).

## Structured output discipline

Every pipeline defines a pydantic schema (e.g. `NormalizedJob`, `MatchResult`). Providers must return schema-valid JSON (native structured output where supported; constrained retry ×2 otherwise → mark `pipeline_runs.status='failed'`, never persist garbage).

## Seed providers (migration 0003)

| slug                    | kind              | base_url                       | default_model  | api_key_env            |
| ----------------------- | ----------------- | ------------------------------ | -------------- | ---------------------- |
| `ollama-local` (active) | ollama            | `http://localhost:11434`       | `qwen3:14b`    | —                      |
| `ollama-cloud`          | openai-compatible | `https://ollama.com/v1`        | `gpt-oss:120b` | `OLLAMA_CLOUD_API_KEY` |
| `openrouter`            | openai-compatible | `https://openrouter.ai/api/v1` | _(set later)_  | `OPENROUTER_API_KEY`   |
