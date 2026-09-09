/**
 * @module route.spec
 *
 * Proves the shell `/api` proxy's correlation-id handling and that catch-all
 * paths are forwarded to the gateway. A well-formed incoming id is forwarded
 * verbatim, while a missing or malformed one is replaced with a freshly
 * minted id rather than trusted into the outbound header.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GET, POST } from './route';

const CORRELATION_ID_HEADER = 'x-correlation-id';

function contextFor(path: string[]): { params: Promise<{ path: string[] }> } {
  return { params: Promise.resolve({ path }) };
}

describe('/api proxy correlation-id handling', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('forwards a well-formed incoming correlation id verbatim', async () => {
    const request = new Request('http://localhost/api/health', {
      headers: { [CORRELATION_ID_HEADER]: 'abc-123_XYZ' },
    });

    await GET(request, contextFor(['health']));

    const forwardedHeaders = fetchMock.mock.calls[0]?.[1]?.headers as Record<string, string>;
    expect(forwardedHeaders[CORRELATION_ID_HEADER]).toBe('abc-123_XYZ');
  });

  it('mints a fresh id when the incoming header is malformed', async () => {
    const request = new Request('http://localhost/api/health', {
      headers: { [CORRELATION_ID_HEADER]: 'not a; safe=id' },
    });

    await GET(request, contextFor(['health']));

    const forwardedHeaders = fetchMock.mock.calls[0]?.[1]?.headers as Record<string, string>;
    expect(forwardedHeaders[CORRELATION_ID_HEADER]).not.toBe('not a; safe=id');
    expect(forwardedHeaders[CORRELATION_ID_HEADER]).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('mints a fresh id when no header is present', async () => {
    const request = new Request('http://localhost/api/health');

    await GET(request, contextFor(['health']));

    const forwardedHeaders = fetchMock.mock.calls[0]?.[1]?.headers as Record<string, string>;
    expect(forwardedHeaders[CORRELATION_ID_HEADER]).toMatch(/^[0-9a-f-]{36}$/);
  });
});

describe('/api proxy X-Forwarded-For handling', () => {
  const FORWARDED_FOR_HEADER = 'x-forwarded-for';
  let fetchMock: ReturnType<typeof vi.fn>;
  let originalTrustProxyHeaders: string | undefined;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    originalTrustProxyHeaders = process.env['TRUST_PROXY_HEADERS'];
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    if (originalTrustProxyHeaders === undefined) {
      delete process.env['TRUST_PROXY_HEADERS'];
    } else {
      process.env['TRUST_PROXY_HEADERS'] = originalTrustProxyHeaders;
    }
  });

  it('does not forward X-Forwarded-For when TRUST_PROXY_HEADERS is unset', async () => {
    delete process.env['TRUST_PROXY_HEADERS'];
    const request = new Request('http://localhost/api/health', {
      headers: { [FORWARDED_FOR_HEADER]: '203.0.113.5' },
    });

    await GET(request, contextFor(['health']));

    const forwardedHeaders = fetchMock.mock.calls[0]?.[1]?.headers as Record<string, string>;
    expect(forwardedHeaders[FORWARDED_FOR_HEADER]).toBeUndefined();
  });

  it('forwards X-Forwarded-For verbatim when TRUST_PROXY_HEADERS is true', async () => {
    process.env['TRUST_PROXY_HEADERS'] = 'true';
    const request = new Request('http://localhost/api/health', {
      headers: { [FORWARDED_FOR_HEADER]: '203.0.113.5' },
    });

    await GET(request, contextFor(['health']));

    const forwardedHeaders = fetchMock.mock.calls[0]?.[1]?.headers as Record<string, string>;
    expect(forwardedHeaders[FORWARDED_FOR_HEADER]).toBe('203.0.113.5');
  });

  it('omits X-Forwarded-For when trusted but the header is absent', async () => {
    process.env['TRUST_PROXY_HEADERS'] = 'true';
    const request = new Request('http://localhost/api/health');

    await GET(request, contextFor(['health']));

    const forwardedHeaders = fetchMock.mock.calls[0]?.[1]?.headers as Record<string, string>;
    expect(forwardedHeaders[FORWARDED_FOR_HEADER]).toBeUndefined();
  });
});

describe('/api proxy gateway targeting', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('forwards the catch-all path and query to the gateway /v1 prefix', async () => {
    const request = new Request('http://localhost:3100/api/jobs?limit=20&offset=0');

    await GET(request, contextFor(['jobs']));

    expect(fetchMock.mock.calls[0]?.[0]).toBe('http://localhost:4000/v1/jobs?limit=20&offset=0');
  });

  it('forwards nested paths used by settings and reactions', async () => {
    const request = new Request('http://localhost:3100/api/llm/providers/active');

    await GET(request, contextFor(['llm', 'providers', 'active']));

    expect(fetchMock.mock.calls[0]?.[0]).toBe('http://localhost:4000/v1/llm/providers/active');
  });

  it('forwards a JSON POST body to the gateway', async () => {
    const request = new Request('http://localhost:3100/api/reactions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jobId: '1', kind: 'saved' }),
    });

    await POST(request, contextFor(['reactions']));

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(fetchMock.mock.calls[0]?.[0]).toBe('http://localhost:4000/v1/reactions');
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({ 'Content-Type': 'application/json' });
    expect(init.body).toBeInstanceOf(ArrayBuffer);
  });

  it('returns 502 JSON when the gateway is unreachable', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'));
    const request = new Request('http://localhost:3100/api/jobs');

    const response = await GET(request, contextFor(['jobs']));

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ message: 'API gateway unreachable' });
  });
});
