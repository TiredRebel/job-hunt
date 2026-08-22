'use client';

/**
 * @module components/jobs/cover-letter-editor
 *
 * Cover-letter viewer/editor (job-detail spec §5.3.6 / task 5.5). Save goes
 * through `PUT /v1/jobs/{id}/cover-letter`; regenerate goes through
 * `POST /v1/jobs/{id}/cover-letter/regenerate` (Phase 6 — requires a
 * persisted match, see {@link CoverLetterEditorProps.hasMatch}). Dirty-state
 * is exposed via {@link CoverLetterEditorProps.onDirtyChange} so the drawer
 * can guard close.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getCoverLetter, regenerateCoverLetter, saveCoverLetter } from '@/lib/api/cover-letters';
import { queryKeys } from '@/lib/api/query-keys';
import { formatDateTime } from '@/lib/formatters';
import type { Locale } from '@job-hunter/shared-ts';

/** Props accepted by {@link CoverLetterEditor}. */
export interface CoverLetterEditorProps {
  readonly jobId: string;
  readonly hasMatch: boolean;
  readonly onDirtyChange?: (dirty: boolean) => void;
}

/**
 * Cover-letter draft viewer/editor with explicit save and dirty tracking.
 * Local draft state is `null` until the user edits, so the server value is
 * shown without a syncing effect (avoids setState-in-effect).
 *
 * @param props - Editor props.
 * @returns The editor section.
 */
export function CoverLetterEditor({ jobId, hasMatch, onDirtyChange }: CoverLetterEditorProps) {
  const t = useTranslations('jobDetail');
  const locale = useLocale() as Locale;
  const queryClient = useQueryClient();
  const [localDraft, setLocalDraft] = useState<string | null>(null);

  const coverLetterQuery = useQuery({
    queryKey: [...queryKeys.jobs.detail(jobId), 'cover-letter'] as const,
    queryFn: ({ signal }) => getCoverLetter(jobId, signal),
  });

  const serverBody = coverLetterQuery.data?.bodyMd ?? '';
  const draft = localDraft ?? serverBody;
  const dirty = localDraft !== null && coverLetterQuery.data !== null && localDraft !== serverBody;

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  const saveMutation = useMutation({
    mutationFn: () => saveCoverLetter(jobId, draft),
    onSuccess: async () => {
      setLocalDraft(null);
      await queryClient.invalidateQueries({
        queryKey: [...queryKeys.jobs.detail(jobId), 'cover-letter'],
      });
      toast.success(t('coverLetterSaved'));
    },
    onError: () => toast.error(t('coverLetterSaveError')),
  });

  const regenerateMutation = useMutation({
    mutationFn: () => regenerateCoverLetter(jobId),
    onSuccess: async () => {
      setLocalDraft(null);
      await queryClient.invalidateQueries({
        queryKey: [...queryKeys.jobs.detail(jobId), 'cover-letter'],
      });
      toast.success(t('coverLetterRegenerated'));
    },
    onError: () => toast.error(t('coverLetterRegenerateError')),
  });

  const handleRegenerate = () => {
    if (dirty && !window.confirm(t('unsavedConfirm'))) {
      return;
    }
    regenerateMutation.mutate();
  };

  const regenerateButton = (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={!hasMatch || regenerateMutation.isPending}
      onClick={handleRegenerate}
    >
      {regenerateMutation.isPending ? t('coverLetterRegenerating') : t('coverLetterRegenerate')}
    </Button>
  );

  if (coverLetterQuery.isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <h3 className="utility-label text-text-muted">{t('coverLetter')}</h3>
        <p className="text-sm text-text-muted">{t('coverLetterLoading')}</p>
      </div>
    );
  }

  if (coverLetterQuery.isError || coverLetterQuery.data === undefined) {
    return (
      <div className="flex flex-col gap-2">
        <h3 className="utility-label text-text-muted">{t('coverLetter')}</h3>
        <p className="text-sm text-destructive">{t('coverLetterLoadError')}</p>
      </div>
    );
  }

  if (coverLetterQuery.data === null) {
    return (
      <div className="flex flex-col gap-2">
        <h3 className="utility-label text-text-muted">{t('coverLetter')}</h3>
        <p className="text-sm text-text-muted">{t('coverLetterPlaceholder')}</p>
        {hasMatch ? (
          regenerateButton
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <span>{regenerateButton}</span>
            </TooltipTrigger>
            <TooltipContent>{t('coverLetterRegenerateNoMatchHint')}</TooltipContent>
          </Tooltip>
        )}
      </div>
    );
  }

  const coverLetter = coverLetterQuery.data;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <h3 className="utility-label text-text-muted">{t('coverLetterDraft')}</h3>
        <time
          dateTime={coverLetter.updatedAt}
          className="tabular-nums ml-auto text-xs text-text-muted"
        >
          {t('coverLetterSavedAt', {
            date: formatDateTime(coverLetter.updatedAt, locale) ?? '—',
          })}
        </time>
      </div>
      <Textarea
        value={draft}
        onChange={(event) => setLocalDraft(event.target.value)}
        rows={5}
        aria-label={t('coverLetterLabel')}
        className="min-h-28 text-sm leading-[1.45]"
      />
      <div className="flex items-center gap-2">
        {hasMatch ? (
          regenerateButton
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <span>{regenerateButton}</span>
            </TooltipTrigger>
            <TooltipContent>{t('coverLetterRegenerateNoMatchHint')}</TooltipContent>
          </Tooltip>
        )}
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={!dirty || saveMutation.isPending}
          onClick={() => saveMutation.mutate()}
        >
          {t('coverLetterSave')}
        </Button>
        {dirty && <span className="text-xs text-warning">{t('coverLetterDirty')}</span>}
      </div>
    </div>
  );
}
