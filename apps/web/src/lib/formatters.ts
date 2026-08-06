/**
 * @module lib/formatters
 *
 * Locale-aware date/number/salary formatters (docs/UI_DESIGN.md §6). All
 * dashboard surfaces must format through these instead of ad-hoc
 * `toLocaleString` calls so `en`/`uk` stay consistent.
 */
import type { Locale } from '@job-hunter/shared-ts';

const DATE_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  dateStyle: 'medium',
  timeStyle: 'short',
};

const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  dateStyle: 'medium',
};

const CALENDAR_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  ...DATE_OPTIONS,
  timeZone: 'UTC',
};

/**
 * Format an ISO timestamp as a locale-aware date + time string.
 *
 * @param isoDate - ISO 8601 timestamp, or `null`/`undefined` for unknown.
 * @param locale - Active UI locale.
 * @returns Formatted string, or `null` if `isoDate` was absent.
 */
export function formatDateTime(isoDate: string | null | undefined, locale: Locale): string | null {
  if (!isoDate) {
    return null;
  }
  return new Intl.DateTimeFormat(locale, DATE_TIME_OPTIONS).format(new Date(isoDate));
}

/**
 * Format an ISO timestamp as a locale-aware date-only string.
 *
 * @param isoDate - ISO 8601 timestamp, or `null`/`undefined` for unknown.
 * @param locale - Active UI locale.
 * @returns Formatted string, or `null` if `isoDate` was absent.
 */
export function formatDate(isoDate: string | null | undefined, locale: Locale): string | null {
  if (!isoDate) {
    return null;
  }
  return new Intl.DateTimeFormat(locale, DATE_OPTIONS).format(new Date(isoDate));
}

/**
 * Format a job's source publication date, falling back to first discovery.
 *
 * Authentic publication dates are stored as UTC-midnight calendar values and
 * are therefore formatted in UTC to prevent a browser timezone from shifting
 * them to the previous day. The first-seen fallback remains a normal timestamp.
 *
 * @param postedAt - Authentic source publication date, when available.
 * @param firstSeenAt - Timestamp when Job Hunter first observed the job.
 * @param locale - Active UI locale.
 * @returns A non-empty formatted date when either input exists, otherwise null.
 */
export function formatPostedDate(
  postedAt: string | null | undefined,
  firstSeenAt: string | null | undefined,
  locale: Locale,
): string | null {
  if (!postedAt) {
    return formatDate(firstSeenAt, locale);
  }
  return new Intl.DateTimeFormat(locale, CALENDAR_DATE_OPTIONS).format(new Date(postedAt));
}

/**
 * Format a plain number with locale-aware grouping.
 *
 * @param value - Number to format, or `null`/`undefined` for unknown.
 * @param locale - Active UI locale.
 * @returns Formatted string, or `null` if `value` was absent.
 */
export function formatNumber(value: number | null | undefined, locale: Locale): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  return new Intl.NumberFormat(locale).format(value);
}

/**
 * Format a salary figure with its currency, locale-aware.
 *
 * @param value - Salary amount, or `null`/`undefined` for unknown.
 * @param currency - ISO 4217 currency code, or `null`/`undefined` for unknown.
 * @param locale - Active UI locale.
 * @returns Formatted string, or `null` if `value` or `currency` was absent.
 */
export function formatSalary(
  value: number | null | undefined,
  currency: string | null | undefined,
  locale: Locale,
): string | null {
  if (value === null || value === undefined || !currency) {
    return null;
  }
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}
