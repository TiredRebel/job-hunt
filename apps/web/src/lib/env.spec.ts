/**
 * @module lib/env.spec
 *
 * Proves `shouldTrustIncomingProxyHeaders` only trusts an explicit
 * `TRUST_PROXY_HEADERS=true`, defaulting to distrust otherwise.
 */
import { afterEach, describe, expect, it } from 'vitest';

import { shouldTrustIncomingProxyHeaders } from './env';

describe('shouldTrustIncomingProxyHeaders', () => {
  const original = process.env['TRUST_PROXY_HEADERS'];

  afterEach(() => {
    if (original === undefined) {
      delete process.env['TRUST_PROXY_HEADERS'];
    } else {
      process.env['TRUST_PROXY_HEADERS'] = original;
    }
  });

  it('is false when unset', () => {
    delete process.env['TRUST_PROXY_HEADERS'];

    expect(shouldTrustIncomingProxyHeaders()).toBe(false);
  });

  it('is false for any value other than the literal string "true"', () => {
    process.env['TRUST_PROXY_HEADERS'] = 'yes';

    expect(shouldTrustIncomingProxyHeaders()).toBe(false);
  });

  it('is true only for the literal string "true"', () => {
    process.env['TRUST_PROXY_HEADERS'] = 'true';

    expect(shouldTrustIncomingProxyHeaders()).toBe(true);
  });
});
