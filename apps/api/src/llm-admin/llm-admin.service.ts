/**
 * @module llm-admin.service
 *
 * Application service for LLM provider administration. Proxies calls to the
 * LLM service via the outbound port.
 */
import { Inject, Injectable } from '@nestjs/common';

import type { LlmProvider } from '../domain/llm-provider.model';
import { LLM_ADMIN_CLIENT, type LlmAdminClient } from '../application/ports/llm-client.port';

/**
 * Application service for LLM administration.
 */
@Injectable()
export class LlmAdminService {
  /**
   * Application service for LLM administration.
   *
   * @param client - LLM administration client port.
   */
  public constructor(
    @Inject(LLM_ADMIN_CLIENT)
    private readonly client: LlmAdminClient,
  ) {}

  /**
   * List registered LLM providers.
   */
  public async listProviders(): Promise<readonly LlmProvider[]> {
    return this.client.listProviders();
  }

  /**
   * Switch the active provider.
   *
   * @param slug - Provider slug.
   */
  public async setActiveProvider(slug: string): Promise<LlmProvider> {
    return this.client.setActiveProvider(slug);
  }

  /**
   * Test connection to the active provider.
   */
  public async testConnection(): Promise<boolean> {
    return this.client.testConnection();
  }
}
