/**
 * @module lib/api/llm
 *
 * Typed functions for the `/llm` (LLM provider administration) resource.
 */
import { apiRequest } from './client';
import type { OperationBody, OperationResponse } from './types';

/** An LLM provider, as returned by the API. */
export type LlmProvider = OperationResponse<'LlmAdminController_listProviders_v1'>[number];

/** Provider kind, from the provider response. */
export type LlmProviderKind = LlmProvider['kind'];

/** Body accepted by {@link createLlmProvider}. */
export type CreateLlmProviderBody = OperationBody<'LlmAdminController_createProvider_v1'>;

/** Body accepted by {@link updateLlmProvider}. */
export type UpdateLlmProviderBody = OperationBody<'LlmAdminController_updateProvider_v1'>;

/** Result of {@link testLlmProvider}. */
export type ProviderTestResult = OperationResponse<'LlmAdminController_testProvider_v1'>;

/** Result of {@link listLlmModels}. */
export type ModelList = OperationResponse<'LlmAdminController_listModels_v1'>;

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
 * Register a new LLM provider. Always created inactive.
 *
 * @param body - New provider fields.
 * @returns The created provider.
 */
export async function createLlmProvider(body: CreateLlmProviderBody): Promise<LlmProvider> {
  return apiRequest<LlmProvider>('/llm/providers', { method: 'POST', body });
}

/**
 * Test connectivity for one provider, without switching to it.
 *
 * @param slug - Provider slug.
 * @returns The test outcome.
 */
export async function testLlmProvider(slug: string): Promise<ProviderTestResult> {
  return apiRequest<ProviderTestResult>(`/llm/providers/${slug}/test`, { method: 'POST' });
}

/**
 * List models the provider currently reports, without switching to it.
 *
 * @param slug - Provider slug.
 * @param signal - Optional abort signal.
 * @returns The model list (or an `error` detail when unavailable).
 */
export async function listLlmModels(slug: string, signal?: AbortSignal): Promise<ModelList> {
  return apiRequest<ModelList>(`/llm/providers/${slug}/models`, { signal });
}

/**
 * Update a provider's configuration. Omitted fields are left untouched.
 *
 * @param slug - Provider slug.
 * @param body - Fields to change.
 * @returns The updated provider.
 */
export async function updateLlmProvider(
  slug: string,
  body: UpdateLlmProviderBody,
): Promise<LlmProvider> {
  return apiRequest<LlmProvider>(`/llm/providers/${slug}`, { method: 'PATCH', body });
}

/**
 * Permanently delete an LLM provider. Rejected by the API for the active
 * provider (409).
 *
 * @param slug - Provider slug.
 */
export async function deleteLlmProvider(slug: string): Promise<void> {
  await apiRequest<void>(`/llm/providers/${slug}`, { method: 'DELETE' });
}
