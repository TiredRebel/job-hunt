/**
 * @module components/jobs/bulk-action-bar.spec
 *
 * Component coverage for the bulk action bar's destructive controls
 * (jobs-dashboard spec "Bulk stage actions"): Delete (like Reject) requires
 * arming before it fires, and blurring the armed control resets it without
 * firing.
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
    onDelete: vi.fn(),
    onClear: vi.fn(),
    ...overrides,
  };
  render(<BulkActionBar {...props} />);
  return props;
}

describe('BulkActionBar delete control', () => {
  it('returns null when nothing is selected', () => {
    const { container } = render(
      <BulkActionBar
        count={0}
        pending={false}
        onMarkApplied={vi.fn()}
        onSave={vi.fn()}
        onSetStage={vi.fn()}
        onReject={vi.fn()}
        onDelete={vi.fn()}
        onClear={vi.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('requires arming before firing onDelete', () => {
    const props = renderBar();

    fireEvent.click(screen.getByText('bulk.delete'));
    expect(props.onDelete).not.toHaveBeenCalled();
    expect(screen.getByText('confirm')).toBeDefined();

    fireEvent.click(screen.getByText('confirm'));
    expect(props.onDelete).toHaveBeenCalledOnce();
  });

  it('resets to the unarmed label after firing', () => {
    const props = renderBar();

    fireEvent.click(screen.getByText('bulk.delete'));
    fireEvent.click(screen.getByText('confirm'));

    expect(props.onDelete).toHaveBeenCalledOnce();
    expect(screen.getByText('bulk.delete')).toBeDefined();
  });

  it('blurring the armed delete control resets it without firing', () => {
    const props = renderBar();

    const deleteButton = screen.getByText('bulk.delete');
    fireEvent.click(deleteButton);
    expect(screen.getByText('confirm')).toBeDefined();

    fireEvent.blur(screen.getByText('confirm'));
    expect(screen.getByText('bulk.delete')).toBeDefined();
    expect(props.onDelete).not.toHaveBeenCalled();
  });

  it('arming delete does not affect the independent reject control', () => {
    const props = renderBar();

    fireEvent.click(screen.getByText('bulk.delete'));
    expect(screen.getByText('confirm')).toBeDefined(); // delete is armed
    expect(screen.getByText('bulk.reject')).toBeDefined(); // reject still unarmed, independent state

    fireEvent.click(screen.getByText('bulk.reject'));
    expect(props.onReject).not.toHaveBeenCalled(); // reject's own click just arms it too
  });
});
