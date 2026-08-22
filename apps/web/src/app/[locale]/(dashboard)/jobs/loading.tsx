import { JobsLoadingState } from '@/components/jobs/jobs-loading-state';

/**
 * Loading skeleton for `/jobs`, matching the filter bar + dense table
 * layout (UI_DESIGN §7: skeletons matching real layout, no spinners).
 *
 * @returns The jobs page loading skeleton.
 */
export default function JobsLoading() {
  return <JobsLoadingState />;
}
