'use client';

/**
 * @module components/jobs/job-table
 *
 * Dense, virtualized jobs table (jobs-dashboard spec "Filterable jobs
 * table"). TanStack Table in fully manual mode — sorting/filtering/paging
 * all derive from the URL and refetch server-side; this component only
 * renders and reports interaction intents upward. Rows above 200 are
 * virtualized with `@tanstack/react-virtual` while keeping real
 * `<table>`/`<tr>`/`<td>` semantics (design.md D6, UI_DESIGN §8).
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
import { ChevronDown, ChevronUp, ChevronsUpDown, SlidersHorizontal } from 'lucide-react';
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
import { useRouter } from '@/i18n/navigation';
import type { JobsListParams, JobSortBy } from '@/lib/api/jobs';
import type { Locale } from '@job-hunter/shared-ts';

import { buildJobColumns, type JobColumnsTranslations, type JobRow } from './job-table-columns';

/** Row height in px — matches UI_DESIGN's 36px compact density. */
const ROW_HEIGHT = 36;

/** Row count above which the table switches to virtualized rendering. */
const VIRTUALIZE_THRESHOLD = 200;

/** TanStack Table column ids that map onto an API `sortBy` value. */
const SORTABLE_COLUMN_TO_API: Record<string, JobSortBy> = {
  score: 'score',
  posted: 'posted',
  salary: 'salary',
};

const SORTABLE_COLUMN_IDS = new Set(Object.keys(SORTABLE_COLUMN_TO_API));

/** Props accepted by {@link JobTable}. */
export interface JobTableProps {
  readonly rows: readonly JobRow[];
  readonly params: JobsListParams;
  readonly rowSelection: RowSelectionState;
  readonly onRowSelectionChange: OnChangeFn<RowSelectionState>;
  readonly focusedJobId: string | null;
  readonly onFocusRow: (jobId: string) => void;
  readonly onOpenJob: (jobId: string, fullPage: boolean) => void;
  readonly onDeleteJob: (job: JobRow) => void;
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
  params,
  rowSelection,
  onRowSelectionChange,
  focusedJobId,
  onFocusRow,
  onOpenJob,
  onDeleteJob,
  scrollContainerRef,
  locale,
}: JobTableProps) {
  const t = useTranslations('jobs');
  const router = useRouter();
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const translations: JobColumnsTranslations = useMemo(
    () => ({
      columns: (key) => t(`columns.${key}`),
      moreTags: (count) => t('moreTags', { count }),
      selectRow: t('columns.select'),
      selectAll: t('columns.selectAll'),
      deleteAction: t('delete.action'),
      deleteJob: (title) => t('delete.actionLabel', { title }),
    }),
    [t],
  );

  const columns = useMemo<ColumnDef<JobRow>[]>(
    () => buildJobColumns(translations, locale, { onDeleteJob }),
    [translations, locale, onDeleteJob],
  );

  const sorting: SortingState = useMemo(() => {
    if (!params.sortBy || !SORTABLE_COLUMN_IDS.has(params.sortBy)) {
      return [];
    }
    return [{ id: params.sortBy, desc: params.sortDir !== 'asc' }];
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
    router.replace(`${window.location.pathname}?${searchParams.toString()}`, { scroll: false });
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
  const shouldVirtualize = tableRows.length > VIRTUALIZE_THRESHOLD;

  const virtualizer = useVirtualizer({
    count: tableRows.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 12,
    enabled: shouldVirtualize,
  });

  const virtualItems = shouldVirtualize ? virtualizer.getVirtualItems() : null;
  const totalSize = shouldVirtualize ? virtualizer.getTotalSize() : undefined;

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
    return (
      <TableRow
        key={row.id}
        data-state={row.getIsSelected() ? 'selected' : undefined}
        data-focused={focusedJobId === row.original.id || undefined}
        tabIndex={-1}
        onClick={handleRowClick(row.original.id)}
        style={{ height: ROW_HEIGHT }}
        className="cursor-pointer hover:bg-accent-soft/35 data-[focused]:bg-accent-soft/55 data-[focused]:outline data-[focused]:outline-1 data-[focused]:outline-accent"
      >
        {row.getVisibleCells().map((cell) => (
          <TableCell
            key={cell.id}
            style={{ width: cell.column.getSize() }}
            className="py-1.5 text-sm"
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        ))}
      </TableRow>
    );
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-b border-border bg-surface-elevated/45 px-3 py-2">
        <span className="utility-label text-text-muted">
          {t('dashboard.results', { count: rows.length })}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="gap-1.5 text-text-muted">
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
                        className="flex items-center gap-1 text-xs font-medium text-text-muted hover:text-text-primary"
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
          {shouldVirtualize && virtualItems && virtualItems.length > 0 && (
            <tr aria-hidden="true">
              <td
                colSpan={columns.length}
                style={{ height: virtualItems[0]?.start ?? 0, padding: 0 }}
              />
            </tr>
          )}
          {shouldVirtualize
            ? virtualItems?.map((virtualRow) => renderRow(virtualRow.index))
            : tableRows.map((_, index) => renderRow(index))}
          {shouldVirtualize &&
            virtualItems &&
            virtualItems.length > 0 &&
            totalSize !== undefined && (
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
