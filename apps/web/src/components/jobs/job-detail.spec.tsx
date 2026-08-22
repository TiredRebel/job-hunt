/**
 * @module components/jobs/job-detail.spec
 *
 * Rendering regressions for publication metadata in the shared job detail.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { JobDetail } from '@/lib/api/jobs';
import { queryKeys } from '@/lib/api/query-keys';

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
    matchExplanation: null,
    matchedSkills: [],
    missingSkills: [],
  };
}

describe('JobDetailView posted date', () => {
  it('renders first seen instead of a missing marker when postedAt is absent', () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    });
    client.setQueryData(queryKeys.jobs.detail('1'), makeJob());

    render(
      <QueryClientProvider client={client}>
        <JobDetailView jobId="1" variant="drawer" />
      </QueryClientProvider>,
    );

    const posted = screen.getByText(/^posted:/);
    expect(posted.textContent).toContain('2026');
    expect(posted.textContent).not.toContain('—');
  });
});
