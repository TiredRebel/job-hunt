import { beforeEach, describe, expect, it, vi } from 'vitest';

import { listJobs, type Job, type PaginatedJobs } from '@/lib/api/jobs';

import { listAllStageJobs } from './stage-board';

vi.mock('@/lib/api/jobs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/jobs')>();
  return { ...actual, listJobs: vi.fn() };
});

const job = (id: string) => ({ id }) as Job;
const page = (items: Job[], total: number): PaginatedJobs => ({
  items,
  total,
  highFit: 0,
  inMotion: 0,
  unreviewed: 0,
});

describe('listAllStageJobs', () => {
  beforeEach(() => vi.mocked(listJobs).mockReset());

  it('loads subsequent pages until the stage total is reached', async () => {
    vi.mocked(listJobs)
      .mockResolvedValueOnce(page([job('1')], 2))
      .mockResolvedValueOnce(page([job('2')], 2));

    await expect(listAllStageJobs('saved')).resolves.toMatchObject({
      items: [{ id: '1' }, { id: '2' }],
      total: 2,
    });
    expect(listJobs).toHaveBeenNthCalledWith(
      2,
      { reaction: ['saved'], limit: 100, offset: 1, sortBy: 'board' },
      undefined,
    );
  });
});
