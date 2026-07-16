/**
 * @module llm-client.port
 *
 * Outbound port for LLM administration calls: list providers, switch active,
 * test connection.
 */
import type { LlmProvider } from '../../domain/llm-provider.model';

/**
 * Outbound LLM administration client contract.
 */
export interface LlmAdminClient {
  /**
   * List registered providers from the LLM service.
   *
   * @returns Provider list without secrets.
   */
  listProviders(): Promise<readonly LlmProvider[]>;

  /**
   * Switch the active provider.
   *
   * @param slug - Provider slug.
   * @returns Updated provider.
   */
  setActiveProvider(slug: string): Promise<LlmProvider>;

  /**
   * Test the active provider connection.
   *
   * @returns `true` if the provider responds.
   */
  testConnection(): Promise<boolean>;
}

/**
 * Injection token for the LLM admin client port.
 */
export const LLM_ADMIN_CLIENT = Symbol('LLM_ADMIN_CLIENT');
