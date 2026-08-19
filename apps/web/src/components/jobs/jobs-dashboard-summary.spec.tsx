/**
 * @module components/jobs/jobs-dashboard-summary.spec
 *
 * Component coverage for the reconciliation strip (jobs-dashboard spec):
 * strip renders with correct buckets, is hidden when `discovered` is 0,
 * `failed` is a link only when non-zero, and the strip is absent when the
 * reconciliation endpoint fails.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getJobsReconciliation, type JobsReconciliationAggregate } from '@/lib/api/reconciliation';

import { JobsDashboardSummary } from './jobs-dashboard-summary';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/lib/api/reconciliation', () => ({
  getJobsReconciliation: vi.fn(),
}));

/**
 * Build an aggregate fixture with sensible defaults.
 *
 * @param overrides - Fields to override.
 * @returns Aggregate fixture.
 */
function makeAggregate(
  overrides: Partial<JobsReconciliationAggregate> = {},
): JobsReconciliationAggregate {
  return {
    rawTotal: 42,
    processed: 33,
    pending: 2,
    failed: 3,
    visibleJobs: 28,
    hiddenJobs: 1,
    legacyDelta: 4,
    ...overrides,
  };
}

/**
 * Render the summary inside a fresh QueryClient (retries disabled so the
 * failure test settles immediately).
 *
 * @returns The render result.
 */
function renderSummary() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <JobsDashboardSummary total={0} highFit={0} inMotion={0} unreviewed={0} />
    </QueryClientProvider>,
  );
}

describe('JobsDashboardSummary reconciliation strip', () => {
  beforeEach(() => {
    vi.mocked(getJobsReconciliation).mockReset();
  });

  it('renders the strip with all buckets and a failed link when failed > 0', async () => {
    vi.mocked(getJobsReconciliation).mockResolvedValue(makeAggregate());

    renderSummary();

    const strip = await screen.findByTestId('jobs-reconciliation-strip');
    expect(strip.textContent).toContain('reconciliation.discovered: 42');
    expect(strip.textContent).toContain('reconciliation.processing: 2');
    expect(strip.textContent).toContain('reconciliation.failed: 3');
    expect(strip.textContent).toContain('reconciliation.hidden: 1');

    const failedLink = screen.getByRole('link', { name: 'reconciliation.failed: 3' });
    expect(failedLink.getAttribute('href')).toBe('/jobs/dead-letter');
  });

  it('renders failed as plain text, not a link, when failed is 0', async () => {
    vi.mocked(getJobsReconciliation).mockResolvedValue(makeAggregate({ failed: 0 }));

    renderSummary();

    const strip = await screen.findByTestId('jobs-reconciliation-strip');
    expect(strip.textContent).toContain('reconciliation.failed: 0');
    expect(screen.queryByRole('link', { name: 'reconciliation.failed: 0' })).toBeNull();
  });

  it('hides the strip entirely when discovered is 0', async () => {
    vi.mocked(getJobsReconciliation).mockResolvedValue(
      makeAggregate({
        rawTotal: 0,
        processed: 0,
        pending: 0,
        failed: 0,
        visibleJobs: 0,
        hiddenJobs: 0,
        legacyDelta: 0,
      }),
    );

    renderSummary();

    await waitFor(() => {
      expect(vi.mocked(getJobsReconciliation)).toHaveBeenCalledOnce();
    });
    expect(screen.queryByTestId('jobs-reconciliation-strip')).toBeNull();
  });

  it('omits the strip when the reconciliation endpoint fails, leaving the metrics row intact', async () => {
    vi.mocked(getJobsReconciliation).mockRejectedValue(new Error('502'));

    renderSummary();

    await waitFor(() => {
      expect(vi.mocked(getJobsReconciliation)).toHaveBeenCalledOnce();
    });
    expect(screen.queryByTestId('jobs-reconciliation-strip')).toBeNull();
    // The existing metrics row still renders normally.
    expect(screen.getByText('total')).toBeDefined();
  });
});
