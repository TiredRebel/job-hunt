/**
 * @module http-llm-admin.client
 *
 * HTTP implementation of {@link LlmAdminClient}. Proxies provider list,
 * create, active-provider switch, per-provider test, model listing, and
 * configuration to the LLM service.
 */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClsService } from 'nestjs-cls';
import { Logger } from 'nestjs-pino';

import type { ApiConfig } from '../../config/api-config';
import type { LlmProvider } from '../../domain/llm-provider.model';
import { CORRELATION_ID_HEADER, type AppClsStore } from '../logger/correlation-id';
import { fetchWithRetry } from './fetch-with-retry';
import {
  LlmServiceError,
  type CreateLlmProviderInput,
  type LlmAdminClient,
  type ModelList,
  type ProviderTestResult,
  type TestLlmProviderConnectionInput,
  type UpdateLlmProviderInput,
} from '../../application/ports/llm-client.port';

/**
 * Map an LLM service provider JSON object to the gateway domain model.
 *
 * @param body - Raw JSON object from the LLM service.
 * @returns Typed provider entity.
 */
function mapProvider(body: Record<string, unknown>): LlmProvider {
  return {
    id: Number(body['id'] ?? 0),
    slug: String(body['slug']),
    name: String(body['name']),
    kind: String(body['kind']) as LlmProvider['kind'],
    baseUrl: typeof body['base_url'] === 'string' ? body['base_url'] : null,
    defaultModel: String(body['default_model']),
    apiKeyConfigured: Boolean(body['api_key_configured']),
    pipelineOverrides:
      typeof body['pipeline_overrides'] === 'object' && body['pipeline_overrides'] !== null
        ? (body['pipeline_overrides'] as Record<string, unknown>)
        : {},
    isActive: Boolean(body['is_active']),
    p50LatencyMs: typeof body['p50_latency_ms'] === 'number' ? body['p50_latency_ms'] : null,
    p95LatencyMs: typeof body['p95_latency_ms'] === 'number' ? body['p95_latency_ms'] : null,
    failedRuns24h: typeof body['failed_runs_24h'] === 'number' ? body['failed_runs_24h'] : 0,
    lastStatus:
      body['last_status'] === 'success' || body['last_status'] === 'failed'
        ? body['last_status']
        : null,
    lastRunAt: typeof body['last_run_at'] === 'string' ? new Date(body['last_run_at']) : null,
    params:
      typeof body['params'] === 'object' && body['params'] !== null
        ? (body['params'] as Record<string, unknown>)
        : {},
    createdAt: typeof body['created_at'] === 'string' ? new Date(body['created_at']) : new Date(),
    updatedAt: typeof body['updated_at'] === 'string' ? new Date(body['updated_at']) : new Date(),
  };
}

/**
 * HTTP client for LLM administration calls.
 */
@Injectable()
export class HttpLlmAdminClient implements LlmAdminClient {
  /**
   * HTTP client for LLM administration calls.
   *
   * @param config - NestJS config service.
   * @param cls - Request-scoped CLS store carrying the correlation id.
   * @param logger - Request-context-aware logger (retry warnings).
   */
  public constructor(
    private readonly config: ConfigService,
    private readonly cls: ClsService<AppClsStore>,
    private readonly logger: Logger,
  ) {}

  /**
   * Read a required value from the validated config namespace.
   *
   * @param key - Config key under the `api` namespace.
   * @returns Config value.
   */
  private getConfigValue<K extends keyof ApiConfig>(key: K): ApiConfig[K] {
    const value = this.config.get<ApiConfig[K]>(key);
    if (value === undefined) {
      throw new Error(`Missing config key ${key}`);
    }
    return value;
  }

  /**
   * Base URL accessor.
   *
   * @returns LLM service base URL from configuration.
   */
  private get baseUrl(): string {
    return this.getConfigValue('LLM_BASE_URL');
  }

