/**
 * @module http-scraper.client.spec
 *
 * Proves the correlation-id propagation contract (design D2 in
 * openspec/changes/phase-7-hardening): a value seeded in the request's CLS
 * store reaches the outbound `X-Correlation-Id` header on a downstream call.
 */
import { AsyncLocalStorage } from 'node:async_hooks';

import type { ConfigService } from '@nestjs/config';
import { ClsService } from 'nestjs-cls';
import type { Logger } from 'nestjs-pino';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CORRELATION_ID_HEADER, type AppClsStore } from '../logger/correlation-id';
import { HttpScraperClient } from './http-scraper.client';

const CONFIG_VALUES: Record<string, string> = {
  'api.SCRAPER_BASE_URL': 'http://scraper.local',
  'api.INTERNAL_API_TOKEN': 'a-test-token-that-is-long-enough',
};

/** Minimal `ConfigService`-shaped fake — only `.get` is used by the client. */
function fakeConfigService(): ConfigService {
  return { get: (key: string) => CONFIG_VALUES[key] } as unknown as ConfigService;
}

function newCls(): ClsService<AppClsStore> {
  return new ClsService<AppClsStore>(new AsyncLocalStorage());
}

/** Minimal `Logger`-shaped fake — retry warnings are not under test here. */
function fakeLogger(): Logger {
  return { warn: () => undefined } as unknown as Logger;
}

describe('HttpScraperClient correlation-id propagation', () => {
  let capturedHeaders: Record<string, string> | undefined;

  beforeEach(() => {
    capturedHeaders = undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init?: RequestInit) => {
        capturedHeaders = init?.headers as Record<string, string> | undefined;
        return Promise.resolve(new Response(JSON.stringify({ slugs: [] }), { status: 200 }));
      }),
    );
  });

  it('forwards the CLS-seeded correlation id on an outbound call', async () => {
    const cls = newCls();
    const client = new HttpScraperClient(fakeConfigService(), cls, fakeLogger());

    await cls.runWith({ correlationId: 'test-correlation-xyz' } as AppClsStore, async () => {
      await client.listAdapters();
    });

    expect(capturedHeaders?.[CORRELATION_ID_HEADER]).toBe('test-correlation-xyz');
  });

  it('omits the header when no correlation id is bound', async () => {
    const cls = newCls();
    const client = new HttpScraperClient(fakeConfigService(), cls, fakeLogger());

    await client.listAdapters();

    expect(capturedHeaders?.[CORRELATION_ID_HEADER]).toBeUndefined();
  });
});
