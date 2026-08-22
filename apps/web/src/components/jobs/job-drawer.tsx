'use client';

/**
 * @module components/jobs/job-drawer
 *
 * Right-side 560px job detail Sheet driven by `?job=<id>` (design.md D5 /
 * job-detail spec). Survives refresh; Esc / close clears the search param.
 * Dirty cover-letter edits prompt before discard.
 */
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import { JobDetailView } from '@/components/jobs/job-detail';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { usePathname, useRouter } from '@/i18n/navigation';

/**
 * Job detail drawer bound to the current URL's `job` search param.
 *
 * @returns The sheet element when a job id is present in the URL.
 */
export function JobDrawer() {
  const t = useTranslations('jobDetail');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const jobId = searchParams.get('job');
  const originJobIdRef = useRef(jobId);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (jobId) originJobIdRef.current = jobId;
  }, [jobId]);

  const clearJobParam = useCallback(() => {
    const next = new URLSearchParams(searchParams.toString());
    next.delete('job');
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    setDirty(false);
  }, [pathname, router, searchParams]);

  const close = useCallback(() => {
    if (dirty && !window.confirm(t('unsavedConfirm'))) {
      return;
    }
    clearJobParam();
  }, [clearJobParam, dirty, t]);

  return (
    <Sheet
      open={Boolean(jobId)}
      onOpenChange={(open) => {
        if (!open) {
          close();
        }
      }}
    >
      <SheetContent
        side="right"
        className="w-full max-w-[560px] gap-0 overflow-hidden p-4"
        closeLabel={tCommon('close')}
        onCloseAutoFocus={(event) => {
          const originJobId = originJobIdRef.current;
          if (!originJobId) return;
          const row = document.querySelector<HTMLElement>(
            `[data-job-id="${CSS.escape(originJobId)}"]`,
          );
          if (row) {
            event.preventDefault();
            row.focus();
          }
        }}
      >
        <SheetTitle className="sr-only">{t('title')}</SheetTitle>
        <SheetDescription className="sr-only">{t('drawerDescription')}</SheetDescription>
        {jobId && (
          <JobDetailView
            jobId={jobId}
            variant="drawer"
            onDirtyChange={setDirty}
            onDeleted={clearJobParam}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
