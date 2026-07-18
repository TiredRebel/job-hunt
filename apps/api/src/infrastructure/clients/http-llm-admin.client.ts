/**
 * @module http-llm-admin.client
 *
 * HTTP implementation of {@link LlmAdminClient}. Proxies provider list,
 * create, active-provider switch, per-provider test, model listing, and
 * configuration to the LLM service.
 */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { ApiConfig } from '../../config/api-config';
import type { LlmProvider } from '../../domain/llm-provider.model';
import {
  LlmServiceError,
  type CreateLlmProviderInput,
  type LlmAdminClient,
  type ModelList,
  type ProviderTestResult,
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
    kind: String(body['kind']) as LlmProvider['kind'],
    baseUrl: typeof body['base_url'] === 'string' ? body['base_url'] : null,
    defaultModel: String(body['default_model']),
    apiKeyEnv: typeof body['api_key_env'] === 'string' ? body['api_key_env'] : null,
    pipelineOverrides:
      typeof body['pipeline_overrides'] === 'object' && body['pipeline_overrides'] !== null
        ? (body['pipeline_overrides'] as Record<string, unknown>)
        : {},
    isActive: Boolean(body['is_active']),
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
   */
  public constructor(private readonly config: ConfigService) {}

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
    return {
      'Content-Type': 'application/json',
      'X-Internal-Token': this.token,
    };
  }

  /**
   * Perform a request against the LLM service and return the parsed JSON
   * body, converting any non-2xx response into an {@link LlmServiceError}
   * that carries the real status for the service layer to map.
   *
   * @param path - Path relative to the LLM service base URL.
   * @param init - Method and body; headers are added here.
   * @returns The parsed JSON response body.
   * @throws LlmServiceError on a non-2xx response.
   */
  private async requestJson(
    path: string,
    init: Omit<RequestInit, 'headers'> = {},
  ): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}${path}`, { ...init, headers: this.headers() });
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
    const response = await fetch(`${this.baseUrl}/providers`, {
      headers: this.headers(),
    });
    if (!response.ok) {
      throw new Error(`LLM service returned ${response.status}: ${await response.text()}`);
    }
    const body = (await response.json()) as Array<Record<string, unknown>>;
    return body.map(mapProvider);
  }

  /** @inheritdoc */
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
  public async createProvider(input: CreateLlmProviderInput): Promise<LlmProvider> {
    const body: Record<string, unknown> = {
      slug: input.slug,
      kind: input.kind,
      base_url: input.baseUrl,
      default_model: input.defaultModel,
    };
    if (input.apiKeyEnv !== undefined) {
      body['api_key_env'] = input.apiKeyEnv;
    }
    const created = await this.requestJson('/providers', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return mapProvider(created as Record<string, unknown>);
  }

  /** @inheritdoc */
  public async testProvider(slug: string): Promise<ProviderTestResult> {
    const body = (await this.requestJson(`/providers/${encodeURIComponent(slug)}/test`, {
      method: 'POST',
    })) as Record<string, unknown>;
    return {
      ok: Boolean(body['ok']),
      detail: typeof body['detail'] === 'string' ? body['detail'] : null,
      elapsedMs: typeof body['elapsed_ms'] === 'number' ? body['elapsed_ms'] : null,
    };
  }

  /** @inheritdoc */
  public async listModels(slug: string): Promise<ModelList> {
    const body = (await this.requestJson(
      `/providers/${encodeURIComponent(slug)}/models`,
    )) as Record<string, unknown>;
    return {
      models: Array.isArray(body['models']) ? (body['models'] as string[]) : [],
      error: typeof body['error'] === 'string' ? body['error'] : null,
    };
  }

  /** @inheritdoc */
  public async updateProvider(slug: string, patch: UpdateLlmProviderInput): Promise<LlmProvider> {
    const body: Record<string, unknown> = {};
    if (patch.defaultModel !== undefined) {
      body['default_model'] = patch.defaultModel;
    }
    if (patch.baseUrl !== undefined) {
      body['base_url'] = patch.baseUrl;
    }
    if (patch.pipelineOverrides !== undefined) {
      body['pipeline_overrides'] = patch.pipelineOverrides;
    }
    if (Object.hasOwn(patch, 'apiKeyEnv')) {
      body['api_key_env'] = patch.apiKeyEnv;
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
    // calling response.json() on it throws.
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
