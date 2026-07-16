/**
 * @module lib/api/llm
 *
 * Typed functions for the `/llm` (LLM provider administration) resource.
 */
import { apiRequest } from './client';
import type { OperationResponse } from './types';

/** An LLM provider, as returned by the API. */
export type LlmProvider = OperationResponse<'LlmAdminController_listProviders_v1'>[number];

/** Result of a connection test against the active provider. */
export type TestConnectionResult = OperationResponse<'LlmAdminController_testConnection_v1', 201>;

/**
 * List registered LLM providers.
 *
 * @param signal - Optional abort signal.
 * @returns All registered providers.
 */
export async function listLlmProviders(signal?: AbortSignal): Promise<readonly LlmProvider[]> {
  return apiRequest<readonly LlmProvider[]>('/llm/providers', { signal });
}

/**
 * Switch the active LLM provider.
 *
 * @param slug - Provider slug to activate.
 * @returns The now-active provider.
 */
export async function setActiveLlmProvider(slug: string): Promise<LlmProvider> {
  return apiRequest<LlmProvider>('/llm/providers/active', { method: 'PUT', body: { slug } });
}

/**
 * Test connection to the active LLM provider.
 *
 * @returns Whether the connection succeeded (client may time the round-trip).
 */
export async function testLlmConnection(): Promise<TestConnectionResult> {
  return apiRequest<TestConnectionResult>('/llm/providers/test-connection', { method: 'POST' });
}
