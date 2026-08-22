/**
 * @module lib/hooks/use-relaxed-score-suggestion
 *
 * "Filters match nothing" recovery: when the score-min filter is the likely
 * culprit, probe how many jobs a lower floor would surface (design_handoff
 * jobs-states template: "Dropping the score floor to 80 would bring back
 * 48"). One extra count-only list call, gated so it never fires unless the
 * table is genuinely empty and a score filter is active.
 */
import { useQuery } from '@tanstack/react-query';

import { listJobs, type JobsListParams } from '@/lib/api/jobs';
import { queryKeys } from '@/lib/api/query-keys';

/** How much to relax the score floor by, in one step. */
const SCORE_RELAX_STEP = 20;

/** A relaxed score-floor candidate and how many jobs it would surface. */
export interface RelaxedScoreSuggestion {
  readonly scoreMin: number;
  readonly count: number;
}

/**
 * Probe a relaxed `scoreMin` for the current filter set.
 *
 * @param params - Current jobs-list filters.
 * @param enabled - Only query when the table is actually empty.
 * @returns The relaxed suggestion once known, or `undefined` while loading,
 * disabled, or when there is no active score filter to relax.
 */
export function useRelaxedScoreSuggestion(
  params: JobsListParams,
  enabled: boolean,
): RelaxedScoreSuggestion | undefined {
  const scoreMin = params.scoreMin ?? 0;
  const relaxed = Math.max(0, scoreMin - SCORE_RELAX_STEP);
  const canSuggest = enabled && scoreMin > 0 && relaxed < scoreMin;

  const relaxedParams: JobsListParams = { ...params, scoreMin: relaxed, offset: 0, limit: 1 };

  const query = useQuery({
    queryKey: queryKeys.jobs.list(relaxedParams),
    queryFn: ({ signal }) => listJobs(relaxedParams, signal),
    enabled: canSuggest,
    staleTime: 30 * 1000,
  });

  if (!canSuggest || !query.data || query.data.total === 0) {
    return undefined;
  }
  return { scoreMin: relaxed, count: query.data.total };
}
