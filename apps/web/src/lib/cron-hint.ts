/**
 * @module lib/cron-hint
 *
 * Tiny cron → human-readable hint helper for the sources admin page.
 * Covers common n8n-style schedules; unknown expressions fall back to the
 * raw cron string (schedules live in source `config`, not a first-class
 * API field).
 */

/**
 * Produce a short human-readable hint for a cron expression.
 *
 * @param cron - Five-field cron expression, or `undefined`/`null`.
 * @returns Localized-ready English hint, or `null` when absent.
 */
export function cronToHint(cron: string | null | undefined): string | null {
  if (!cron || !cron.trim()) {
    return null;
  }
  const trimmed = cron.trim();
  switch (trimmed) {
    case '0 * * * *':
      return 'Every hour';
    case '0 */6 * * *':
      return 'Every 6 hours';
    case '0 0 * * *':
      return 'Daily at midnight';
    case '0 8 * * *':
      return 'Daily at 08:00';
    case '0 8 * * 1-5':
      return 'Weekdays at 08:00';
    case '*/15 * * * *':
      return 'Every 15 minutes';
    case '*/30 * * * *':
      return 'Every 30 minutes';
    default:
      return trimmed;
  }
}

/**
 * Read a cron expression from a source's opaque `config` bag.
 *
 * @param config - Source config JSON.
 * @returns The cron string when present, otherwise `null`.
 */
export function cronFromConfig(config: { readonly [key: string]: unknown }): string | null {
  const value = config['cron'] ?? config['schedule'];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}
