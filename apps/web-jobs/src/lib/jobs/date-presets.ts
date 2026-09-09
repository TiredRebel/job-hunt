/**
 * @module lib/jobs/date-presets
 *
 * Date-range presets for the FilterBar's date picker (docs/UI_DESIGN.md
 * §5.1: today / 3d / 7d / 30d / custom).
 */

/** A date-range preset key. */
export type DatePreset = 'today' | '3d' | '7d' | '30d';

const PRESET_DAYS: Record<DatePreset, number> = {
  today: 0,
  '3d': 3,
  '7d': 7,
  '30d': 30,
};

/**
 * Compute the `[from, to]` window for a preset, anchored to now.
 *
 * @param preset - The preset key.
 * @param now - Anchor time (defaults to `new Date()`; injectable for tests).
 * @returns The inclusive date range for the preset.
 */
export function resolveDatePreset(
  preset: DatePreset,
  now: Date = new Date(),
): { from: Date; to: Date } {
  const to = now;
  const days = PRESET_DAYS[preset];
  if (days === 0) {
    const from = new Date(now);
    from.setHours(0, 0, 0, 0);
    return { from, to };
  }
  const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return { from, to };
}
