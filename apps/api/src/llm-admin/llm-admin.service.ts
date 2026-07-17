/**
 * @module llm-admin.service
 *
 * Application service for LLM provider administration. Proxies calls to the
 * LLM service via the outbound port, mapping transport-level failures to the
 * appropriate NestJS exception.
 */
import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { LlmProvider } from '../domain/llm-provider.model';
import {
  LLM_ADMIN_CLIENT,
  LlmServiceError,
  type CreateLlmProviderInput,
  type LlmAdminClient,
  type ModelList,
  type ProviderTestResult,
  type UpdateLlmProviderInput,
} from '../application/ports/llm-client.port';
import type { UpdateLlmProviderDto } from './llm-admin.dto';

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
   * Map a client-layer failure to the appropriate NestJS exception. Only
   * `LlmServiceError` carries a real status; anything else (network failure,
   * misconfiguration) means the LLM service itself is unreachable.
   *
   * @param error - The caught error.
   * @param slug - Provider slug, for a domain-specific 404/409 message.
   * @throws NotFoundException, ConflictException, BadRequestException, or BadGatewayException.
   */
  private raiseFor(error: unknown, slug: string): never {
    if (error instanceof LlmServiceError) {
      if (error.status === 404) {
        throw new NotFoundException(`Provider ${slug} not found`);
      }
      if (error.status === 409) {
        throw new ConflictException(`Provider slug '${slug}' already exists`);
      }
      if (error.status === 400 || error.status === 422) {
        throw new BadRequestException(error.message);
      }
    }
    throw new BadGatewayException(
      error instanceof Error ? error.message : 'LLM service unreachable',
    );
  }

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
   * Register a new provider row. Always created inactive.
   *
   * @param input - New provider fields.
   * @throws ConflictException when the slug already exists.
   */
  public async createProvider(input: CreateLlmProviderInput): Promise<LlmProvider> {
    try {
      return await this.client.createProvider(input);
    } catch (error) {
      this.raiseFor(error, input.slug);
    }
  }

  /**
   * Probe one provider's real backend, without touching the active row.
   *
   * @param slug - Provider slug.
   * @throws NotFoundException when the slug is unknown.
   */
  public async testProvider(slug: string): Promise<ProviderTestResult> {
    try {
      return await this.client.testProvider(slug);
    } catch (error) {
      this.raiseFor(error, slug);
    }
  }

  /**
   * List models the provider currently reports, without switching to it.
   *
   * @param slug - Provider slug.
   * @throws NotFoundException when the slug is unknown.
   */
  public async listModels(slug: string): Promise<ModelList> {
    try {
      return await this.client.listModels(slug);
    } catch (error) {
      this.raiseFor(error, slug);
    }
  }

  /**
   * Update editable fields (default model, overrides, base URL, key env).
   *
   * @param slug - Provider slug.
   * @param patch - Fields to change; `apiKeyEnv` presence (vs. absence)
   *   distinguishes an explicit clear from "leave untouched".
   * @throws NotFoundException when the slug is unknown.
   */
  public async updateProvider(slug: string, patch: UpdateLlmProviderDto): Promise<LlmProvider> {
    const input: UpdateLlmProviderInput = {
      ...(patch.defaultModel !== undefined ? { defaultModel: patch.defaultModel } : {}),
      ...(patch.baseUrl !== undefined ? { baseUrl: patch.baseUrl } : {}),
      ...(patch.pipelineOverrides !== undefined
        ? { pipelineOverrides: patch.pipelineOverrides }
        : {}),
      ...(Object.hasOwn(patch, 'apiKeyEnv') ? { apiKeyEnv: patch.apiKeyEnv } : {}),
    };
    try {
      return await this.client.updateProvider(slug, input);
    } catch (error) {
      this.raiseFor(error, slug);
    }
  }
}
