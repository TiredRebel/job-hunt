import { getLocale, getTranslations } from 'next-intl/server';
import type { Locale } from '@job-hunter/shared-ts';

import { listDeadLetterJobs, type DeadLetterJob } from '@/lib/api/automation';
import { ApiError } from '@/lib/api/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDateTime } from '@/lib/formatters';

/** Always request-time: live dead-letter listing from the gateway. */
export const dynamic = 'force-dynamic';

/**
 * Dead-letter listing: raw postings that failed repeated processing
 * attempts and won't be retried automatically. Linked from the Jobs
 * dashboard reconciliation strip's `failed` bucket.
 *
 * @returns The dead-letter page content.
 */
export default async function DeadLetterPage() {
  const t = await getTranslations('jobs.deadLetter');
  const locale = (await getLocale()) as Locale;

  let jobs: readonly DeadLetterJob[] = [];
  try {
    jobs = await listDeadLetterJobs();
  } catch (error) {
    if (!(error instanceof ApiError) && !(error instanceof TypeError)) {
      throw error;
    }
    // Render the empty state with the localized message — the dead-letter
    // endpoint is best-effort; a 502 (scraper down) shouldn't blow up the
    // page. The operator-visible difference is "no rows" vs. an error
    // toast, and a separate error state is not warranted for this surface.
    jobs = [];
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold text-text-primary">{t('title')}</h1>
        <p className="text-sm text-text-muted">{t('description')}</p>
      </header>

      {jobs.length === 0 ? (
        <p className="text-sm text-text-muted" data-testid="dead-letter-empty">
          {t('empty')}
        </p>
      ) : (
        <div className="workspace-panel overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('colExternalId')}</TableHead>
                <TableHead>{t('colSource')}</TableHead>
                <TableHead>{t('colTitle')}</TableHead>
                <TableHead>{t('colProcessedAt')}</TableHead>
                <TableHead>{t('colAttempts')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-mono text-xs">{job.externalId}</TableCell>
                  <TableCell className="text-xs">{job.sourceSlug}</TableCell>
                  <TableCell className="text-xs">{job.title}</TableCell>
                  <TableCell className="tabular-nums font-mono text-xs">
                    {job.processedAt ? formatDateTime(job.processedAt, locale) : '—'}
                  </TableCell>
                  <TableCell className="tabular-nums font-mono text-xs">
                    {job.processAttempts}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
