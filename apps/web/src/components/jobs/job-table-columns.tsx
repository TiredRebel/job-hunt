/**
 * @module components/jobs/job-table-columns
 *
 * Column definitions for {@link JobTable} (jobs-dashboard spec §5.1 column
 * set). Sorting/filtering/pagination are manual (server-driven) — `sortingFn`
 * is unused; sorting state only drives the `sortBy`/`sortDir` URL params.
 */
import type { ColumnDef } from '@tanstack/react-table';
import { Trash2 } from 'lucide-react';

import { ScoreBadge } from '@/components/score-badge';
import { StageBadge } from '@/components/stage-badge';
import { Button } from '@/components/ui/button';
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
  readonly deleteAction: string;
  readonly deleteJob: (title: string) => string;
}

/** Callbacks emitted by destructive row actions. */
export interface JobColumnsActions {
  readonly onDeleteJob: (job: JobRow) => void;
}

/**
 * Build the jobs table's column definitions.
 *
 * @param t - Column header/cell translations.
 * @param locale - Active locale, for date/salary formatting.
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
      cell: ({ row }) => <ScoreBadge score={row.original.matchScore} />,
      enableSorting: true,
      size: 64,
    },
    {
      id: 'title',
      accessorKey: 'title',
      header: t.columns('job'),
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="truncate font-medium text-text-primary">{row.original.title}</span>
          {row.original.company && (
            <span className="truncate text-xs text-text-muted">{row.original.company}</span>
          )}
        </div>
      ),
      enableSorting: false,
      size: 260,
    },
    {
      id: 'source',
      accessorKey: 'sourceSlug',
      header: t.columns('source'),
      cell: ({ row }) => <span className="text-text-muted">{row.original.sourceSlug}</span>,
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
                className="rounded-[calc(var(--radius-control)-2px)] bg-surface-elevated px-1.5 py-0.5 text-xs text-text-muted"
              >
                {tag}
              </span>
            ))}
            {rest > 0 && <span className="text-xs text-text-muted">{t.moreTags(rest)}</span>}
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
        <span className="tabular-nums text-text-muted">
          {formatPostedDate(row.original.postedAt, row.original.firstSeenAt, locale) ?? '—'}
        </span>
      ),
      enableSorting: true,
      size: 100,
    },
    {
      id: 'stage',
      accessorKey: 'currentReaction',
      header: t.columns('stage'),
      cell: ({ row }) => <StageBadge stage={row.original.currentReaction} />,
      enableSorting: false,
      size: 110,
    },
    {
      id: 'actions',
      header: t.columns('actions'),
      cell: ({ row }) => (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 gap-1 px-2 text-text-muted hover:text-destructive"
          aria-label={t.deleteJob(row.original.title)}
          onClick={(event) => {
            event.stopPropagation();
            actions.onDeleteJob(row.original);
          }}
        >
          <Trash2 aria-hidden="true" size={15} />
          {t.deleteAction}
        </Button>
      ),
      enableSorting: false,
      enableHiding: false,
      size: 84,
    },
  ];
}
