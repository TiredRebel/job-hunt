/**
 * @module lib/formatters.spec
 *
 * Unit tests for locale-aware formatters.
 */
import { describe, expect, it } from 'vitest';

import { formatDate, formatNumber, formatSalary } from './formatters';

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
