/**
 * @module components/profile/profile-form.spec
 *
 * Structural regressions for the Profile design-handoff layout.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { Profile } from '@/lib/api/profiles';
import { queryKeys } from '@/lib/api/query-keys';

import { ProfileForm } from '@/components/profile/profile-form';

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
    cvMd: null,
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
  };
}

describe('ProfileForm', () => {
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
});
