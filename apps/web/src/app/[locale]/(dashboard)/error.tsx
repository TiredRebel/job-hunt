'use client';

import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';

/**
 * Route-group error boundary for the dashboard shell. Catches errors thrown
 * during rendering or data fetching in any nested page and offers a retry,
 * per design.md's error-handling pattern (typed `ApiError` from the API
 * client surfaces here with a status + message).
 *
 * @param props - Error boundary props supplied by Next.js.
 * @param props.error - The thrown error (message may be redacted for
 *   server-rendering errors; `digest` can be used to correlate server logs).
 * @param props.reset - Re-renders the segment, retrying the failed render.
 * @returns The error fallback UI.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('common');

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <p className="text-sm font-medium text-text-primary">{t('error')}</p>
      {error.message && <p className="max-w-md text-sm text-text-muted">{error.message}</p>}
      <Button type="button" variant="outline" size="sm" onClick={reset}>
        {t('retry')}
      </Button>
    </div>
  );
}
