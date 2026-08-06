/**
 * @module components/sources/sources-page.spec
 *
 * Unit coverage for `sourceRunCounts` plus component coverage for the
 * per-source jobs-health summary line (sources-admin spec): summary renders
 * when the reconciliation endpoint succeeds, rows look up their own buckets
 * by `sourceId`, and the page degrades gracefully (no summary line) when
 * the endpoint fails.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/lib/api/client';
import { getSourceReconciliation, type SourceReconciliation } from '@/lib/api/reconciliation';
import { deleteSource, listAdapters, listSources, type Source } from '@/lib/api/sources';

import { SourcesPageClient, sourceRunCounts } from './sources-page';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));

vi.mock('@/lib/api/sources', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api/sources')>()),
  listSources: vi.fn(),
  listAdapters: vi.fn(),
  getSourceRuns: vi.fn(),
  setSourceEnabled: vi.fn(),
  testSource: vi.fn(),
  triggerScrape: vi.fn(),
  deleteSource: vi.fn(),
}));

vi.mock('@/lib/api/reconciliation', () => ({
  getSourceReconciliation: vi.fn(),
}));

// Radix tooltip needs a provider + portal; irrelevant to these assertions.
vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
  TooltipContent: () => null,
}));

vi.mock('./source-form-dialog', () => ({
  SourceFormDialog: () => null,
}));

/**
 * Build a source fixture with sensible defaults.
 *
 * @param overrides - Fields to override.
 * @returns Source fixture.
 */
function makeSource(overrides: Partial<Source> = {}): Source {
  return {
    id: 1,
    slug: 'dou',
    name: 'DOU',
    baseUrl: 'https://jobs.dou.ua',
    enabled: true,
    fetchStrategy: 'api',
    config: {},
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

/**
 * Build a per-source reconciliation row fixture with sensible defaults.
 *
 * @param overrides - Fields to override.
 * @returns Reconciliation row fixture.
 */
function makeReconciliationRow(
  overrides: Partial<SourceReconciliation> = {},
): SourceReconciliation {
  return {
    sourceId: 1,
    sourceSlug: 'dou',
    rawTotal: 42,
    processed: 28,
    pending: 2,
    failed: 1,
    visibleJobs: 27,
    hiddenJobs: 1,
    ...overrides,
  };
}

/**
 * Render the sources page inside a fresh QueryClient (retries disabled so
 * the failure test settles immediately).
 *
 * @returns The render result.
 */
function renderSourcesPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <SourcesPageClient />
    </QueryClientProvider>,
  );
}

describe('sourceRunCounts', () => {
  it('maps scraper discovery and insertion counters to the source-history labels', () => {
    expect(sourceRunCounts({ discovered: 72, inserted: 3 })).toEqual({ found: 72, neu: 3 });
  });

  it('continues to read the legacy API counter names', () => {
    expect(sourceRunCounts({ found: 4, new: 2 })).toEqual({ found: 4, neu: 2 });
  });
});