  /**
   * Token accessor.
   *
   * @returns Internal API token from configuration.
   */
  private get token(): string {
    return this.getConfigValue('INTERNAL_API_TOKEN');
  }

  /**
   * Header builder.
   *
   * @returns Request headers for LLM service calls.
   */
  private headers(): Record<string, string> {
    const correlationId = this.cls.get('correlationId');
    return {
      'Content-Type': 'application/json',
      'X-Internal-Token': this.token,
      ...(correlationId !== undefined ? { [CORRELATION_ID_HEADER]: correlationId } : {}),
    };
  }

  /**
   * Retry attempts for safe/idempotent calls, from config.
   *
   * @returns The configured `DOWNSTREAM_RETRY_ATTEMPTS`, default 3.
   */
  private get maxAttempts(): number {
    return (
      this.config.get<ApiConfig['DOWNSTREAM_RETRY_ATTEMPTS']>('api.DOWNSTREAM_RETRY_ATTEMPTS') ?? 3
    );
  }

  /**
   * Perform a request against the LLM service and return the parsed JSON
   * body, converting any non-2xx response into an {@link LlmServiceError}
   * that carries the real status for the service layer to map.
   *
   * @param path - Path relative to the LLM service base URL.
   * @param init - Method and body; headers are added here.
   * @param retry - Whether to retry on transient failure. Only genuinely
   *   idempotent/side-effect-free calls (GETs, the documented-safe test
   *   endpoint) should pass `true` — defaults to `false` so mutating calls
   *   (create/update/delete) stay single-attempt.
   * @returns The parsed JSON response body.
   * @throws LlmServiceError on a non-2xx response.
   */
  private async requestJson(
    path: string,
    init: Omit<RequestInit, 'headers'> = {},
    retry = false,
  ): Promise<unknown> {
    const target = `LLM service ${init.method ?? 'GET'} ${path}`;
    const response = retry
      ? await fetchWithRetry(
          `${this.baseUrl}${path}`,
          { ...init, headers: this.headers() },
          { maxAttempts: this.maxAttempts, target, logger: this.logger },
        )
      : await fetch(`${this.baseUrl}${path}`, { ...init, headers: this.headers() });
    if (!response.ok) {
      throw new LlmServiceError(
        response.status,
        `LLM service returned ${response.status}: ${await response.text()}`,
      );
    }
    return response.json();
  }

  /** @inheritdoc */
  public async listProviders(): Promise<readonly LlmProvider[]> {
    const response = await fetchWithRetry(
      `${this.baseUrl}/providers`,
      { headers: this.headers() },
      { maxAttempts: this.maxAttempts, target: 'LLM service GET /providers', logger: this.logger },
    );
    if (!response.ok) {
      throw new Error(`LLM service returned ${response.status}: ${await response.text()}`);
    }
    const body = (await response.json()) as Array<Record<string, unknown>>;
    return body.map(mapProvider);
  }

  /** @inheritdoc */
  // Not retried: not in the reviewed safe set for this change (design.md D6
  // scopes retry to listed GETs + the documented side-effect-free test
  // endpoints only).
  public async setActiveProvider(slug: string): Promise<LlmProvider> {
    const response = await fetch(`${this.baseUrl}/providers/active`, {
      method: 'PUT',
      headers: this.headers(),
      body: JSON.stringify({ slug }),
    });
    if (!response.ok) {
      throw new Error(`LLM service returned ${response.status}: ${await response.text()}`);
    }
    const body = (await response.json()) as Record<string, unknown>;
    return mapProvider(body);
  }

