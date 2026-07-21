import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createLlmProvider,
  deleteLlmProvider,
  listLlmModels,
  testLlmProviderConnection,
  testLlmProvider,
  updateLlmProvider,
} from './llm';

vi.mock('@/lib/env', () => ({
  getApiBaseUrl: () => 'http://localhost:4000/v1',
}));

const PROVIDER_BODY = {
  slug: 'openrouter',
  kind: 'openai-compatible',
  baseUrl: 'https://openrouter.ai/api/v1',
  defaultModel: 'qwen/qwen3-14b',
  apiKeyEnv: 'OPENROUTER_API_KEY',
  pipelineOverrides: {},
  isActive: false,
};

describe('createLlmProvider', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('POSTs the new provider and returns it', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(PROVIDER_BODY), { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await createLlmProvider({
      slug: 'openrouter',
      kind: 'openai-compatible',
      baseUrl: 'https://openrouter.ai/api/v1',
      defaultModel: 'qwen/qwen3-14b',
      apiKeyEnv: 'OPENROUTER_API_KEY',
    });

    expect(result).toEqual(PROVIDER_BODY);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:4000/v1/llm/providers',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('propagates ApiError on a duplicate slug (409)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: "Provider slug 'openrouter' already exists" }), {
        status: 409,
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      createLlmProvider({
        slug: 'openrouter',
        kind: 'openai-compatible',
        baseUrl: 'https://openrouter.ai/api/v1',
        defaultModel: 'qwen/qwen3-14b',
      }),
    ).rejects.toMatchObject({ status: 409 });
  });
});

describe('testLlmProvider', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('POSTs to the per-slug test endpoint and returns the outcome', async () => {
    const body = { ok: true, detail: null, elapsedMs: 42 };
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(body), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await testLlmProvider('ollama-local');

    expect(result).toEqual(body);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:4000/v1/llm/providers/ollama-local/test',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('propagates ApiError when the slug is unknown (404)', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ message: 'not found' }), { status: 404 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(testLlmProvider('nope')).rejects.toMatchObject({ status: 404 });
  });
});

describe('testLlmProviderConnection', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('POSTs unsaved draft fields without naming a saved provider', async () => {
    const body = { ok: true, detail: null, elapsedMs: 42 };
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(body), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await testLlmProviderConnection({
      kind: 'ollama',
      baseUrl: 'https://ollama.com',
      defaultModel: 'glm-5.2',
      apiKeyEnv: 'OLLAMA_API_KEY',
    });

    expect(result).toEqual(body);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:4000/v1/llm/providers/test',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          kind: 'ollama',
          baseUrl: 'https://ollama.com',
          defaultModel: 'glm-5.2',
          apiKeyEnv: 'OLLAMA_API_KEY',
        }),
      }),
    );
  });
});

describe('listLlmModels', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('GETs the models endpoint and returns the list', async () => {
    const body = { models: ['qwen3:14b', 'llama3'], error: null };
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(body), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await listLlmModels('ollama-local');

    expect(result).toEqual(body);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:4000/v1/llm/providers/ollama-local/models',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('resolves (not rejects) with an error detail when the provider reports a failure', async () => {
    const body = { models: [], error: "environment variable 'X' is not set" };
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(body), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await listLlmModels('openrouter');

    expect(result.models).toEqual([]);
    expect(result.error).toBe("environment variable 'X' is not set");
  });
});

describe('updateLlmProvider', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('PATCHes the changed fields and returns the updated provider', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ...PROVIDER_BODY, defaultModel: 'qwen/qwen3-32b' }), {
        status: 200,
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await updateLlmProvider('openrouter', { defaultModel: 'qwen/qwen3-32b' });

    expect(result.defaultModel).toBe('qwen/qwen3-32b');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:4000/v1/llm/providers/openrouter',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ defaultModel: 'qwen/qwen3-32b' }),
      }),
    );
  });

  it('sends an explicit null to clear apiKeyEnv', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ ...PROVIDER_BODY, apiKeyEnv: null }), { status: 200 }),
      );
    vi.stubGlobal('fetch', fetchMock);

    await updateLlmProvider('openrouter', { apiKeyEnv: null });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:4000/v1/llm/providers/openrouter',
      expect.objectContaining({ body: JSON.stringify({ apiKeyEnv: null }) }),
    );
  });

  it('propagates ApiError when the provider is unknown (404)', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ message: 'not found' }), { status: 404 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(updateLlmProvider('nope', { defaultModel: 'x' })).rejects.toMatchObject({
      status: 404,
    });
  });
});

describe('deleteLlmProvider', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('DELETEs the provider and resolves on a 204 with no body', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(deleteLlmProvider('openrouter')).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:4000/v1/llm/providers/openrouter',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('propagates ApiError when the provider is active (409)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ message: "Cannot delete the active provider 'ollama-local'" }),
        {
          status: 409,
        },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(deleteLlmProvider('ollama-local')).rejects.toMatchObject({ status: 409 });
  });

  it('propagates ApiError when the slug is unknown (404)', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ message: 'not found' }), { status: 404 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(deleteLlmProvider('nope')).rejects.toMatchObject({ status: 404 });
  });
});
