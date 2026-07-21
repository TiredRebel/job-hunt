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

- **Add provider** — creates a new, always-**inactive** row (`slug`/`kind` mandatory and permanent afterward, `base_url`/`default_model` mandatory). An API key can be pasted directly. Switch to it via the existing active-provider radio once it's configured and tested.
- **Test connection** — every card probes the _real_ backend with a one-token completion. The configure dialog tests its current draft; when the API-key input is blank it safely reuses the saved encrypted key.
- **Configure** — edits `base_url`, API key, `default_model` (picked from a live `GET .../models` list when reachable, or typed freely), and the four pipeline overrides (`normalize`/`tag`/`match`/`cover_letter`). Saving replaces the whole `pipeline_overrides` map (not a merge).
- **Delete** — non-active providers can be permanently deleted from the configure dialog. The active provider is protected.

## Secrets policy

The dashboard sends a typed API key only when the user saves or tests a draft. `services/llm` encrypts it with Fernet before it is persisted in `api_key_ciphertext`; all read responses expose only `api_key_configured`, never a key or ciphertext. The existing `INTERNAL_API_TOKEN` supplies the service master-key material, so a provider-specific environment variable and service restart are not required. Re-enter a key to rotate it; leave the field blank to retain the saved key.

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

| slug                    | kind              | base_url                       | default_model  | API key |
| ----------------------- | ----------------- | ------------------------------ | -------------- | ------- |
| `ollama-local` (active) | ollama            | `http://localhost:11434`       | `qwen3:14b`    | none    |
| `ollama-cloud`          | openai-compatible | `https://ollama.com/v1`        | `gpt-oss:120b` | entered in UI |
| `openrouter`            | openai-compatible | `https://openrouter.ai/api/v1` | _(set later)_  | entered in UI |
