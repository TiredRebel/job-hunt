import { getLocale } from 'next-intl/server';
import type { Locale } from '@job-hunter/shared-ts';
import { Suspense } from 'react';

import { JobsClient } from '@/components/jobs/jobs-client';
import { Skeleton } from '@/components/ui/skeleton';
import { listJobs } from '@/lib/api/jobs';
import { parseJobsSearchParams, type RawSearchParams } from '@/lib/jobs/search-params';

/** Always request-time: filters come from the URL and hit the live API. */
export const dynamic = 'force-dynamic';

/** Route props for the `/jobs` page. */
interface JobsPageProps {
  readonly searchParams: Promise<RawSearchParams>;
}

/**
 * Fallback while the client island (which reads `useSearchParams`) hydrates.
 *
 * @returns A compact filter+table skeleton.
 */
function JobsClientFallback() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border bg-surface px-4 py-2.5">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-8 w-24" />
        ))}
      </div>
      <div className="flex flex-col gap-px p-2">
        {Array.from({ length: 10 }, (_, index) => (
          <Skeleton key={index} className="h-9 w-full" />
        ))}
      </div>
    </div>
  );
}

/**
 * Jobs dashboard: server-fetches page 1 with the current URL filters, then
 * hydrates the client table with it (design.md D1/D2).
 *
 * @param props - Route props.
 * @returns The jobs page content.
 */
export default async function JobsPage({ searchParams }: JobsPageProps) {
  const rawSearchParams = await searchParams;
  const params = parseJobsSearchParams(rawSearchParams);
  const locale = (await getLocale()) as Locale;

  const initialData = await listJobs(params);

  return (
    <Suspense fallback={<JobsClientFallback />}>
      <JobsClient initialData={initialData} params={params} locale={locale} />
    </Suspense>
  );
}
