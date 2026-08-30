'use client';

/**
 * @module components/jobs/job-table
 *
 * Virtualized jobs table (docs/jobs-redesign.md §3.1). Row height comes from
 * `--density-row`; selection and keyboard focus are visually distinct.
 */
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type OnChangeFn,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table';
import {
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  SlidersHorizontal,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState, type MouseEvent, type RefObject } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import type { JobsListParams, JobSortBy } from '@/lib/api/jobs';
import type { Locale } from '@job-hunter/shared-ts';
import { cn } from '@/lib/utils';
import { STAGE_PICKER_OPTIONS } from '@/components/stage-badge';

import { buildJobColumns, type JobColumnsTranslations, type JobRow } from './job-table-columns';

/** TanStack Table column ids that map onto an API `sortBy` value. */
const SORTABLE_COLUMN_TO_API: Record<string, JobSortBy> = {
  score: 'score',
  posted: 'posted',
  salary: 'salary',
};

const SORTABLE_COLUMN_IDS = new Set(Object.keys(SORTABLE_COLUMN_TO_API));

/** The API's sort when the request carries no `sortBy`. */
const DEFAULT_SORT_BY: JobSortBy = 'posted';

/** Props accepted by {@link JobTable}. */
export interface JobTableProps {
  readonly rows: readonly JobRow[];
  readonly total: number;
  readonly params: JobsListParams;
  readonly rowSelection: RowSelectionState;
  readonly onRowSelectionChange: OnChangeFn<RowSelectionState>;
  readonly focusedJobId: string | null;
  readonly flashJobId?: string | null;
  readonly onFocusRow: (jobId: string) => void;
  readonly onOpenJob: (jobId: string, fullPage: boolean) => void;
  readonly onDeleteJob: (job: JobRow) => void;
  readonly onHideJob: (job: JobRow) => void;
  readonly onCopyLink: (job: JobRow) => void;
  readonly onStageChange: (job: JobRow, stage: (typeof STAGE_PICKER_OPTIONS)[number]) => void;
  readonly scrollContainerRef: RefObject<HTMLDivElement | null>;
  readonly locale: Locale;
}

/**
 * Dense, virtualized jobs table.
 *
 * @param props - Job table props.
 * @returns The table element.
 */
