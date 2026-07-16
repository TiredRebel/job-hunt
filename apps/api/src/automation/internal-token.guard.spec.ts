/**
 * @module internal-token.guard.spec
 *
 * Unit tests for {@link InternalTokenGuard}.
 */
import type { ExecutionContext } from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { describe, expect, it } from 'vitest';

import { InternalTokenGuard } from './internal-token.guard';

function makeContext(headers: Record<string, string>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ headers }),
    }),
  } as unknown as ExecutionContext;
}

function makeConfig(token: string | undefined): ConfigService {
  return { get: () => token } as unknown as ConfigService;
}

describe('InternalTokenGuard', () => {
  it('allows a request with the correct token', () => {
    const guard = new InternalTokenGuard(makeConfig('secret-token-value'));

    expect(guard.canActivate(makeContext({ 'x-internal-token': 'secret-token-value' }))).toBe(true);
  });

  it('rejects a request with a missing token header', () => {
    const guard = new InternalTokenGuard(makeConfig('secret-token-value'));

    expect(() => guard.canActivate(makeContext({}))).toThrow(UnauthorizedException);
  });

  it('rejects a request with a wrong token', () => {
    const guard = new InternalTokenGuard(makeConfig('secret-token-value'));

    expect(() => guard.canActivate(makeContext({ 'x-internal-token': 'wrong' }))).toThrow(
      UnauthorizedException,
    );
  });

  it('rejects when INTERNAL_API_TOKEN is not configured', () => {
    const guard = new InternalTokenGuard(makeConfig(undefined));

    expect(() => guard.canActivate(makeContext({ 'x-internal-token': 'anything' }))).toThrow(
      UnauthorizedException,
    );
  });

  it('rejects tokens of a different length', () => {
    const guard = new InternalTokenGuard(makeConfig('short'));

    expect(() =>
      guard.canActivate(makeContext({ 'x-internal-token': 'a-much-longer-token-value' })),
    ).toThrow(UnauthorizedException);
  });
});
