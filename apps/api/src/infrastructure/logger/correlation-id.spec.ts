/**
 * @module correlation-id.spec
 *
 * Proves `resolveCorrelationId` mints a fresh id whenever the incoming
 * `X-Correlation-Id` header is missing or malformed, rather than trusting a
 * client-supplied value verbatim into logs/CLS/response headers.
 */
import type { IncomingMessage } from 'node:http';

import { describe, expect, it } from 'vitest';

import { CORRELATION_ID_HEADER, resolveCorrelationId } from './correlation-id';

function fakeRequest(headerValue?: string | string[]): IncomingMessage {
  return {
    headers: headerValue === undefined ? {} : { [CORRELATION_ID_HEADER]: headerValue },
  } as IncomingMessage;
}

describe('resolveCorrelationId', () => {
  it('mints a UUID when the header is absent', () => {
    const id = resolveCorrelationId(fakeRequest());

    expect(id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('adopts a well-formed caller-supplied id', () => {
    const id = resolveCorrelationId(fakeRequest('abc-123_XYZ'));

    expect(id).toBe('abc-123_XYZ');
  });

  it('rejects a header containing a newline (log-injection attempt) and mints a fresh id', () => {
    const id = resolveCorrelationId(fakeRequest('legit-id\nfake: injected-log-line'));

    expect(id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('rejects a header over 128 characters and mints a fresh id', () => {
    const id = resolveCorrelationId(fakeRequest('a'.repeat(129)));

    expect(id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('rejects an empty header and mints a fresh id', () => {
    const id = resolveCorrelationId(fakeRequest(''));

    expect(id).toMatch(/^[0-9a-f-]{36}$/);
  });
});
