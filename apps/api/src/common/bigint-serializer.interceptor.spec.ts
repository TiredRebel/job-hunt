import { describe, expect, it } from 'vitest';

import { serializeBigInts } from './bigint-serializer.interceptor';

describe('serializeBigInts', () => {
  it('converts a bare bigint to a decimal string', () => {
    expect(serializeBigInts(42n)).toBe('42');
  });

  it('converts bigints beyond Number.MAX_SAFE_INTEGER without precision loss', () => {
    expect(serializeBigInts(9007199254740993n)).toBe('9007199254740993');
  });

  it('converts bigints nested in objects and arrays', () => {
    const input = {
      id: 42n,
      items: [
        { jobId: 7n, note: 'x' },
        { jobId: 8n, note: null },
      ],
      total: 2,
    };
    expect(serializeBigInts(input)).toEqual({
      id: '42',
      items: [
        { jobId: '7', note: 'x' },
        { jobId: '8', note: null },
      ],
      total: 2,
    });
  });

  it('leaves primitives, null, and undefined untouched', () => {
    expect(serializeBigInts('a')).toBe('a');
    expect(serializeBigInts(1.5)).toBe(1.5);
    expect(serializeBigInts(true)).toBe(true);
    expect(serializeBigInts(null)).toBeNull();
    expect(serializeBigInts(undefined)).toBeUndefined();
  });

  it('preserves Date instances so JSON.stringify keeps ISO output', () => {
    const date = new Date('2026-07-16T00:00:00.000Z');
    const result = serializeBigInts({ postedAt: date }) as { postedAt: unknown };
    expect(result.postedAt).toBe(date);
  });

  it('makes payloads with bigints JSON-serializable', () => {
    const payload = { id: 42n, occurredAt: new Date('2026-07-16T00:00:00.000Z') };
    expect(() => JSON.stringify(payload)).toThrow(TypeError);
    expect(JSON.stringify(serializeBigInts(payload))).toBe(
      '{"id":"42","occurredAt":"2026-07-16T00:00:00.000Z"}',
    );
  });
});
