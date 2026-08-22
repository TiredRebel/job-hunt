import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { JobDrawer } from './job-drawer';

const replace = vi.fn();
const sheetState = vi.hoisted(() => ({
  onCloseAutoFocus: null as null | ((event: { preventDefault: () => void }) => void),
}));

vi.mock('next-intl', () => ({
  useTranslations:
    () =>
    (key: string): string =>
      key,
}));

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams('job=job-1'),
}));

vi.mock('@/i18n/navigation', () => ({
  usePathname: () => '/en/jobs',
  useRouter: () => ({ replace }),
}));

vi.mock('@/components/jobs/job-detail', () => ({
  JobDetailView: () => <div>job detail</div>,
}));

vi.mock('@/components/ui/sheet', () => ({
  Sheet: ({
    children,
    onOpenChange,
  }: {
    children: ReactNode;
    onOpenChange: (open: boolean) => void;
  }) => (
    <div>
      <button
        type="button"
        onClick={() => {
          onOpenChange(false);
          sheetState.onCloseAutoFocus?.({ preventDefault: vi.fn() });
        }}
      >
        close drawer
      </button>
      {children}
    </div>
  ),
  SheetContent: ({
    children,
    onCloseAutoFocus,
  }: {
    children: ReactNode;
    onCloseAutoFocus: (event: { preventDefault: () => void }) => void;
  }) => {
    sheetState.onCloseAutoFocus = onCloseAutoFocus;
    return <div>{children}</div>;
  },
  SheetDescription: ({ children }: { children: ReactNode }) => <p>{children}</p>,
  SheetTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
}));

describe('JobDrawer focus restoration', () => {
  beforeAll(() => {
    vi.stubGlobal('CSS', { escape: (value: string) => value });
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  it('returns focus to the originating row after the sheet closes', () => {
    render(
      <>
        <button type="button" data-job-id="job-1">
          originating row
        </button>
        <JobDrawer />
      </>,
    );

    fireEvent.click(screen.getByText('close drawer'));

    expect(replace).toHaveBeenCalledWith('/en/jobs', { scroll: false });
    expect(document.activeElement).toBe(screen.getByText('originating row'));
  });
});
