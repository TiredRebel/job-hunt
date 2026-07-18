/**
 * @module llm-admin.service.spec
 *
 * Unit tests for {@link LlmAdminService} using an in-memory client fake.
 */
import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';

import type { LlmProvider } from '../domain/llm-provider.model';
import {
  LlmServiceError,
  type CreateLlmProviderInput,
  type LlmAdminClient,
  type ModelList,
  type ProviderTestResult,
  type UpdateLlmProviderInput,
} from '../application/ports/llm-client.port';
import { LlmAdminService } from './llm-admin.service';

/**
 * Build a provider fixture with sensible defaults.
 *
 * @param overrides - Fields to override.
 * @returns Provider fixture.
 */
function makeProvider(overrides: Partial<LlmProvider> = {}): LlmProvider {
  return {
    id: 1,
    slug: 'ollama-local',
    kind: 'ollama',
    baseUrl: 'http://localhost:11434',
    defaultModel: 'qwen3:8b',
    apiKeyEnv: null,
    pipelineOverrides: {},
    isActive: true,
    params: {},
    createdAt: new Date('2026-07-01T00:00:00Z'),
    updatedAt: new Date('2026-07-01T00:00:00Z'),
    ...overrides,
  };
}

/**
 * In-memory {@link LlmAdminClient} fake. Set {@link nextError} to make the
 * next call reject with a specific error (e.g. an {@link LlmServiceError}
 * carrying a status), exercising the service's error-mapping logic.
 */
class FakeLlmAdminClient implements LlmAdminClient {
  public providers: LlmProvider[] = [];
  public nextError: Error | null = null;

  public listProviders(): Promise<readonly LlmProvider[]> {
    return Promise.resolve(this.providers);
  }

  public setActiveProvider(slug: string): Promise<LlmProvider> {
    const target = this.providers.find((provider) => provider.slug === slug);
    if (target === undefined) {
      return Promise.reject(new Error(`Provider ${slug} not found`));
    }
    this.providers = this.providers.map((provider) =>
      makeProvider({ ...provider, isActive: provider.slug === slug }),
    );
    return Promise.resolve(
      this.providers.find((provider) => provider.slug === slug) as LlmProvider,
    );
  }

  public createProvider(input: CreateLlmProviderInput): Promise<LlmProvider> {
    if (this.nextError !== null) {
      return Promise.reject(this.nextError);
    }
    const created = makeProvider({
      id: this.providers.length + 1,
      slug: input.slug,
      kind: input.kind,
      baseUrl: input.baseUrl,
      defaultModel: input.defaultModel,
      apiKeyEnv: input.apiKeyEnv ?? null,
      isActive: false,
    });
    this.providers.push(created);
    return Promise.resolve(created);
  }

  public testProvider(): Promise<ProviderTestResult> {
    if (this.nextError !== null) {
      return Promise.reject(this.nextError);
    }
    return Promise.resolve({ ok: true, detail: null, elapsedMs: 12 });
  }

  public listModels(): Promise<ModelList> {
    if (this.nextError !== null) {
      return Promise.reject(this.nextError);
    }
    return Promise.resolve({ models: ['model-a', 'model-b'], error: null });
  }

  public updateProvider(slug: string, patch: UpdateLlmProviderInput): Promise<LlmProvider> {
    if (this.nextError !== null) {
      return Promise.reject(this.nextError);
    }
    const target = this.providers.find((provider) => provider.slug === slug);
    if (target === undefined) {
      return Promise.reject(new LlmServiceError(404, `no provider with slug '${slug}'`));
    }
    const updated = makeProvider({
      ...target,
      ...(patch.defaultModel !== undefined ? { defaultModel: patch.defaultModel } : {}),
      ...(patch.baseUrl !== undefined ? { baseUrl: patch.baseUrl } : {}),
      ...(Object.hasOwn(patch, 'apiKeyEnv') ? { apiKeyEnv: patch.apiKeyEnv } : {}),
      ...(patch.pipelineOverrides !== undefined
        ? { pipelineOverrides: patch.pipelineOverrides }
        : {}),
    });
    this.providers = this.providers.map((provider) =>
      provider.slug === slug ? updated : provider,
    );
    return Promise.resolve(updated);
  }

  public deleteProvider(slug: string): Promise<void> {
    if (this.nextError !== null) {
      return Promise.reject(this.nextError);
    }
    const target = this.providers.find((provider) => provider.slug === slug);
    if (target === undefined) {
      return Promise.reject(new LlmServiceError(404, `no provider with slug '${slug}'`));
    }
    if (target.isActive) {
      return Promise.reject(new LlmServiceError(409, 'cannot delete the active provider'));
    }
    this.providers = this.providers.filter((provider) => provider.slug !== slug);
    return Promise.resolve();
  }
}

