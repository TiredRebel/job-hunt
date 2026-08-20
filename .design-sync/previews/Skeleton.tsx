import { Skeleton } from 'web';

/** Loading rows that match the real jobs-table layout — never a spinner. */
export function TableRows() {
  return (
    <div className="flex flex-col gap-2">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-5 w-8" />
          <div className="flex flex-1 flex-col gap-1">
            <Skeleton className="h-3.5 w-64" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-5 w-20" />
        </div>
      ))}
    </div>
  );
}

/** Panel placeholder while a summary loads. */
export function Panel() {
  return (
    <div className="flex max-w-sm flex-col gap-2">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  );
}
