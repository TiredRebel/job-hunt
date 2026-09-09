/**
 * @module app/jobs/page.spec
 *
 * Regression coverage for the Jobs route's initial server-side data load.
 */
import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/lib/api/client';
import { listJobs } from '@/lib/api/jobs';

import JobsPage from './page';

const { refreshMock } = vi.hoisted(() => ({ refreshMock: vi.fn() }));

vi.mock('next-intl/server', () => ({
  getLocale: vi.fn().mockResolvedValue('en'),
  getTranslations: vi.fn().mockResolvedValue((key: string) => {
    const messages: Record<string, string> = {
      eyebrow: 'Data connection',
      title: 'Jobs data is unavailable',
      body: 'The workspace is online, but vacancies could not be loaded.',
      retry: 'Try again',
      sources: 'Open sources',
    };
    return messages[key] ?? key;
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('@/lib/api/jobs', () => ({
  listJobs: vi.fn(),
}));

vi.mock('@/components/jobs/jobs-client', () => ({
  JobsClient: () => <div>Jobs loaded</div>,
}));

describe('JobsPage', () => {
  beforeEach(() => {
    vi.mocked(listJobs).mockReset();
    refreshMock.mockReset();
  });

  it('renders an actionable connection state when the initial jobs request fails', async () => {
    vi.mocked(listJobs).mockRejectedValueOnce(
      new ApiError(500, { message: 'Internal server error' }),
    );

    const page = await JobsPage({ searchParams: Promise.resolve({}) });
    render(page);

    const alert = screen.getByRole('alert');
    expect(alert.textContent).toContain('Jobs data is unavailable');
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(refreshMock).toHaveBeenCalledOnce();
    expect(screen.getByRole('link', { name: 'Open sources' })).toBeDefined();
  });
});
