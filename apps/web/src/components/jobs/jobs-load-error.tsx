'use client';

/**
 * @module components/jobs/jobs-load-error
 *
 * Actionable route-level fallback for a failed initial jobs data request.
 */
import { Database, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';

/** Copy supplied by the locale-aware server route. */
export interface JobsLoadErrorProps {
  readonly eyebrow: string;
  readonly title: string;
  readonly body: string;
  readonly retry: string;
  readonly sources: string;
}

/**
 * Render a recoverable data-connection state without collapsing the shell.
 *
 * @param props - Localized fallback copy.
 * @returns The connection-failure panel.
 */
export function JobsLoadError({ eyebrow, title, body, retry, sources }: JobsLoadErrorProps) {
  const router = useRouter();

  return (
    <section
      role="alert"
      aria-labelledby="jobs-load-error-title"
      className="workspace-panel relative isolate overflow-hidden p-6 sm:p-8"
    >
      <div aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-warning" />
      <div className="flex max-w-2xl flex-col gap-5 sm:flex-row sm:items-start">
        <span className="relative flex size-12 shrink-0 items-center justify-center rounded-[var(--radius-control)] border border-warning/35 bg-warning/10 text-warning">
          <Database aria-hidden="true" size={22} />
          <span className="absolute -right-1 -top-1 size-2.5 rounded-full border-2 border-surface bg-warning" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-warning">
            {eyebrow}
          </p>
          <h2
            id="jobs-load-error-title"
            className="mt-2 text-xl font-semibold tracking-[-0.025em] text-text-primary"
          >
            {title}
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-text-muted">{body}</p>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={() => router.refresh()}>
              <RefreshCw aria-hidden="true" size={15} />
              {retry}
            </Button>
            <Button asChild type="button" variant="outline" size="sm">
              <Link href="/sources">{sources}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
