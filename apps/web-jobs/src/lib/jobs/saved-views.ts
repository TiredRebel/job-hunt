/**
 * @module lib/jobs/saved-views
 *
 * Map saved-view ids to list filters (docs/jobs-redesign.md §4.3).
 */
import type { JobsListParams } from '@/lib/api/jobs';
import type { SystemViewId } from '@/components/jobs/saved-view-tabs';

/**
 * Apply a system view onto base list params (clears conflicting filters).
 *
 * @param view - System view id.
 * @param base - Current params (pagination preserved).
 * @returns Params for the view.
 */
export function paramsForView(view: SystemViewId, base: JobsListParams = {}): JobsListParams {
  const shared: JobsListParams = {
    limit: base.limit,
    offset: 0,
    sortBy: base.sortBy ?? 'posted',
    sortDir: base.sortDir ?? 'desc',
    query: base.query,
  };

  switch (view) {
    case 'unreviewed':
      return { ...shared, reaction: ['none'] };
    case 'highFit':
      return { ...shared, scoreMin: 70 };
    case 'inMotion':
      return { ...shared, reaction: ['applied', 'interview', 'offer'] };
    case 'rejected':
      return { ...shared, reaction: ['rejected'] };
    case 'hidden':
      return { ...shared, status: ['hidden'] };
    default: {
      const _exhaustive: never = view;
      return _exhaustive;
    }
  }
}

/**
 * Detect which system view (if any) the current params match.
 *
 * @param params - Current list params.
 * @returns Matching view id, or null for ad-hoc filters.
 */
export function detectView(params: JobsListParams): SystemViewId | null {
  const reaction = params.reaction?.slice().sort().join(',') ?? '';
  if (reaction === 'none' && params.scoreMin === undefined && !params.status?.length) {
    return 'unreviewed';
  }
  if (params.scoreMin === 70 && !params.reaction?.length && !params.status?.length) {
    return 'highFit';
  }
  if (reaction === 'applied,interview,offer') {
    return 'inMotion';
  }
  if (reaction === 'rejected') {
    return 'rejected';
  }
  if (params.status?.includes('hidden')) {
    return 'hidden';
  }
  return null;
}
