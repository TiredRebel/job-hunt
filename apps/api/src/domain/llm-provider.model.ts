/**
 * @module llm-provider.model
 *
 * LLM provider read model from `core.llm_providers`. The gateway proxies
 * provider list and active-provider switching to the LLM service.
 */

/** Allowed provider kind values. */
export type LlmProviderKind = 'ollama' | 'openai-compatible' | 'anthropic';

/**
 * LLM provider read model. Secrets are referenced by env var name only.
 */
export interface LlmProvider {
  readonly id: number;
  readonly slug: string;
  readonly kind: LlmProviderKind;
  readonly baseUrl: string | null;
  readonly defaultModel: string;
  /** Name of the environment variable holding the API key (never the value). */
  readonly apiKeyEnv: string | null;
  readonly pipelineOverrides: Record<string, unknown>;
  readonly isActive: boolean;
  readonly params: Record<string, unknown>;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