export function JobTable({
  rows,
  total,
  params,
  rowSelection,
  onRowSelectionChange,
  focusedJobId,
  flashJobId = null,
  onFocusRow,
  onOpenJob,
  onDeleteJob,
  onHideJob,
  onCopyLink,
  onStageChange,
  scrollContainerRef,
  locale,
}: JobTableProps) {
  const t = useTranslations('jobs');
  const router = useRouter();
  const pathname = usePathname();
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const translations: JobColumnsTranslations = useMemo(
    () => ({
      columns: (key) => t(`columns.${key}`),
      moreTags: (count) => t('moreTags', { count }),
      selectRow: t('columns.select'),
      selectAll: t('columns.selectAll'),
    }),
    [t],
  );

  const columns = useMemo<ColumnDef<JobRow>[]>(
    () =>
      buildJobColumns(translations, locale, {
        onDeleteJob,
        onHideJob,
        onCopyLink,
        onStageChange,
      }),
    [translations, locale, onDeleteJob, onHideJob, onCopyLink, onStageChange],
  );

  const sorting: SortingState = useMemo(() => {
    const sortBy = params.sortBy ?? DEFAULT_SORT_BY;
    if (!SORTABLE_COLUMN_IDS.has(sortBy)) {
      return [];
    }
    return [{ id: sortBy, desc: params.sortDir !== 'asc' }];
  }, [params.sortBy, params.sortDir]);

  const handleSortingChange: OnChangeFn<SortingState> = (updaterOrValue) => {
    const next = typeof updaterOrValue === 'function' ? updaterOrValue(sorting) : updaterOrValue;
    const nextSort = next[0];
    const searchParams = new URLSearchParams(window.location.search);
    if (!nextSort) {
      searchParams.delete('sortBy');
      searchParams.delete('sortDir');
    } else {
      const apiSortBy = SORTABLE_COLUMN_TO_API[nextSort.id];
      if (apiSortBy) {
        searchParams.set('sortBy', apiSortBy);
        searchParams.set('sortDir', nextSort.desc ? 'desc' : 'asc');
      }
    }
    router.replace(`${pathname}?${searchParams.toString()}`, { scroll: false });
  };

  const table = useReactTable({
    data: rows as JobRow[],
    columns,
    state: { sorting, rowSelection, columnVisibility },
    getRowId: (row) => row.id,
    onSortingChange: handleSortingChange,
    onRowSelectionChange,
    onColumnVisibilityChange: setColumnVisibility,
    manualSorting: true,
    manualFiltering: true,
    manualPagination: true,
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
  });

  const tableRows = table.getRowModel().rows;

  const virtualizer = useVirtualizer({
    count: tableRows.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => {
      if (typeof window === 'undefined') {
        return 44;
      }
      const raw = getComputedStyle(document.documentElement).getPropertyValue('--density-row');
      const parsed = Number.parseFloat(raw);
      return Number.isFinite(parsed) ? parsed : 44;
    },
    overscan: 12,
  });

  const virtualItems = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();

  const handleRowClick =
    (jobId: string) =>
    (event: MouseEvent<HTMLTableRowElement>): void => {
      onFocusRow(jobId);
      onOpenJob(jobId, event.metaKey || event.ctrlKey);
    };

  const renderRow = (rowIndex: number) => {
    const row = tableRows[rowIndex];
    if (!row) {
      return null;
    }
    const selected = row.getIsSelected();
    const focused = focusedJobId === row.original.id;
    const flashing = flashJobId === row.original.id;
    return (
      <TableRow
        key={row.id}
        data-job-id={row.original.id}
        data-state={selected ? 'selected' : undefined}
        data-focused={focused || undefined}
        tabIndex={-1}
        onClick={handleRowClick(row.original.id)}
        style={{ height: 'var(--density-row)' }}
        className={cn(
          'group cursor-pointer border-b border-[var(--border-subtle)] hover:bg-[var(--accent-muted)]/40',
          selected && 'jh-row-selected',
          focused && !selected && 'jh-row-focused',
          flashing && 'jh-row-flash',
        )}
      >
        {row.getVisibleCells().map((cell) => (
          <TableCell
            key={cell.id}
            style={{ width: cell.column.getSize(), padding: 'var(--density-cell)' }}
            className="text-[length:var(--density-font)]"
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        ))}
      </TableRow>
    );
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--surface-sunken)]/45 px-3 py-2">
        <div className="flex items-center gap-3">
          <span className="utility-label text-[var(--text-secondary)]">
            {t('dashboard.eyebrowTable')}
          </span>
          <span className="tabular-nums text-xs text-[var(--text-secondary)]">
            {t('dashboard.resultsOf', {
              shown: rows.length,
              total,
              field: translations.columns(
                (sorting[0]?.id ?? DEFAULT_SORT_BY) as 'score' | 'posted' | 'salary',
              ),
              direction: sorting[0]?.desc === false ? '↑' : '↓',
            })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1.5 text-[var(--text-secondary)]"
              >
                <SlidersHorizontal aria-hidden="true" size={14} />
                {t('columnVisibility')}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {table
                .getAllLeafColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.getIsVisible()}
                    onCheckedChange={(checked) => column.toggleVisibility(Boolean(checked))}
                    onSelect={(event) => event.preventDefault()}
                  >
                    {column.columnDef.header as string}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button asChild size="sm">
            <Link href="/board">
              {t('dashboard.viewBoard')}
              <ArrowUpRight aria-hidden="true" size={14} />
            </Link>
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort();
                const sortDirection = header.column.getIsSorted();
                const ariaSort = !canSort
                  ? undefined
                  : sortDirection === 'asc'
                    ? 'ascending'
                    : sortDirection === 'desc'
                      ? 'descending'
                      : 'none';
                return (
                  <TableHead
                    key={header.id}
                    style={{ width: header.getSize() }}
                    aria-sort={ariaSort}
                  >
                    {canSort ? (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className="flex items-center gap-1 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {sortDirection === 'asc' && <ChevronUp aria-hidden="true" size={12} />}
                        {sortDirection === 'desc' && <ChevronDown aria-hidden="true" size={12} />}
                        {!sortDirection && (
                          <ChevronsUpDown aria-hidden="true" size={12} className="opacity-40" />
                        )}
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {virtualItems.length > 0 && (
            <tr aria-hidden="true">
              <td
                colSpan={columns.length}
                style={{ height: virtualItems[0]?.start ?? 0, padding: 0 }}
              />
            </tr>
          )}
          {virtualItems.map((virtualRow) => renderRow(virtualRow.index))}
          {virtualItems.length > 0 && (
            <tr aria-hidden="true">
              <td
                colSpan={columns.length}
                style={{
                  height: Math.max(
                    0,
                    totalSize - (virtualItems[virtualItems.length - 1]?.end ?? 0),
                  ),
                  padding: 0,
                }}
              />
            </tr>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
