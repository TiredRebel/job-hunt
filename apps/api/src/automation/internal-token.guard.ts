/**
 * @module internal-token.guard
 *
 * Guards the automation surface (n8n → gateway calls) with the same shared
 * secret the gateway already sends to the scraper/llm services
 * (`INTERNAL_API_TOKEN` / `X-Internal-Token`), rather than introducing a
 * second secret.
 */
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'node:crypto';

import type { ApiConfig } from '../config/api-config';

/**
 * Constant-time string comparison (equal-length requirement enforced first
 * so unequal lengths don't leak via a thrown exception timing difference).
 *
 * @param a - First value.
 * @param b - Second value.
 * @returns Whether the two values are equal.
 */
function constantTimeEquals(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

/**
 * Rejects requests missing a valid `X-Internal-Token` header.
 */
@Injectable()
export class InternalTokenGuard implements CanActivate {
  /**
   * Rejects requests missing a valid `X-Internal-Token` header.
   *
   * @param config - NestJS config service.
   */
  public constructor(private readonly config: ConfigService) {}

  /** @inheritdoc */
  public canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<{ headers: Record<string, string | string[] | undefined> }>();
    const expected = this.config.get<ApiConfig['INTERNAL_API_TOKEN']>('api.INTERNAL_API_TOKEN');
    const provided = request.headers['x-internal-token'];
    if (!expected || typeof provided !== 'string' || !constantTimeEquals(provided, expected)) {
      throw new UnauthorizedException();
    }
    return true;
  }
}
