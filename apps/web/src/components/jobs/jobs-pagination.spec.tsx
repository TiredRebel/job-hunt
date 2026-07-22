/**
 * @module components/jobs/jobs-pagination.spec
 *
 * Component coverage for the pagination bar (jobs-dashboard spec "Jobs list
 * pagination controls"): default range readout, page-size change resets
 * offset, Previous/Next offset math and disabled bounds, and hiding when
 * there are no results.
 */
import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { JobsListParams } from '@/lib/api/jobs';

import { JobsPagination } from './jobs-pagination';

const replace = vi.fn();

vi.mock('next-intl', () => ({
  useTranslations:
    () =>
    (key: string, values?: Record<string, unknown>): string =>
      values ? `${key}:${JSON.stringify(values)}` : key,
}));

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ replace }),
  usePathname: () => '/en/jobs',
}));

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
}));

// Radix Select relies on pointer-capture/scroll APIs jsdom doesn't
// implement; mocked to a native <select> so this test exercises this
// component's onValueChange wiring, not Radix's popover mechanics (the
// same boundary jobs-dashboard-summary.spec.tsx draws around Link).
vi.mock('@/components/ui/select', () => ({
  Select: ({
    value,
    onValueChange,
    children,
  }: {
    value: string;
    onValueChange: (value: string) => void;
    children: ReactNode;
  }) => (
    <select value={value} onChange={(event) => onValueChange(event.target.value)}>
      {children}
    </select>
  ),
  SelectTrigger: () => null,
  SelectValue: () => null,
  SelectContent: ({ children }: { children: ReactNode }) => <>{children}</>,
  SelectItem: ({ value, children }: { value: string; children: ReactNode }) => (
    <option value={value}>{children}</option>
  ),
}));

function baseParams(overrides: Partial<JobsListParams> = {}): JobsListParams {
  return { limit: 20, offset: 0, ...overrides };
}

describe('JobsPagination', () => {
  beforeEach(() => {
    replace.mockReset();
  });

  it('returns null when there are no results', () => {
    const { container } = render(<JobsPagination params={baseParams()} total={0} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the default 20-per-page range', () => {
    render(<JobsPagination params={baseParams()} total={45} />);
    expect(screen.getByText('range:{"from":1,"to":20,"total":45}')).toBeDefined();
  });

  it('selecting a new page size writes limit and resets offset to 0', () => {
    render(<JobsPagination params={baseParams({ offset: 40 })} total={200} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '100' } });
    expect(replace).toHaveBeenCalledOnce();
    const [url] = replace.mock.calls[0] as [string, unknown];
    expect(url).toContain('limit=100');
    expect(url).not.toContain('offset=');
  });

  it('clicking Next advances offset by the page size', () => {
    render(<JobsPagination params={baseParams()} total={45} />);
    fireEvent.click(screen.getByLabelText('next'));
    expect(replace).toHaveBeenCalledWith('/en/jobs?offset=20', { scroll: false });
  });

  it('clicking Previous decreases offset by the page size', () => {
    render(<JobsPagination params={baseParams({ offset: 40 })} total={45} />);
    fireEvent.click(screen.getByLabelText('previous'));
    expect(replace).toHaveBeenCalledWith('/en/jobs?offset=20', { scroll: false });
  });

  it('disables Previous on the first page', () => {
    render(<JobsPagination params={baseParams()} total={45} />);
    expect((screen.getByLabelText('previous') as HTMLButtonElement).disabled).toBe(true);
  });

  it('disables Next on the last page (offset + limit >= total)', () => {
    render(<JobsPagination params={baseParams({ offset: 40 })} total={45} />);
    expect((screen.getByLabelText('next') as HTMLButtonElement).disabled).toBe(true);
  });

  it('enables both controls on a middle page', () => {
    render(<JobsPagination params={baseParams({ offset: 20 })} total={45} />);
    expect((screen.getByLabelText('previous') as HTMLButtonElement).disabled).toBe(false);
    expect((screen.getByLabelText('next') as HTMLButtonElement).disabled).toBe(false);
  });
});
