/**
 * @module components/jobs/bulk-action-bar.spec
 *
 * Bulk action bar: no confirm dialogs; destructive actions fire immediately
 * (docs/jobs-redesign.md §2.3).
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { BulkActionBar, type BulkActionBarProps } from './bulk-action-bar';

vi.mock('next-intl', () => ({
  useTranslations:
    () =>
    (key: string): string =>
      key,
}));

function renderBar(overrides: Partial<BulkActionBarProps> = {}) {
  const props: BulkActionBarProps = {
    count: 2,
    pending: false,
    onMarkApplied: vi.fn(),
    onSave: vi.fn(),
    onSetStage: vi.fn(),
    onReject: vi.fn(),
    onHide: vi.fn(),
    onDelete: vi.fn(),
    onClear: vi.fn(),
    ...overrides,
  };
  render(<BulkActionBar {...props} />);
  return props;
}

describe('BulkActionBar', () => {
  it('returns null when nothing is selected', () => {
    const { container } = render(
      <BulkActionBar
        count={0}
        pending={false}
        onMarkApplied={vi.fn()}
        onSave={vi.fn()}
        onSetStage={vi.fn()}
        onReject={vi.fn()}
        onHide={vi.fn()}
        onDelete={vi.fn()}
        onClear={vi.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('fires onDelete immediately without a confirm step', () => {
    const props = renderBar();
    fireEvent.click(screen.getByText('bulk.delete'));
    expect(props.onDelete).toHaveBeenCalledOnce();
  });

  it('fires onReject immediately without a confirm step', () => {
    const props = renderBar();
    fireEvent.click(screen.getByText('bulk.reject'));
    expect(props.onReject).toHaveBeenCalledOnce();
  });

  it('docks to the bottom of the list surface', () => {
    renderBar();
    const toolbar = screen.getByRole('toolbar');
    expect(toolbar.parentElement?.className).toContain('absolute');
    expect(toolbar.parentElement?.className).toContain('bottom-0');
  });
});
