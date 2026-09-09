import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { listDictionaries, updateDictionary } from '@/lib/api/dictionaries';

import { DictionariesPageClient } from './dict-editor';

vi.mock('next-intl', () => ({
  useTranslations:
    () =>
    (key: string, values?: Record<string, unknown>): string =>
      values ? `${key}:${JSON.stringify(values)}` : key,
}));

vi.mock('@/lib/api/dictionaries', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/dictionaries')>();
  return {
    ...actual,
    createDictionary: vi.fn(),
    deleteDictionary: vi.fn(),
    listDictionaries: vi.fn(),
    updateDictionary: vi.fn(),
  };
});

const dictionary = {
  id: 1,
  slug: 'roles',
  name: 'Roles',
  kind: 'search' as const,
  items: ['python'],
  disabledItems: [],
  appliesTo: [],
  enabled: true,
  createdAt: '2026-08-22T00:00:00.000Z',
  updatedAt: '2026-08-22T00:00:00.000Z',
};

describe('DictionariesPageClient item controls', () => {
  beforeEach(() => {
    vi.mocked(listDictionaries).mockResolvedValue([dictionary]);
    vi.mocked(updateDictionary).mockReset();
    vi.mocked(updateDictionary).mockResolvedValue(dictionary);
  });

  it('persists an item-level disabled state without deleting the item', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <DictionariesPageClient />
      </QueryClientProvider>,
    );

    fireEvent.click(await screen.findByRole('switch', { name: 'toggleItem:{"item":"python"}' }));

    await waitFor(() => {
      expect(updateDictionary).toHaveBeenCalledWith('roles', { disabledItems: ['python'] });
    });
  });
});
