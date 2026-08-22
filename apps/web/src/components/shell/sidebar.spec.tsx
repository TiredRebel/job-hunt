/**
 * @module components/shell/sidebar.spec
 *
 * Covers the nav count badges: each renders its own resolved count (Jobs =
 * jobs-list total, Board = in-motion reaction total, Sources = source
 * count), and a badge is simply absent while its query hasn't resolved yet
 * rather than flashing a placeholder "0".
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { TooltipProvider } from '@/components/ui/tooltip';

import { Sidebar } from './sidebar';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
  usePathname: () => '/jobs',
}));

vi.mock('@/lib/api/jobs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/jobs')>();
  return { ...actual, listJobs: vi.fn() };
});
vi.mock('@/lib/api/sources', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/sources')>();
  return { ...actual, listSources: vi.fn() };
});

const { listJobs } = await import('@/lib/api/jobs');
const { listSources } = await import('@/lib/api/sources');
const listJobsMock = vi.mocked(listJobs);
const listSourcesMock = vi.mocked(listSources);

function renderSidebar() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <TooltipProvider>
        <Sidebar />
      </TooltipProvider>
    </QueryClientProvider>,
  );
}

describe('Sidebar nav counts', () => {
  it('shows each nav item its own resolved count', async () => {
    listJobsMock.mockImplementation(async (params) => {
      const total = params?.reaction ? 12 : 342;
      return { items: [], total, highFit: 0, inMotion: 0, unreviewed: 0 } as never;
    });
    listSourcesMock.mockResolvedValue([{}, {}, {}, {}] as never);

    renderSidebar();

    await waitFor(() => expect(screen.getByText('342')).toBeDefined());
    expect(screen.getByText('12')).toBeDefined();
    expect(screen.getByText('4')).toBeDefined();
  });

  it('renders no badge for a nav item whose query has not resolved', () => {
    listJobsMock.mockReturnValue(new Promise(() => {})); // never resolves
    listSourcesMock.mockReturnValue(new Promise(() => {}));

    renderSidebar();

    expect(screen.queryByText('342')).toBeNull();
    expect(screen.queryByText('0')).toBeNull();
  });
});