  /** @inheritdoc */
  // Not retried: creates a new row; retrying after a lost response could
  // create a duplicate provider.
  public async createProvider(input: CreateLlmProviderInput): Promise<LlmProvider> {
    const body: Record<string, unknown> = {
      slug: input.slug,
      ...(input.name !== undefined ? { name: input.name } : {}),
      kind: input.kind,
      base_url: input.baseUrl,
      default_model: input.defaultModel,
    };
    if (input.apiKey !== undefined) {
      body['api_key'] = input.apiKey;
    }
    const created = await this.requestJson('/providers', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return mapProvider(created as Record<string, unknown>);
  }

  /** @inheritdoc */
  // Safe to retry: the llm-admin-ui spec requires this probe to never
  // activate the provider or touch the resolver cache — read-only.
  public async testProvider(slug: string): Promise<ProviderTestResult> {
    const body = (await this.requestJson(
      `/providers/${encodeURIComponent(slug)}/test`,
      { method: 'POST' },
      true,
    )) as Record<string, unknown>;
    return {
      ok: Boolean(body['ok']),
      detail: typeof body['detail'] === 'string' ? body['detail'] : null,
      elapsedMs: typeof body['elapsed_ms'] === 'number' ? body['elapsed_ms'] : null,
    };
  }

  /** @inheritdoc */
  public async testProviderConnection(
    input: TestLlmProviderConnectionInput,
  ): Promise<ProviderTestResult> {
    const body: Record<string, unknown> = {
      kind: input.kind,
      base_url: input.baseUrl,
      default_model: input.defaultModel,
    };
    if (input.providerSlug !== undefined) {
      body['provider_slug'] = input.providerSlug;
    }
    if (Object.hasOwn(input, 'apiKey')) {
      body['api_key'] = input.apiKey;
    }
    const response = (await this.requestJson('/providers/test', {
      method: 'POST',
      body: JSON.stringify(body),
    })) as Record<string, unknown>;
    return {
      ok: Boolean(response['ok']),
      detail: typeof response['detail'] === 'string' ? response['detail'] : null,
      elapsedMs: typeof response['elapsed_ms'] === 'number' ? response['elapsed_ms'] : null,
    };
  }

  /** @inheritdoc */
  public async listModels(slug: string): Promise<ModelList> {
    const body = (await this.requestJson(
      `/providers/${encodeURIComponent(slug)}/models`,
      {},
      true,
    )) as Record<string, unknown>;
    return {
      models: Array.isArray(body['models']) ? (body['models'] as string[]) : [],
      error: typeof body['error'] === 'string' ? body['error'] : null,
    };
  }

  /** @inheritdoc */
  // Not retried: a mutating PATCH not reviewed as safe for this change
  // (kept conservative rather than assuming every field-set is idempotent).
  public async updateProvider(slug: string, patch: UpdateLlmProviderInput): Promise<LlmProvider> {
    const body: Record<string, unknown> = {};
    if (patch.defaultModel !== undefined) {
      body['default_model'] = patch.defaultModel;
    }
    if (patch.name !== undefined) {
      body['name'] = patch.name;
    }
    if (patch.baseUrl !== undefined) {
      body['base_url'] = patch.baseUrl;
    }
    if (patch.pipelineOverrides !== undefined) {
      body['pipeline_overrides'] = patch.pipelineOverrides;
    }
    if (Object.hasOwn(patch, 'apiKey')) {
      body['api_key'] = patch.apiKey;
    }
    const updated = await this.requestJson(`/providers/${encodeURIComponent(slug)}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    return mapProvider(updated as Record<string, unknown>);
  }

  /** @inheritdoc */
  public async deleteProvider(slug: string): Promise<void> {
    // Not routed through requestJson: a 204 response has no body, and
    // calling response.json() on it throws. Not retried: a retry after a
    // lost 204 would see 404 (already deleted) and could misreport a
    // successful delete as "unknown slug".
    const response = await fetch(`${this.baseUrl}/providers/${encodeURIComponent(slug)}`, {
      method: 'DELETE',
      headers: this.headers(),
    });
    if (!response.ok) {
      throw new LlmServiceError(
        response.status,
        `LLM service returned ${response.status}: ${await response.text()}`,
      );
    }
  }
}
