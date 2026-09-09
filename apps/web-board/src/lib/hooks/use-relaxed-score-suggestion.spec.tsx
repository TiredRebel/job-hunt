/**
 * @module lib/hooks/use-relaxed-score-suggestion.spec
 *
 * Covers the branchy bits: no suggestion without an active score filter,
 * no suggestion while disabled, and a real suggestion once the relaxed
 * query resolves with a non-zero total.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useRelaxedScoreSuggestion } from './use-relaxed-score-suggestion';

vi.mock('@/lib/api/jobs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/jobs')>();
  return { ...actual, listJobs: vi.fn() };
});

const { listJobs } = await import('@/lib/api/jobs');
const listJobsMock = vi.mocked(listJobs);

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('useRelaxedScoreSuggestion', () => {
  it('returns undefined when there is no active score filter', () => {
    const { result } = renderHook(() => useRelaxedScoreSuggestion({}, true), { wrapper });
    expect(result.current).toBeUndefined();
    expect(listJobsMock).not.toHaveBeenCalled();
  });

  it('returns undefined while disabled, even with a score filter', () => {
    const { result } = renderHook(() => useRelaxedScoreSuggestion({ scoreMin: 80 }, false), {
      wrapper,
    });
    expect(result.current).toBeUndefined();
    expect(listJobsMock).not.toHaveBeenCalled();
  });

  it('suggests the relaxed floor once the probe query resolves with results', async () => {
    listJobsMock.mockResolvedValue({
      items: [],
      total: 48,
      highFit: 0,
      inMotion: 0,
      unreviewed: 0,
    } as never);

    const { result } = renderHook(() => useRelaxedScoreSuggestion({ scoreMin: 90 }, true), {
      wrapper,
    });

    await waitFor(() => expect(result.current).toEqual({ scoreMin: 70, count: 48 }));
    expect(listJobsMock).toHaveBeenCalledWith(
      expect.objectContaining({ scoreMin: 70, limit: 1 }),
      expect.anything(),
    );
  });

  it('returns undefined when the relaxed floor still finds nothing', async () => {
    listJobsMock.mockResolvedValue({
      items: [],
      total: 0,
      highFit: 0,
      inMotion: 0,
      unreviewed: 0,
    } as never);

    const { result } = renderHook(() => useRelaxedScoreSuggestion({ scoreMin: 10 }, true), {
      wrapper,
    });

    await waitFor(() => expect(listJobsMock).toHaveBeenCalled());
    expect(result.current).toBeUndefined();
  });
});
