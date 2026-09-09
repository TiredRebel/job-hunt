/**
 * @module components/jobs/job-detail.spec
 *
 * Rendering regressions for publication metadata and handoff layout in the shared job detail.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { JobDetail } from '@/lib/api/jobs';
import { queryKeys } from '@/lib/api/query-keys';
import { TooltipProvider } from '@/components/ui/tooltip';

import { JobDetailView } from './job-detail';

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock('@/lib/hooks/use-active-profile', () => ({
  useActiveProfile: () => ({ data: { id: 1 } }),
}));

vi.mock('@/components/jobs/cover-letter-editor', () => ({ CoverLetterEditor: () => null }));
vi.mock('@/components/jobs/reaction-timeline', () => ({ ReactionTimeline: () => null }));

function makeJob(): JobDetail {
  return {
    id: '1',
    sourceId: 2,
    sourceSlug: 'workua',
    externalId: '8373417',
    url: 'https://www.work.ua/jobs/8373417/',
    title: 'Frontend Developer',
    company: 'Example Company',
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
    firstSeenAt: '2026-08-05T00:00:00Z',
    lastSeenAt: '2026-08-06T00:00:00Z',
    status: 'new',
    matchScore: null,
    currentReaction: null,
    currentReactionAt: null,
    matchExplanation: null,
    matchedSkills: [],
    missingSkills: [],
  };
}

function renderDetail() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  client.setQueryData(queryKeys.jobs.detail('1'), makeJob());

  return render(
    <QueryClientProvider client={client}>
      <TooltipProvider>
        <JobDetailView jobId="1" variant="drawer" />
      </TooltipProvider>
    </QueryClientProvider>,
  );
}

describe('JobDetailView', () => {
  it('renders first seen instead of a missing marker when postedAt is absent', () => {
    const { container } = renderDetail();

    const metadata = container.querySelector('header .utility-label');
    expect(metadata?.textContent).toContain('2026');
    expect(metadata?.textContent).not.toContain('—');
  });

  it('uses the compact handoff layout in the drawer', () => {
    const { container } = renderDetail();

    const headerClasses = container.querySelector('header')?.classList;
    expect(headerClasses?.contains('border-b')).toBe(true);
    expect(headerClasses?.contains('px-4')).toBe(true);
    expect(headerClasses?.contains('pb-4')).toBe(true);
    expect(
      screen.getByRole('heading', { name: 'summary' }).classList.contains('utility-label'),
    ).toBe(true);

    const footerClasses = container.querySelector('footer')?.classList;
    expect(footerClasses?.contains('flex')).toBe(true);
    expect(footerClasses?.contains('grid')).toBe(false);
    expect(
      screen.getByRole('button', { name: 'actionReject' }).classList.contains('bg-destructive'),
    ).toBe(true);
    expect(screen.queryByRole('button', { name: 'actionSave' })).toBeNull();
    expect(container.querySelector('footer')?.textContent).not.toContain('delete.action');
  });
});
