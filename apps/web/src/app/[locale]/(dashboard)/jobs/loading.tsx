import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading skeleton for `/jobs`, matching the filter bar + dense table
 * layout (UI_DESIGN §7: skeletons matching real layout, no spinners).
 *
 * @returns The jobs page loading skeleton.
 */
export default function JobsLoading() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border bg-surface px-4 py-2.5">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-8 w-24" />
        ))}
      </div>
      <div className="flex flex-col gap-px p-2">
        {Array.from({ length: 14 }, (_, index) => (
          <Skeleton key={index} className="h-9 w-full" />
        ))}
      </div>
    </div>
  );
}
