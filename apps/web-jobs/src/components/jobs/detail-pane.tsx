'use client';

/**
 * @module components/jobs/detail-pane
 *
 * Docked / sheet / drawer detail surface (docs/jobs-redesign.md §3.4).
 * Never navigates — selection is parent-owned local state.
 */
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';

import { JobDetailView } from '@/components/jobs/job-detail';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const WIDTH_KEY = 'job-hunter-detail-width';
const MIN_WIDTH = 420;
const MAX_WIDTH = 640;
const DEFAULT_WIDTH = 480;

/** Props for {@link DetailPane}. */
export interface DetailPaneProps {
  readonly jobId: string | null;
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onDeleted?: () => void;
}

/**
 * Read persisted pane width, clamped.
 *
 * @returns Width in px.
 */
function readWidth(): number {
  if (typeof window === 'undefined') {
    return DEFAULT_WIDTH;
  }
  const raw = Number(window.localStorage.getItem(WIDTH_KEY));
  if (!Number.isFinite(raw)) {
    return DEFAULT_WIDTH;
  }
  return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, raw));
}

/**
 * Resizable detail pane with responsive sheet/drawer behavior.
 *
 * @param props - Pane props.
 * @returns The pane element (or null when closed with no job).
 */
export function DetailPane({ jobId, open, onClose, onDeleted }: DetailPaneProps) {
  const t = useTranslations('jobDetail');
  const tCommon = useTranslations('common');
  const [width, setWidth] = useState(readWidth);
  const [dirty, setDirty] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement | null;
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus?.();
      previousFocusRef.current = null;
    }
  }, [open]);

  const requestClose = useCallback(() => {
    if (dirty && !window.confirm(t('unsavedConfirm'))) {
      return;
    }
    setDirty(false);
    onClose();
  }, [dirty, onClose, t]);

  const onResizePointerDown = (event: ReactPointerEvent<HTMLDivElement>): void => {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = width;

    const onMove = (moveEvent: PointerEvent): void => {
      const next = Math.min(
        MAX_WIDTH,
        Math.max(MIN_WIDTH, startWidth + (startX - moveEvent.clientX)),
      );
      setWidth(next);
    };
    const onUp = (): void => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.localStorage.setItem(WIDTH_KEY, String(width));
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  useEffect(() => {
    window.localStorage.setItem(WIDTH_KEY, String(width));
  }, [width]);

  if (!open || !jobId) {
    return null;
  }

  return (
    <>
      {/* Scrim for sheet / drawer breakpoints */}
      <button
        type="button"
        aria-label={tCommon('close')}
        className="fixed inset-0 z-30 bg-[var(--text-primary)]/30 xl:hidden"
        onClick={requestClose}
      />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('title')}
        className={cn(
          'z-40 flex flex-col bg-[var(--surface-raised)] shadow-[var(--elevation-1)]',
          'border-l border-[var(--border-subtle)]',
          // <768 full-screen drawer
          'fixed inset-0',
          // 768–1023 sheet, 1024+ docked
          'sm:inset-y-0 sm:left-auto sm:right-0 sm:w-[min(100%,var(--detail-width))]',
          'xl:static xl:z-0 xl:h-full xl:shrink-0',
        )}
        style={{ ['--detail-width' as string]: `${width}px`, width: undefined }}
      >
        <div
          role="separator"
          aria-orientation="vertical"
          aria-valuenow={width}
          aria-valuemin={MIN_WIDTH}
          aria-valuemax={MAX_WIDTH}
          tabIndex={0}
          onPointerDown={onResizePointerDown}
          className="absolute inset-y-0 left-0 hidden w-1 cursor-col-resize bg-transparent hover:bg-[var(--accent)] xl:block"
        />
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-3 py-2">
          <span className="utility-label text-[var(--text-secondary)]">{t('title')}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={tCommon('close')}
            onClick={requestClose}
          >
            <X aria-hidden="true" size={16} />
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto" key="detail-scroll">
          {/* Keep a stable shell; swap job content without remounting the shell */}
          <JobDetailView
            key={jobId}
            jobId={jobId}
            variant="drawer"
            onDirtyChange={setDirty}
            onDeleted={() => {
              setDirty(false);
              onDeleted?.();
              onClose();
            }}
          />
        </div>
      </aside>
    </>
  );
}
