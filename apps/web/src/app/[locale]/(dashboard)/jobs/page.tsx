import { getLocale, getTranslations } from 'next-intl/server';
import type { Locale } from '@job-hunter/shared-ts';
import { Suspense } from 'react';

import { JobsClient } from '@/components/jobs/jobs-client';
import { JobsLoadError } from '@/components/jobs/jobs-load-error';
import { JobsLoadingState } from '@/components/jobs/jobs-loading-state';
import { ApiError } from '@/lib/api/client';
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
  return <JobsLoadingState />;
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

  let initialData;
  try {
    initialData = await listJobs(params);
  } catch (error) {
    if (!(error instanceof ApiError) && !(error instanceof TypeError)) {
      throw error;
    }

    const t = await getTranslations('jobs.loadError');
    return (
      <JobsLoadError
        eyebrow={t('eyebrow')}
        title={t('title')}
        body={t('body')}
        retry={t('retry')}
        sources={t('sources')}
      />
    );
  }

  return (
    <Suspense fallback={<JobsClientFallback />}>
      <JobsClient initialData={initialData} params={params} locale={locale} />
    </Suspense>
  );
}
