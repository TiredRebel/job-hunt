/**
 * @module components/shell/lazy-command-palette.spec
 *
 * Covers the `g` then `b` chord's state machine: fires on the real
 * sequence, does not fire on `b` alone, expires after the chord window,
 * and — the one that would actually break the app — never fires while the
 * user is typing in a text field (design_handoff app-shell "Open Board").
 */
import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CommandPaletteProvider } from './command-palette-context';
import { LazyCommandPalette } from './lazy-command-palette';

const push = vi.fn();

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ push }),
}));

vi.mock('./command-palette', () => ({ CommandPalette: () => null }));

function fireKey(key: string, target: EventTarget = document.body): void {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  target.dispatchEvent(event);
}

describe('LazyCommandPalette board chord', () => {
  beforeEach(() => {
    push.mockClear();
    vi.useFakeTimers();
    render(
      <CommandPaletteProvider>
        <LazyCommandPalette />
      </CommandPaletteProvider>,
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('navigates to /board on g then b', () => {
    fireKey('g');
    fireKey('b');
    expect(push).toHaveBeenCalledWith('/board');
  });

  it('does not navigate on b alone', () => {
    fireKey('b');
    expect(push).not.toHaveBeenCalled();
  });

  it('does not navigate once the chord window has expired', () => {
    fireKey('g');
    vi.advanceTimersByTime(900);
    fireKey('b');
    expect(push).not.toHaveBeenCalled();
  });

  it('ignores the chord while typing in a text field', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);
    fireKey('g', input);
    fireKey('b', input);
    expect(push).not.toHaveBeenCalled();
    input.remove();
  });
});
