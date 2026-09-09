/**
 * @module lib/formatters.spec
 *
 * Unit tests for locale-aware formatters.
 */
import { describe, expect, it } from 'vitest';

import { formatDate, formatNumber, formatPostedDate, formatSalary } from './formatters';

describe('formatNumber', () => {
  it('formats with en grouping', () => {
    expect(formatNumber(1500, 'en')).toBe('1,500');
  });

  it('formats with uk grouping', () => {
    expect(formatNumber(1500, 'uk')).toMatch(/1.500/);
  });

  it('returns null for missing values', () => {
    expect(formatNumber(null, 'en')).toBeNull();
    expect(formatNumber(undefined, 'en')).toBeNull();
  });
});

describe('formatDate', () => {
  it('returns null for missing dates', () => {
    expect(formatDate(null, 'en')).toBeNull();
  });

  it('formats a known ISO date', () => {
    const formatted = formatDate('2026-07-15T00:00:00Z', 'en');
    expect(formatted).toContain('2026');
  });
});

describe('formatPostedDate', () => {
  it('prefers the authentic source date', () => {
    const formatted = formatPostedDate('2026-08-05T00:00:00Z', '2026-07-01T23:00:00Z', 'en');

    expect(formatted).toContain('Aug');
    expect(formatted).toContain('5');
  });

  it('does not shift a UTC-midnight source date in a negative-offset timezone', () => {
    const previousTimezone = process.env.TZ;
    process.env.TZ = 'America/Los_Angeles';

    try {
      const formatted = formatPostedDate('2026-08-05T00:00:00Z', null, 'en');
      expect(formatted).toContain('Aug');
      expect(formatted).toContain('5');
    } finally {
      process.env.TZ = previousTimezone;
    }
  });

  it('falls back to first seen when the source date is missing', () => {
    const formatted = formatPostedDate(null, '2026-07-01T00:00:00Z', 'en');

    expect(formatted).not.toBeNull();
    expect(formatted).toContain('2026');
  });

  it('returns null only when both dates are missing', () => {
    expect(formatPostedDate(null, null, 'en')).toBeNull();
  });
});

describe('formatSalary', () => {
  it('returns null when either value or currency is missing', () => {
    expect(formatSalary(null, 'USD', 'en')).toBeNull();
    expect(formatSalary(1000, null, 'en')).toBeNull();
  });

  it('formats a salary with currency', () => {
    const formatted = formatSalary(1500, 'USD', 'en');
    expect(formatted).toContain('1,500');
  });
});
