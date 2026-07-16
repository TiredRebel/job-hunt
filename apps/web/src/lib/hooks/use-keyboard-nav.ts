/**
 * @module lib/hooks/use-keyboard-nav
 *
 * Keyboard-first row flow for the jobs table (jobs-dashboard spec
 * "Keyboard-first row flow"): `j`/`k` move focus, `x` toggles selection,
 * `Enter` opens the detail drawer, `a` marks applied, `r` rejects (with
 * confirm), `/` focuses search, `?` opens the shortcuts dialog. The
 * listener is attached to the table container only, so it is naturally
 * inactive while the filter bar's inputs or any portaled dialog have focus
 * (they live outside that container and so never bubble a keydown to it).
 */
import { useCallback, type KeyboardEvent } from 'react';

/** Callbacks driving the table's keyboard shortcuts. */
export interface UseKeyboardNavOptions {
  readonly rowIds: readonly string[];
  readonly focusedId: string | null;
  readonly onFocusChange: (id: string) => void;
  readonly onToggleSelect: (id: string) => void;
  readonly onOpen: (id: string) => void;
  readonly onMarkApplied: (id: string) => void;
  readonly onReject: (id: string) => void;
  readonly onFocusSearch: () => void;
  readonly onShowHelp: () => void;
}

/**
 * Build the table container's `onKeyDown` handler implementing the
 * jobs-dashboard keyboard flow.
 *
 * @param options - Row ids and shortcut callbacks.
 * @returns A `KeyboardEvent` handler to attach to the table container.
 */
export function useKeyboardNav(
  options: UseKeyboardNavOptions,
): (event: KeyboardEvent<HTMLElement>) => void {
  const {
    rowIds,
    focusedId,
    onFocusChange,
    onToggleSelect,
    onOpen,
    onMarkApplied,
    onReject,
    onFocusSearch,
    onShowHelp,
  } = options;

  return useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (rowIds.length === 0) {
        return;
      }
      const currentIndex = focusedId ? rowIds.indexOf(focusedId) : -1;

      switch (event.key) {
        case 'j': {
          event.preventDefault();
          const nextIndex = Math.min(currentIndex + 1, rowIds.length - 1);
          const nextId = rowIds[nextIndex < 0 ? 0 : nextIndex];
          if (nextId) {
            onFocusChange(nextId);
          }
          break;
        }
        case 'k': {
          event.preventDefault();
          const prevIndex = Math.max(currentIndex - 1, 0);
          const prevId = rowIds[prevIndex];
          if (prevId) {
            onFocusChange(prevId);
          }
          break;
        }
        case 'x': {
          if (focusedId) {
            event.preventDefault();
            onToggleSelect(focusedId);
          }
          break;
        }
        case 'Enter': {
          if (focusedId) {
            event.preventDefault();
            onOpen(focusedId);
          }
          break;
        }
        case 'a': {
          if (focusedId) {
            event.preventDefault();
            onMarkApplied(focusedId);
          }
          break;
        }
        case 'r': {
          if (focusedId) {
            event.preventDefault();
            onReject(focusedId);
          }
          break;
        }
        case '/': {
          event.preventDefault();
          onFocusSearch();
          break;
        }
        case '?': {
          event.preventDefault();
          onShowHelp();
          break;
        }
        default:
          break;
      }
    },
    [
      rowIds,
      focusedId,
      onFocusChange,
      onToggleSelect,
      onOpen,
      onMarkApplied,
      onReject,
      onFocusSearch,
      onShowHelp,
    ],
  );
}
