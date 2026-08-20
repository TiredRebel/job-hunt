/**
 * @module components/jobs/jobs-client.spec
 *
 * Focused coverage for `JobsClient`'s bulk-delete wiring (jobs-dashboard
 * spec "Bulk stage actions" bulk-delete scenarios): selection clears on
 * success, the open drawer closes when its job was among the deleted ids,
 * and selection is preserved on failure. Heavy/unrelated child components
 * (filter bar, dashboard summary, pagination, table) are stubbed — this
 * file exercises `JobsClient`'s own mutation wiring, not their internals.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { deleteJobs } from '@/lib/api/jobs';
import type { JobsListParams, PaginatedJobs } from '@/lib/api/jobs';

import { JobsClient } from './jobs-client';
import type { JobRow } from './job-table-columns';

const replace = vi.fn();
let searchParams = new URLSearchParams();

vi.mock('next-intl', () => ({
  useTranslations:
    () =>
    (key: string, values?: Record<string, unknown>): string =>
      values ? `${key}:${JSON.stringify(values)}` : key,
}));

vi.mock('next/navigation', () => ({
  useSearchParams: () => searchParams,
}));

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
  usePathname: () => '/en/jobs',
}));

vi.mock('@/lib/hooks/use-active-profile', () => ({
  useActiveProfile: () => ({ data: { id: 1 } }),
}));

vi.mock('@/lib/api/jobs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/jobs')>();
  return { ...actual, deleteJobs: vi.fn(), deleteJob: vi.fn(), listJobs: vi.fn() };
});

vi.mock('@/components/jobs/filter-bar', () => ({ FilterBar: () => null }));
vi.mock('@/components/jobs/jobs-dashboard-summary', () => ({
  JobsDashboardSummary: () => null,
}));
vi.mock('@/components/jobs/jobs-pagination', () => ({ JobsPagination: () => null }));
vi.mock('@/components/jobs/jobs-empty-state', () => ({ JobsEmptyState: () => null }));
vi.mock('@/components/jobs/shortcuts-dialog', () => ({ ShortcutsDialog: () => null }));
vi.mock('@/components/jobs/job-drawer', () => ({ JobDrawer: () => <div>drawer-open</div> }));
vi.mock('@/components/jobs/job-table', () => ({
  JobTable: (props: {
    rows: readonly JobRow[];
    rowSelection: Record<string, boolean>;
    onRowSelectionChange: (updater: Record<string, boolean>) => void;
  }) => (
    <div>
      {props.rows.map((row) => (
        <button
          key={row.id}
          type="button"
          onClick={() => props.onRowSelectionChange({ ...props.rowSelection, [row.id]: true })}
        >
          select-{row.id}
        </button>
      ))}
    </div>
  ),
}));

function makeRow(overrides: Partial<JobRow> = {}): JobRow {
  return {
    id: '1',
    sourceId: 1,
    sourceSlug: 'dou',
    externalId: 'ext-1',
    url: 'https://example.com/1',
    title: 'Backend Engineer',
    company: null,
    descriptionMd: null,
    summary: null,
    tags: [],
    redFlags: [],
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: null,
    seniority: 'unknown',
    remote: 'unknown',
    location: null,
    postedAt: null,
    firstSeenAt: '2026-07-01T00:00:00Z',
    lastSeenAt: '2026-07-02T00:00:00Z',
    status: 'new',
    matchScore: null,
    currentReaction: null,
    ...overrides,
  } as JobRow;
}

function renderClient(items: JobRow[], params: JobsListParams = {}) {
  const initialData: PaginatedJobs = {
    items,
    total: items.length,
    highFit: 0,
    inMotion: 0,
    unreviewed: items.length,
  };
  // staleTime: Infinity — trust `initialData` and never race it with a
  // background refetch through the unconfigured `listJobs` mock.
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  return render(
    <QueryClientProvider client={client}>
      <JobsClient initialData={initialData} params={params} locale="en" />
    </QueryClientProvider>,
  );
}

describe('JobsClient bulk delete', () => {
  beforeEach(() => {
    vi.mocked(deleteJobs).mockReset();
    replace.mockReset();
    searchParams = new URLSearchParams();
  });

  it('clears the selection on a successful bulk delete', async () => {
    vi.mocked(deleteJobs).mockResolvedValue({ deleted: 2 });
    renderClient([makeRow({ id: '1' }), makeRow({ id: '2' })]);

    fireEvent.click(await screen.findByText('select-1'));
    fireEvent.click(screen.getByText('select-2'));
    expect(screen.getByText('bulk.selected:{"count":2}')).toBeDefined();

    fireEvent.click(screen.getByText('bulk.delete'));
    fireEvent.click(screen.getByText('confirm'));

    await waitFor(() => {
      expect(deleteJobs).toHaveBeenCalledWith(['1', '2']);
    });
    await waitFor(() => {
      expect(screen.queryByText(/bulk\.selected/)).toBeNull();
    });
  });

  it('closes the drawer when its open job is among the deleted ids', async () => {
    vi.mocked(deleteJobs).mockResolvedValue({ deleted: 1 });
    searchParams = new URLSearchParams('job=1');
    renderClient([makeRow({ id: '1' })]);

    fireEvent.click(await screen.findByText('select-1'));
    fireEvent.click(screen.getByText('bulk.delete'));
    fireEvent.click(screen.getByText('confirm'));

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/en/jobs', { scroll: false });
    });
  });

  it('preserves the selection when bulk delete fails', async () => {
    vi.mocked(deleteJobs).mockRejectedValue(new Error('network error'));
    renderClient([makeRow({ id: '1' }), makeRow({ id: '2' })]);

    fireEvent.click(await screen.findByText('select-1'));
    fireEvent.click(screen.getByText('select-2'));
    fireEvent.click(screen.getByText('bulk.delete'));
    fireEvent.click(screen.getByText('confirm'));

    await waitFor(() => {
      expect(deleteJobs).toHaveBeenCalledOnce();
    });
    expect(screen.getByText('bulk.selected:{"count":2}')).toBeDefined();
  });
});
