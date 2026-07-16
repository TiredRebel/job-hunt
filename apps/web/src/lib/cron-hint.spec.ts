/**
 * @module lib/cron-hint.spec
 *
 * Unit tests for {@link cronToHint} / {@link cronFromConfig}.
 */
import { describe, expect, it } from 'vitest';

import { cronFromConfig, cronToHint } from './cron-hint';

describe('cronToHint', () => {
  it('maps common expressions', () => {
    expect(cronToHint('0 * * * *')).toBe('Every hour');
    expect(cronToHint('0 8 * * 1-5')).toBe('Weekdays at 08:00');
  });

  it('returns the raw expression for unknown crons', () => {
    expect(cronToHint('5 4 * * *')).toBe('5 4 * * *');
  });

  it('returns null for empty input', () => {
    expect(cronToHint(null)).toBeNull();
    expect(cronToHint('')).toBeNull();
  });
});

describe('cronFromConfig', () => {
  it('reads cron or schedule keys', () => {
    expect(cronFromConfig({ cron: '0 * * * *' })).toBe('0 * * * *');
    expect(cronFromConfig({ schedule: '0 8 * * *' })).toBe('0 8 * * *');
    expect(cronFromConfig({})).toBeNull();
  });
});
