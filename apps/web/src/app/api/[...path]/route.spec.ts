/**
 * @module route.spec
 *
 * Proves the `/api` proxy's correlation-id handling: a well-formed incoming
 * id is forwarded verbatim, while a missing or malformed one is replaced
 * with a freshly minted id rather than trusted into the outbound header.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GET } from './route';

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
