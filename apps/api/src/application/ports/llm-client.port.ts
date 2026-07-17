/**
 * @module llm-client.port
 *
 * Outbound port for LLM administration calls: list/create providers, switch
 * active, per-provider connection test, model listing, and configuration.
 */
import type { LlmProvider, LlmProviderKind } from '../../domain/llm-provider.model';

/** Input for {@link LlmAdminClient.createProvider}. Rows are created inactive. */
export interface CreateLlmProviderInput {
  readonly slug: string;
  readonly kind: LlmProviderKind;
  readonly baseUrl: string;
  readonly defaultModel: string;
  /** Env var name holding the API key (never the value). Omit if the provider needs none. */
  readonly apiKeyEnv?: string;
}

/**
 * Input for {@link LlmAdminClient.updateProvider}. Omitted fields are left
 * untouched; `pipelineOverrides`, when present, replaces the whole map.
 * Its per-pipeline shape (`model`/`temperature`) is not validated at the
 * gateway — the LLM service is the source of truth (422 on a bad shape).
 *
 * `apiKeyEnv` distinguishes "omitted" (key absent from this object — leave
 * untouched) from an explicit `null` (clear the key requirement). Build this
 * object by conditionally spreading keys in, never by always assigning
 * `undefined`, or the distinction is lost.
 */
export interface UpdateLlmProviderInput {
  readonly defaultModel?: string;
  readonly baseUrl?: string;
  readonly apiKeyEnv?: string | null;
  readonly pipelineOverrides?: Record<string, unknown>;
}

/** Result of {@link LlmAdminClient.testProvider}. */
export interface ProviderTestResult {
  readonly ok: boolean;
  readonly detail: string | null;
  readonly elapsedMs: number | null;
}

/** Result of {@link LlmAdminClient.listModels}. */
export interface ModelList {
  readonly models: readonly string[];
  readonly error: string | null;
}

/**
 * Thrown by {@link LlmAdminClient} implementations for a non-2xx response
 * from the LLM service, carrying the status so callers can map it to the
 * appropriate NestJS exception (404/409/422 vs. a genuine 502).
 */
export class LlmServiceError extends Error {
  /**
   * Thrown by {@link LlmAdminClient} implementations for a non-2xx response.
   *
   * @param status - HTTP status returned by the LLM service.
   * @param message - Error detail (may include the raw response body).
   */
  public constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'LlmServiceError';
  }
}

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
   * Register a new provider row. Always created inactive.
   *
   * @param input - New provider fields.
   * @throws LlmServiceError with status 409 if the slug already exists.
   */
  createProvider(input: CreateLlmProviderInput): Promise<LlmProvider>;

  /**
   * Probe one provider's real backend, without touching the active row.
   *
   * @param slug - Provider slug.
   * @throws LlmServiceError with status 404 if the slug is unknown.
   */
  testProvider(slug: string): Promise<ProviderTestResult>;

  /**
   * List models the provider currently reports, without switching to it.
   *
   * @param slug - Provider slug.
   * @throws LlmServiceError with status 404 if the slug is unknown.
   */
  listModels(slug: string): Promise<ModelList>;

  /**
   * Update editable fields (default model, overrides, base URL, key env).
   *
   * @param slug - Provider slug.
   * @param patch - Fields to change.
   * @throws LlmServiceError with status 404 if the slug is unknown.
   */
  updateProvider(slug: string, patch: UpdateLlmProviderInput): Promise<LlmProvider>;
}

/**
 * Injection token for the LLM admin client port.
 */
export const LLM_ADMIN_CLIENT = Symbol('LLM_ADMIN_CLIENT');
