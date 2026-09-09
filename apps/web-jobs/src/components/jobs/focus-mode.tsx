'use client';

/**
 * @module components/jobs/focus-mode
 *
 * Single-job triage mode (docs/jobs-redesign.md §2.1).
 */
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';

import { ScoreMeter } from '@/components/jobs/score-meter';
import { JobDetailView } from '@/components/jobs/job-detail';
import { Button } from '@/components/ui/button';
import type { JobRow } from '@/components/jobs/job-table-columns';
import { cn } from '@/lib/utils';

/** Props for {@link FocusMode}. */
export interface FocusModeProps {
  readonly job: JobRow;
  readonly index: number;
  readonly total: number;
  readonly onClose: () => void;
  readonly onStage: (stage: 'saved' | 'applied' | 'interview' | 'offer' | 'rejected') => void;
  readonly onHide: () => void;
  readonly onUndo: () => void;
}

/**
 * Centered focus-mode card with sticky action bar.
 *
 * @param props - Focus mode props.
 * @returns The focus mode overlay.
 */
export function FocusMode({ job, index, total, onClose, onStage, onHide, onUndo }: FocusModeProps) {
  const t = useTranslations('jobs.focus');
  const tStages = useTranslations('stages');
  const [whyOpen, setWhyOpen] = useState(false);
  const progress = total === 0 ? 0 : ((index + 1) / total) * 100;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-[var(--surface)]"
      role="dialog"
      aria-modal="true"
      aria-label={t('title')}
    >
      <header className="mx-auto flex w-full max-w-[760px] items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={onClose}
          className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          ← {t('back', { current: index + 1, total })}
        </button>
        <div className="h-1.5 flex-1 overflow-hidden rounded-[var(--radius-pill)] bg-[var(--surface-sunken)]">
          <div
            className="h-full bg-[var(--accent)]"
            style={{ width: `${progress}%` }}
            aria-hidden="true"
          />
        </div>
        <Button type="button" variant="ghost" size="icon" aria-label={t('exit')} onClick={onClose}>
          <X aria-hidden="true" size={16} />
        </Button>
      </header>

      <div className="mx-auto min-h-0 w-full max-w-[760px] flex-1 overflow-y-auto px-4 pb-28">
        <h2 className="text-[28px] font-semibold leading-tight text-[var(--text-primary)]">
          {job.title}
        </h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          {[job.company, job.sourceSlug, job.remote === 'remote' ? t('remote') : null]
            .filter(Boolean)
            .join(' · ')}
        </p>
        <div className="mt-3 flex items-center gap-3">
          <ScoreMeter score={job.matchScore} />
          <button
            type="button"
            className="text-xs text-[var(--accent)] underline-offset-2 hover:underline"
            onClick={() => setWhyOpen((value) => !value)}
          >
            {t('why')}
          </button>
          <button
            type="button"
            className="text-xs text-[var(--text-secondary)] underline-offset-2 hover:underline"
            onClick={onUndo}
          >
            {t('undo')} <kbd className="font-mono">U</kbd>
          </button>
        </div>
        {whyOpen && (
          <div className="mt-4 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-raised)] p-3 shadow-[var(--elevation-1)]">
            <JobDetailView jobId={job.id} variant="drawer" />
          </div>
        )}
        {!whyOpen && (
          <div className="mt-6">
            <JobDetailView jobId={job.id} variant="drawer" />
          </div>
        )}
      </div>

      <div
        className={cn(
          'fixed inset-x-0 bottom-0 border-t border-[var(--border-strong)] bg-[var(--surface-overlay)] px-4 py-3 shadow-[var(--elevation-2)]',
        )}
      >
        <div className="mx-auto flex max-w-[760px] flex-wrap items-center justify-center gap-2">
          <Button
            type="button"
            className="min-h-[var(--touch-min)] min-w-[var(--touch-min)]"
            onClick={() => onStage('saved')}
          >
            {tStages('saved')} <kbd className="ml-1 opacity-70">S</kbd>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-h-[var(--touch-min)] min-w-[var(--touch-min)]"
            onClick={() => onStage('applied')}
          >
            {tStages('applied')} <kbd className="ml-1 opacity-70">A</kbd>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-h-[var(--touch-min)] min-w-[var(--touch-min)] text-[var(--state-rejected-fg)]"
            onClick={() => onStage('rejected')}
          >
            {tStages('rejected')} <kbd className="ml-1 opacity-70">X</kbd>
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="min-h-[var(--touch-min)] min-w-[var(--touch-min)]"
            onClick={onHide}
          >
            {t('hide')} <kbd className="ml-1 opacity-70">H</kbd>
          </Button>
        </div>
      </div>
    </div>
  );
}
