/**
 * @module llm-admin.service.spec
 *
 * Unit tests for {@link LlmAdminService} using an in-memory client fake.
 */
import { beforeEach, describe, expect, it } from 'vitest';

import type { LlmProvider } from '../domain/llm-provider.model';
import type { LlmAdminClient } from '../application/ports/llm-client.port';
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
 * In-memory {@link LlmAdminClient} fake.
 */
class FakeLlmAdminClient implements LlmAdminClient {
  public providers: LlmProvider[] = [];
  public connectionOk = true;

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

  public testConnection(): Promise<boolean> {
    return Promise.resolve(this.connectionOk);
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

  it('reports connection test results', async () => {
    client.connectionOk = false;

    await expect(service.testConnection()).resolves.toBe(false);
  });
});
