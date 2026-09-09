import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FilterBar } from './filter-bar';

const replace = vi.fn();
let searchParams = new URLSearchParams();

vi.mock('next-intl', () => ({
  useTranslations:
    () =>
    (key: string): string =>
      key,
}));

vi.mock('next/navigation', () => ({
  useSearchParams: () => searchParams,
}));

vi.mock('@/i18n/navigation', () => ({
  usePathname: () => '/en/jobs',
  useRouter: () => ({ replace }),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: [] }),
}));

vi.mock('@/components/jobs/multi-select', () => ({ MultiSelect: () => null }));
vi.mock('@/components/jobs/tags-input', () => ({ TagsInput: () => null }));
vi.mock('@/components/ui/slider', () => ({ Slider: () => null }));
vi.mock('@/components/ui/select', () => ({
  Select: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectTrigger: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectValue: () => null,
}));
vi.mock('@/components/ui/popover', () => ({
  Popover: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  PopoverContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  PopoverTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock('@/components/ui/sheet', () => ({
  Sheet: ({ open, children }: { open: boolean; children: ReactNode }) =>
    open ? <div>{children}</div> : null,
  SheetContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SheetTitle: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SheetDescription: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

describe('FilterBar chip + advanced panel', () => {
  beforeEach(() => {
    replace.mockReset();
    searchParams = new URLSearchParams();
  });

  it('opens the advanced panel from Filters and exposes live date controls', () => {
    render(<FilterBar params={{}} />);

    expect(screen.queryByLabelText('filters.dateFrom')).toBeNull();
    fireEvent.click(screen.getByText('filters.open'));
    expect(screen.getByLabelText('filters.dateFrom')).toBeDefined();
    expect(screen.getByLabelText('filters.dateTo')).toBeDefined();
    expect(screen.getByText('filters.reset')).toBeDefined();
  });

  it('serializes inclusive custom date endpoints and preserves an open drawer', () => {
    searchParams = new URLSearchParams('job=job-1');
    render(<FilterBar params={{}} />);

    fireEvent.click(screen.getByText('filters.open'));
    fireEvent.change(screen.getByLabelText('filters.dateFrom'), {
      target: { value: '2026-08-01' },
    });
    let href = String(replace.mock.lastCall?.[0]);
    expect(new URL(href, 'http://test').searchParams.get('dateFrom')).toBe(
      '2026-08-01T00:00:00.000Z',
    );
    expect(new URL(href, 'http://test').searchParams.get('job')).toBe('job-1');

    fireEvent.change(screen.getByLabelText('filters.dateTo'), {
      target: { value: '2026-08-02' },
    });
    href = String(replace.mock.lastCall?.[0]);
    expect(new URL(href, 'http://test').searchParams.get('dateTo')).toBe(
      '2026-08-02T23:59:59.999Z',
    );
  });

  it('shows Clear all only when two or more chips are active', () => {
    const { rerender } = render(<FilterBar params={{ query: 'python', remote: ['remote'] }} />);
    expect(screen.getByText('filters.clearAll')).toBeDefined();

    rerender(<FilterBar params={{ query: 'python' }} />);
    expect(screen.queryByText('filters.clearAll')).toBeNull();
  });
});
