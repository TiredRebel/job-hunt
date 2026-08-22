/**
 * @module llm-provider.model
 *
 * LLM provider read model from `core.llm_providers`. The gateway proxies
 * provider list and active-provider switching to the LLM service.
 */

/** Allowed provider kind values. */
export type LlmProviderKind = 'ollama' | 'openai-compatible' | 'anthropic';

/**
 * LLM provider read model. API keys are never included in this response.
 */
export interface LlmProvider {
  readonly id: number;
  readonly slug: string;
  /** Human-readable connection name, editable without changing the registry key. */
  readonly name: string;
  readonly kind: LlmProviderKind;
  readonly baseUrl: string | null;
  readonly defaultModel: string;
  /** Whether an encrypted API key has been configured. */
  readonly apiKeyConfigured: boolean;
  readonly pipelineOverrides: Record<string, unknown>;
  readonly isActive: boolean;
  readonly p50LatencyMs: number | null;
  readonly p95LatencyMs: number | null;
  readonly failedRuns24h: number;
  readonly lastStatus: 'success' | 'failed' | null;
  readonly lastRunAt: Date | null;
  readonly params: Record<string, unknown>;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