describe('LlmAdminService', () => {
  let client: FakeLlmAdminClient;
  let service: LlmAdminService;

  beforeEach(() => {
    client = new FakeLlmAdminClient();
    service = new LlmAdminService(client);
  });

  it('lists providers', async () => {
    client.providers = [makeProvider(), makeProvider({ id: 2, slug: 'cloud', isActive: false })];

    const providers = await service.listProviders();

    expect(providers).toHaveLength(2);
  });

  it('switches the active provider', async () => {
    client.providers = [
      makeProvider(),
      makeProvider({ id: 2, slug: 'cloud', kind: 'openai-compatible', isActive: false }),
    ];

    const active = await service.setActiveProvider('cloud');

    expect(active.slug).toBe('cloud');
    expect(active.isActive).toBe(true);
    expect(client.providers.filter((provider) => provider.isActive)).toHaveLength(1);
  });

  it('propagates client errors on unknown provider', async () => {
    await expect(service.setActiveProvider('nope')).rejects.toThrow('Provider nope not found');
  });

  it('creates a provider (pass-through)', async () => {
    const created = await service.createProvider({
      slug: 'openrouter',
      kind: 'openai-compatible',
      baseUrl: 'https://openrouter.ai/api/v1',
      defaultModel: 'qwen/qwen3-14b',
      apiKeyEnv: 'OPENROUTER_API_KEY',
    });

    expect(created.slug).toBe('openrouter');
    expect(created.isActive).toBe(false);
  });

  it('maps a 409 from create to ConflictException', async () => {
    client.nextError = new LlmServiceError(409, "provider 'openrouter' already exists");

    await expect(
      service.createProvider({
        slug: 'openrouter',
        kind: 'openai-compatible',
        baseUrl: 'https://openrouter.ai/api/v1',
        defaultModel: 'qwen/qwen3-14b',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('tests a provider (pass-through)', async () => {
    const result = await service.testProvider('ollama-local');

    expect(result).toEqual({ ok: true, detail: null, elapsedMs: 12 });
  });

  it('maps a 404 from test to NotFoundException', async () => {
    client.nextError = new LlmServiceError(404, "no provider with slug 'nope'");

    await expect(service.testProvider('nope')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('maps a transport failure from test to BadGatewayException', async () => {
    client.nextError = new Error('fetch failed');

    await expect(service.testProvider('ollama-local')).rejects.toBeInstanceOf(BadGatewayException);
  });

  it('lists models (pass-through)', async () => {
    const result = await service.listModels('ollama-local');

    expect(result.models).toEqual(['model-a', 'model-b']);
  });

  it('maps a 404 from listModels to NotFoundException', async () => {
    client.nextError = new LlmServiceError(404, "no provider with slug 'nope'");

    await expect(service.listModels('nope')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates a provider (pass-through)', async () => {
    client.providers = [makeProvider()];

    const updated = await service.updateProvider('ollama-local', { defaultModel: 'qwen3:32b' });

    expect(updated.defaultModel).toBe('qwen3:32b');
  });

  it('clears apiKeyEnv via explicit null', async () => {
    client.providers = [makeProvider({ slug: 'openrouter', apiKeyEnv: 'OLD_KEY' })];

    const updated = await service.updateProvider('openrouter', { apiKeyEnv: null });

    expect(updated.apiKeyEnv).toBeNull();
  });

  it('leaves apiKeyEnv untouched when omitted', async () => {
    client.providers = [makeProvider({ slug: 'openrouter', apiKeyEnv: 'OLD_KEY' })];

    const updated = await service.updateProvider('openrouter', { defaultModel: 'gpt-4o' });

    expect(updated.apiKeyEnv).toBe('OLD_KEY');
  });

  it('maps a 404 from update to NotFoundException', async () => {
    await expect(service.updateProvider('nope', { defaultModel: 'x' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('maps a 422 from update to BadRequestException', async () => {
    client.providers = [makeProvider()];
    client.nextError = new LlmServiceError(422, 'temperature out of range');

    await expect(
      service.updateProvider('ollama-local', { pipelineOverrides: { match: { temperature: 5 } } }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('deletes a non-active provider (pass-through)', async () => {
    client.providers = [
      makeProvider(),
      makeProvider({ id: 2, slug: 'openrouter', isActive: false }),
    ];

    await service.deleteProvider('openrouter');

    expect(client.providers.some((provider) => provider.slug === 'openrouter')).toBe(false);
  });

  it('maps a 404 from delete to NotFoundException', async () => {
    await expect(service.deleteProvider('nope')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('maps a 409 from delete (active provider) to ConflictException with a delete-specific message', async () => {
    client.providers = [makeProvider()];

    await expect(service.deleteProvider('ollama-local')).rejects.toThrow(
      "Cannot delete the active provider 'ollama-local'",
    );
  });
});
