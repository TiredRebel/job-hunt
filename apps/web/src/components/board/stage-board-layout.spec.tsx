import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { StageBoard } from './stage-board';

vi.mock('next-intl', () => ({
  useTranslations:
    () =>
    (key: string): string =>
      key,
}));

vi.mock('@/lib/hooks/use-active-profile', () => ({
  useActiveProfile: () => ({ data: { id: 1 } }),
}));

vi.mock('@/lib/api/jobs', () => ({
  deleteJob: vi.fn(),
  listJobs: vi.fn().mockResolvedValue({
    items: [],
    total: 0,
    highFit: 0,
    inMotion: 0,
    unreviewed: 0,
  }),
}));

describe('StageBoard desktop layout', () => {
  it('renders Rejected at full column width by default', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <StageBoard />
      </QueryClientProvider>,
    );

    const collapseButton = await screen.findByRole('button', {
      name: /collapseColumn.*rejected/,
    });
    const rejectedColumn = collapseButton.closest('section');
    expect(rejectedColumn?.className).toContain('min-w-52');
    expect(rejectedColumn?.className).toContain('flex-1');
    expect(rejectedColumn?.className).not.toContain('w-11');
  });
});
