/**
 * @module components/jobs/job-table-columns
 *
 * Column definitions for {@link JobTable} (jobs-dashboard + redesign §3.1).
 */
import type { ColumnDef } from '@tanstack/react-table';

import { JobRowActions } from '@/components/jobs/job-row-actions';
import { ScoreMeter } from '@/components/jobs/score-meter';
import { StageBadge, STAGE_PICKER_OPTIONS } from '@/components/stage-badge';
import { Checkbox } from '@/components/ui/checkbox';
import type { Locale } from '@job-hunter/shared-ts';
import type { PaginatedJobs } from '@/lib/api/jobs';
import { formatPostedDate, formatSalary } from '@/lib/formatters';

/** A single row's data — one item from the jobs list response. */
export type JobRow = PaginatedJobs['items'][number];

/** Translator function shape needed to build column headers/cells. */
export interface JobColumnsTranslations {
  readonly columns: (
    key: 'score' | 'job' | 'source' | 'salary' | 'tags' | 'posted' | 'stage' | 'actions',
  ) => string;
  readonly moreTags: (count: number) => string;
  readonly selectRow: string;
  readonly selectAll: string;
}

/** Callbacks emitted by row actions. */
export interface JobColumnsActions {
  readonly onDeleteJob: (job: JobRow) => void;
  readonly onHideJob: (job: JobRow) => void;
  readonly onCopyLink: (job: JobRow) => void;
  readonly onStageChange: (job: JobRow, stage: (typeof STAGE_PICKER_OPTIONS)[number]) => void;
}

/**
 * Build the jobs table's column definitions.
 *
 * @param t - Column header/cell translations.
 * @param locale - Active locale, for date/salary formatting.
 * @param actions - Row action callbacks.
 * @returns The column definitions, in display order.
 */
export function buildJobColumns(
  t: JobColumnsTranslations,
  locale: Locale,
  actions: JobColumnsActions,
): ColumnDef<JobRow>[] {
  return [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(checked) => table.toggleAllPageRowsSelected(Boolean(checked))}
          aria-label={t.selectAll}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(checked) => row.toggleSelected(Boolean(checked))}
          onClick={(event) => event.stopPropagation()}
          aria-label={t.selectRow}
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 32,
    },
    {
      id: 'score',
      accessorKey: 'matchScore',
      header: t.columns('score'),
      cell: ({ row }) => <ScoreMeter score={row.original.matchScore} />,
      enableSorting: true,
      size: 88,
    },
    {
      id: 'title',
      accessorKey: 'title',
      header: t.columns('job'),
      cell: ({ row }) => (
        <div className="flex min-w-0 flex-col">
          <span
            className="truncate text-[14px] font-medium text-[var(--text-primary)]"
            title={row.original.title}
          >
            {row.original.title}
          </span>
          {row.original.company && (
            <span
              className="truncate text-xs text-[var(--text-secondary)]"
              title={row.original.company}
            >
              {row.original.company}
            </span>
          )}
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
      size: 260,
    },
    {
      id: 'source',
      accessorKey: 'sourceSlug',
      header: t.columns('source'),
      cell: ({ row }) => (
        <span className="text-[var(--text-secondary)]">{row.original.sourceSlug}</span>
      ),
      enableSorting: false,
      size: 90,
    },
    {
      id: 'salary',
      accessorKey: 'salaryMax',
      header: t.columns('salary'),
      cell: ({ row }) => {
        const value = row.original.salaryMax ?? row.original.salaryMin;
        const formatted = formatSalary(value, row.original.salaryCurrency, locale);
        return <span className="tabular-nums">{formatted ?? '—'}</span>;
      },
      enableSorting: true,
      size: 110,
    },
    {
      id: 'tags',
      accessorKey: 'tags',
      header: t.columns('tags'),
      cell: ({ row }) => {
        const tags = row.original.tags;
        const visible = tags.slice(0, 3);
        const rest = tags.length - visible.length;
        return (
          <div className="flex items-center gap-1">
            {visible.map((tag) => (
              <span
                key={tag}
                className="rounded-[var(--radius-sm)] bg-[var(--surface-sunken)] px-1.5 py-0.5 text-xs text-[var(--text-secondary)]"
              >
                {tag}
              </span>
            ))}
            {rest > 0 && (
              <span className="text-xs text-[var(--text-secondary)]">{t.moreTags(rest)}</span>
            )}
          </div>
        );
      },
      enableSorting: false,
      size: 180,
    },
    {
      id: 'posted',
      accessorKey: 'postedAt',
      header: t.columns('posted'),
      cell: ({ row }) => (
        <span className="tabular-nums text-[var(--text-secondary)]">
          {formatPostedDate(row.original.postedAt, row.original.firstSeenAt, locale) ?? '—'}
        </span>
      ),
      enableSorting: true,
      sortDescFirst: true,
      size: 100,
    },
    {
      id: 'stage',
      accessorKey: 'currentReaction',
      header: t.columns('stage'),
      cell: ({ row }) => (
        <StageBadge
          stage={row.original.currentReaction}
          onStageChange={(next) => actions.onStageChange(row.original, next)}
        />
      ),
      enableSorting: false,
      size: 120,
    },
    {
      id: 'actions',
      header: t.columns('actions'),
      cell: ({ row }) => (
        <JobRowActions
          title={row.original.title}
          sourceUrl={row.original.url ?? null}
          onCopyLink={() => actions.onCopyLink(row.original)}
          onHide={() => actions.onHideJob(row.original)}
          onDelete={() => actions.onDeleteJob(row.original)}
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 48,
    },
  ];
}
