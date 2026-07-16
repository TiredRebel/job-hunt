import { Skeleton } from '@/components/ui/skeleton';

/**
 * Generic dashboard route-group loading skeleton. Individual pages that
 * need a layout-accurate skeleton (table rows, card grids, …) override this
 * with their own nested `loading.tsx`.
 *
 * @returns The loading skeleton.
 */
export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-8 w-48" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}