describe('SourcesPageClient jobs-health summary', () => {
  beforeEach(() => {
    vi.mocked(listSources).mockReset();
    vi.mocked(listAdapters).mockReset();
    vi.mocked(getSourceReconciliation).mockReset();
    vi.mocked(listAdapters).mockResolvedValue(['dou', 'workua']);
  });

  it('renders the summary line when the reconciliation endpoint succeeds', async () => {
    vi.mocked(listSources).mockResolvedValue([makeSource()]);
    vi.mocked(getSourceReconciliation).mockResolvedValue([makeReconciliationRow()]);

    renderSourcesPage();

    const raw = await screen.findByText('jobsSummary.raw: 42');
    expect(raw).toBeDefined();
    expect(screen.getByText('jobsSummary.processed: 28')).toBeDefined();
    expect(screen.getByText('jobsSummary.pending: 2')).toBeDefined();
    expect(screen.getByText('jobsSummary.failed: 1')).toBeDefined();
    expect(screen.getByText('jobsSummary.hidden: 1')).toBeDefined();
  });

  it('matches each row to its own buckets by sourceId', async () => {
    vi.mocked(listSources).mockResolvedValue([
      makeSource({ id: 1, slug: 'dou', name: 'DOU' }),
      makeSource({ id: 2, slug: 'workua', name: 'Work.ua' }),
    ]);
    // Deliberately out of source order to prove lookup is by id, not index.
    vi.mocked(getSourceReconciliation).mockResolvedValue([
      makeReconciliationRow({ sourceId: 2, sourceSlug: 'workua', rawTotal: 7, processed: 5 }),
      makeReconciliationRow({ sourceId: 1, sourceSlug: 'dou', rawTotal: 42, processed: 28 }),
    ]);

    renderSourcesPage();

    const douRaw = await screen.findByText('jobsSummary.raw: 42');
    expect(douRaw.closest('div')?.textContent).toContain('dou');
    const workuaRaw = screen.getByText('jobsSummary.raw: 7');
    expect(workuaRaw.closest('div')?.textContent).toContain('workua');
  });

  it('omits the summary line when the reconciliation endpoint fails', async () => {
    vi.mocked(listSources).mockResolvedValue([makeSource()]);
    vi.mocked(getSourceReconciliation).mockRejectedValue(new Error('502'));

    renderSourcesPage();

    // Sources still render normally with their existing controls.
    await screen.findByText('DOU');
    await waitFor(() => {
      expect(vi.mocked(getSourceReconciliation)).toHaveBeenCalledOnce();
    });
    expect(screen.queryByText(/jobsSummary\.raw/)).toBeNull();
  });
});

describe('SourcesPageClient delete action', () => {
  beforeEach(() => {
    vi.mocked(listSources).mockReset();
    vi.mocked(listAdapters).mockReset();
    vi.mocked(getSourceReconciliation).mockReset();
    vi.mocked(deleteSource).mockReset();
    vi.mocked(listAdapters).mockResolvedValue(['dou']);
    vi.mocked(getSourceReconciliation).mockResolvedValue([]);
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it('deletes the source and refreshes the list on confirm', async () => {
    vi.mocked(listSources).mockResolvedValue([makeSource()]);
    vi.mocked(deleteSource).mockResolvedValue({ deleted: true });
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderSourcesPage();
    fireEvent.click(await screen.findByLabelText('deleteLabel'));

    await waitFor(() => {
      expect(deleteSource).toHaveBeenCalledWith('dou');
    });
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('deleteSuccess');
    });
    // Cache invalidation refetches the list.
    await waitFor(() => {
      expect(vi.mocked(listSources)).toHaveBeenCalledTimes(2);
    });
  });

  it('makes no request when the confirmation is dismissed', async () => {
    vi.mocked(listSources).mockResolvedValue([makeSource()]);
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    renderSourcesPage();
    fireEvent.click(await screen.findByLabelText('deleteLabel'));

    // Wait for the guard to actually run (mutate() is async) before asserting
    // the negative, or this passes vacuously regardless of the guard.
    await waitFor(() => {
      expect(confirmSpy).toHaveBeenCalled();
    });
    expect(deleteSource).not.toHaveBeenCalled();
  });

  it('shows the server error and leaves the source unchanged on 409', async () => {
    vi.mocked(listSources).mockResolvedValue([makeSource()]);
    const serverMessage = "Source 'dou' has associated jobs or scrape runs and cannot be deleted";
    vi.mocked(deleteSource).mockRejectedValue(
      new ApiError(409, { message: serverMessage }, serverMessage),
    );
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderSourcesPage();
    fireEvent.click(await screen.findByLabelText('deleteLabel'));

    await waitFor(() => {
      expect(deleteSource).toHaveBeenCalledWith('dou');
    });
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(serverMessage);
    });
    expect(screen.getByText('DOU')).toBeDefined();
  });
});
