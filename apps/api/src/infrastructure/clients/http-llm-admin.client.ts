/**
 * @module http-llm-admin.client
 *
 * HTTP implementation of {@link LlmAdminClient}. Proxies provider list,
 * active-provider switch, and connection test to the LLM service.
 */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { ApiConfig } from '../../config/api-config';
import type { LlmProvider } from '../../domain/llm-provider.model';
import type { LlmAdminClient } from '../../application/ports/llm-client.port';

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
  public async testConnection(): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/health`, {
      headers: this.headers(),
    });
    return response.ok;
  }
}
