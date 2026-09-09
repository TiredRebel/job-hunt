/**
 * @module lib/hooks/use-active-profile
 *
 * Fetches the active profile — reaction mutations (bulk actions, stage
 * changes, board drags) all need its id.
 */
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { getActiveProfile, type Profile } from '@/lib/api/profiles';
import { queryKeys } from '@/lib/api/query-keys';

/**
 * Query the active profile.
 *
 * @returns The TanStack Query result for the active profile.
 */
export function useActiveProfile(): UseQueryResult<Profile> {
  return useQuery({
    queryKey: queryKeys.profiles.active,
    queryFn: ({ signal }) => getActiveProfile(signal),
    staleTime: 5 * 60 * 1000,
  });
}
