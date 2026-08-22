/**
 * @module components/profile/profile-form.spec
 *
 * Structural regressions for the Profile design-handoff layout.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Profile } from '@/lib/api/profiles';
import { queryKeys } from '@/lib/api/query-keys';

import { ProfileForm } from '@/components/profile/profile-form';

const updateProfileMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/api/profiles', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/profiles')>();
  return { ...actual, updateProfile: updateProfileMock };
});

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string) => key,
}));

vi.stubGlobal(
  'ResizeObserver',
  class ResizeObserver {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  },
);

function makeProfile(): Profile {
  return {
    id: 1,
    name: 'default',
    cvMd: 'English CV',
    cvLanguage: 'en',
    cvMdByLanguage: { en: 'English CV', uk: 'Українське CV' },
    skills: ['TypeScript'],
    preferences: {
      seniorities: ['senior'],
      locations: ['Remote'],
      remote: ['remote'],
      stopWords: ['gambling'],
    },
    isActive: true,
    createdAt: '2026-07-19T09:29:48.180Z',
    updatedAt: '2026-07-20T19:19:32.552Z',
  } as Profile;
}

describe('ProfileForm', () => {
  beforeEach(() => {
    updateProfileMock.mockReset();
  });

  it('uses the handoff editor-and-completeness-rail layout', () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    });
    client.setQueryData(queryKeys.profiles.active, makeProfile());

    const { container } = render(
      <QueryClientProvider client={client}>
        <ProfileForm />
      </QueryClientProvider>,
    );

    expect(container.querySelector('form')?.classList.contains('max-w-[1040px]')).toBe(true);
    expect(screen.getByRole('complementary')).toBeTruthy();
    expect(
      screen.getByRole('heading', { name: 'skills' }).classList.contains('utility-label'),
    ).toBe(true);
    expect(screen.getByText('completeness')).toBeTruthy();
  });

  it('switches between saved CV language variants without losing either value', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    });
    client.setQueryData(queryKeys.profiles.active, makeProfile());

    render(
      <QueryClientProvider client={client}>
        <ProfileForm />
      </QueryClientProvider>,
    );

    const selector = screen.getByLabelText('cvLanguage');
    const editor = screen.getByLabelText('cv') as HTMLTextAreaElement;
    expect(editor.value).toBe('English CV');

    fireEvent.change(selector, { target: { value: 'uk' } });
    expect(editor.value).toBe('Українське CV');

    fireEvent.change(editor, { target: { value: 'Оновлене українське CV' } });
    fireEvent.change(selector, { target: { value: 'en' } });
    expect(editor.value).toBe('English CV');

    fireEvent.change(selector, { target: { value: 'uk' } });
    expect(editor.value).toBe('Оновлене українське CV');

    updateProfileMock.mockResolvedValue(makeProfile());
    fireEvent.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() =>
      expect(updateProfileMock).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({
          cvMd: 'Оновлене українське CV',
          cvLanguage: 'uk',
          cvMdByLanguage: {
            en: 'English CV',
            uk: 'Оновлене українське CV',
          },
        }),
      ),
    );
  });

  it('does not copy a Ukrainian-only CV into the English variant', () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    });
    client.setQueryData(queryKeys.profiles.active, {
      ...makeProfile(),
      cvMd: 'Українське CV',
      cvLanguage: 'uk',
      cvMdByLanguage: { uk: 'Українське CV' },
    } as Profile);

    render(
      <QueryClientProvider client={client}>
        <ProfileForm />
      </QueryClientProvider>,
    );

    const selector = screen.getByLabelText('cvLanguage');
    const editor = screen.getByLabelText('cv') as HTMLTextAreaElement;
    expect(editor.value).toBe('Українське CV');

    fireEvent.change(selector, { target: { value: 'en' } });
    expect(editor.value).toBe('');
  });
});
