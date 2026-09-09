/**
 * @module components/jobs/jobs-client.spec
 *
 * Bulk-delete soft window: selection clears immediately; undo cancels the
 * delayed API commit (docs/jobs-redesign.md §2.3).
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

import { deleteJobs } from '@/lib/api/jobs';
import type { JobsListParams, PaginatedJobs } from '@/lib/api/jobs';

import { JobsClient } from './jobs-client';
import type { JobRow } from './job-table-columns';

const replace = vi.fn();
let searchParams = new URLSearchParams('view=unreviewed');

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

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

vi.mock('@/components/jobs/filter-bar', () => ({ FilterBar: () => null }));
vi.mock('@/components/jobs/jobs-dashboard-summary', () => ({
  JobsDashboardSummary: () => null,
}));
vi.mock('@/components/jobs/jobs-pagination', () => ({ JobsPagination: () => null }));
vi.mock('@/components/jobs/jobs-empty-state', () => ({ JobsEmptyState: () => null }));
vi.mock('@/components/jobs/shortcuts-dialog', () => ({ ShortcutsDialog: () => null }));
vi.mock('@/components/jobs/jobs-context-column', () => ({ JobsContextColumn: () => null }));
vi.mock('@/components/jobs/jobs-page-header', () => ({ JobsPageHeader: () => null }));
vi.mock('@/components/jobs/detail-pane', () => ({ DetailPane: () => null }));
vi.mock('@/components/jobs/focus-mode', () => ({ FocusMode: () => null }));
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
    sourceSlug: 'workua',
    externalId: 'external-1',
    url: 'https://www.work.ua/jobs/1/',
    title: 'Python Engineer',
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
    currentReactionAt: null,
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
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.mocked(deleteJobs).mockReset();
    replace.mockReset();
    searchParams = new URLSearchParams('view=unreviewed');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('clears the selection immediately and commits delete after the undo window', async () => {
    vi.mocked(deleteJobs).mockResolvedValue({ deleted: 2 });
    renderClient([makeRow({ id: '1' }), makeRow({ id: '2' })]);

    fireEvent.click(await screen.findByText('select-1'));
    fireEvent.click(screen.getByText('select-2'));
    expect(screen.getByRole('status').textContent).toBe('bulk.selected:{"count":2}');

    fireEvent.click(screen.getByText('bulk.delete'));

    await waitFor(() => {
      expect(screen.queryByText(/bulk\.selected/)).toBeNull();
    });
    expect(deleteJobs).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(8000);
    });

    await waitFor(() => {
      expect(deleteJobs).toHaveBeenCalledWith(['1', '2']);
    });
  });

  it('preserves the selection when bulk delete is never armed (no selection)', () => {
    renderClient([makeRow({ id: '1' })]);
    expect(screen.queryByText('bulk.delete')).toBeNull();
  });
});
