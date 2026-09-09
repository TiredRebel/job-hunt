/**
 * @module lib/jobs/date-presets.spec
 *
 * Unit tests for FilterBar date-range presets.
 */
import { describe, expect, it } from 'vitest';

import { resolveDatePreset } from './date-presets';

describe('resolveDatePreset', () => {
  const now = new Date('2026-07-16T15:00:00.000Z');

  it('anchors today to local midnight of the given now', () => {
    const { from, to } = resolveDatePreset('today', now);
    expect(to).toBe(now);
    expect(from.getHours()).toBe(0);
    expect(from.getMinutes()).toBe(0);
  });

  it('computes a rolling 7-day window', () => {
    const { from, to } = resolveDatePreset('7d', now);
    expect(to).toBe(now);
    expect(to.getTime() - from.getTime()).toBe(7 * 24 * 60 * 60 * 1000);
  });
});
