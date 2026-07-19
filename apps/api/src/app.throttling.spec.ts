/**
 * @module app.throttling.spec
 *
 * Proves the rate-limiting contract (api-rate-limiting spec, design.md D5
 * in openspec/changes/phase-7-hardening) end to end against a real,
 * ephemeral-port Nest HTTP server: a public route is throttled after its
 * configured limit, and an `@SkipThrottle()` route never is. Uses plain
 * `fetch` rather than a supertest dependency this repo doesn't have.
 */
import type { AddressInfo } from 'node:net';

import type { INestApplication } from '@nestjs/common';
import { Controller, Get, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { NestFactory } from '@nestjs/core';
import { SkipThrottle, ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

/** Public controller: subject to the global throttler. */
@Controller('public')
class PublicController {
  /**
   * Trivial handler — only its throttling behavior is under test.
   *
   * @returns A static ok payload.
   */
  @Get()
  public get(): { ok: true } {
    return { ok: true };
  }
}

/** Internal-token-style controller: exempt from throttling. */
@SkipThrottle()
@Controller('internal')
class InternalController {
  /**
   * Trivial handler — only its exemption from throttling is under test.
   *
   * @returns A static ok payload.
   */
  @Get()
  public get(): { ok: true } {
    return { ok: true };
  }
}

const LIMIT = 2;

@Module({
  imports: [ThrottlerModule.forRoot([{ ttl: 60_000, limit: LIMIT }])],
  controllers: [PublicController, InternalController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
class ThrottlingTestModule {}

describe('rate limiting', () => {
  let app: INestApplication;
  let baseUrl: string;

  beforeEach(async () => {
    app = await NestFactory.create(ThrottlingTestModule, { logger: false });
    await app.listen(0);
    const server = app.getHttpServer() as import('node:net').Server;
    const address = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterEach(async () => {
    await app.close();
  });

  it('serves requests within the configured limit', async () => {
    const first = await fetch(`${baseUrl}/public`);
    const second = await fetch(`${baseUrl}/public`);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
  });

  it('throttles a public route once the limit is exceeded', async () => {
    for (let i = 0; i < LIMIT; i += 1) {
      const response = await fetch(`${baseUrl}/public`);
      expect(response.status).toBe(200);
    }

    const overLimit = await fetch(`${baseUrl}/public`);

    expect(overLimit.status).toBe(429);
  });

  it('never throttles a @SkipThrottle() route, even past the public limit', async () => {
    for (let i = 0; i < LIMIT + 3; i += 1) {
      const response = await fetch(`${baseUrl}/internal`);
      expect(response.status).toBe(200);
    }
  });
});
