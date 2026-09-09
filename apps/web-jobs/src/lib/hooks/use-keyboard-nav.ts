/**
 * @module lib/hooks/use-keyboard-nav
 *
 * Shared keyboard triage map for list / focus mode / board
 * (docs/jobs-redesign.md §2.2). Suspends while input/textarea/contenteditable
 * is focused.
 */
import { useCallback, useEffect, type KeyboardEvent } from 'react';

/** Canonical stage shortcuts. */
export type StageShortcut = 'saved' | 'applied' | 'interview' | 'offer' | 'rejected';

/** Callbacks driving the keyboard flow. */
export interface UseKeyboardNavOptions {
  readonly rowIds: readonly string[];
  readonly focusedId: string | null;
  readonly onFocusChange: (id: string) => void;
  readonly onToggleSelect: (id: string) => void;
  readonly onExtendSelect?: (id: string) => void;
  readonly onSelectAll?: () => void;
  readonly onOpenDetail: (id: string) => void;
  readonly onToggleFocusMode: () => void;
  readonly onToggleDetail: () => void;
  readonly onStage: (id: string, stage: StageShortcut) => void;
  readonly onHide: (id: string) => void;
  readonly onUndo: () => void;
  readonly onFocusSearch: () => void;
  readonly onShowHelp: () => void;
  readonly onEscape: () => void;
  /** When true, attach a document-level listener (focus mode / board). */
  readonly global?: boolean;
  readonly enabled?: boolean;
}

/**
 * True when the event target is an editable field (shortcuts suspend).
 *
 * @param target - Event target.
 * @returns Whether shortcuts should be ignored.
 */
export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  if (target.isContentEditable) {
    return true;
  }
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

/**
 * Build the keydown handler implementing the redesign §2.2 key map.
 *
 * @param options - Row ids and shortcut callbacks.
 * @returns A `KeyboardEvent` handler (and optional document effect when `global`).
 */
export function useKeyboardNav(
  options: UseKeyboardNavOptions,
): (event: KeyboardEvent<HTMLElement>) => void {
  const {
    rowIds,
    focusedId,
    onFocusChange,
    onToggleSelect,
    onExtendSelect,
    onSelectAll,
    onOpenDetail,
    onToggleFocusMode,
    onToggleDetail,
    onStage,
    onHide,
    onUndo,
    onFocusSearch,
    onShowHelp,
    onEscape,
    global = false,
    enabled = true,
  } = options;

  const handleKey = useCallback(
    (event: KeyboardEvent | globalThis.KeyboardEvent): void => {
      if (!enabled || rowIds.length === 0) {
        return;
      }
      if (isEditableTarget(event.target)) {
        return;
      }

      const key = event.key;
      const currentIndex = focusedId ? rowIds.indexOf(focusedId) : -1;
      const meta = event.metaKey || event.ctrlKey;

      const move = (delta: number): void => {
        const nextIndex =
          currentIndex < 0
            ? delta > 0
              ? 0
              : rowIds.length - 1
            : Math.max(0, Math.min(rowIds.length - 1, currentIndex + delta));
        const nextId = rowIds[nextIndex];
        if (!nextId) {
          return;
        }
        if (event.shiftKey && onExtendSelect) {
          onExtendSelect(nextId);
        }
        onFocusChange(nextId);
      };

      switch (key) {
        case 'j':
        case 'ArrowDown': {
          event.preventDefault();
          move(1);
          break;
        }
        case 'k':
        case 'ArrowUp': {
          event.preventDefault();
          move(-1);
          break;
        }
        case ' ': {
          if (focusedId) {
            event.preventDefault();
            onToggleSelect(focusedId);
          }
          break;
        }
        case 'a':
        case 'A': {
          if (meta && onSelectAll) {
            event.preventDefault();
            onSelectAll();
            break;
          }
          if (focusedId && key === 'a') {
            event.preventDefault();
            onStage(focusedId, 'applied');
          }
          break;
        }
        case 'Enter': {
          event.preventDefault();
          onToggleFocusMode();
          break;
        }
        case 's': {
          if (focusedId) {
            event.preventDefault();
            onStage(focusedId, 'saved');
          }
          break;
        }
        case 'i': {
          if (focusedId) {
            event.preventDefault();
            onStage(focusedId, 'interview');
          }
          break;
        }
        case 'o': {
          if (focusedId) {
            event.preventDefault();
            onStage(focusedId, 'offer');
          }
          break;
        }
        case 'x':
        case 'X': {
          if (focusedId) {
            event.preventDefault();
            onStage(focusedId, 'rejected');
          }
          break;
        }
        case 'h':
        case 'H': {
          if (focusedId) {
            event.preventDefault();
            onHide(focusedId);
          }
          break;
        }
        case 'u':
        case 'U': {
          event.preventDefault();
          onUndo();
          break;
        }
        case 'f':
        case 'F': {
          event.preventDefault();
          onToggleFocusMode();
          break;
        }
        case 'd':
        case 'D': {
          event.preventDefault();
          if (focusedId) {
            onOpenDetail(focusedId);
          }
          onToggleDetail();
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
        case 'Escape': {
          event.preventDefault();
          onEscape();
          break;
        }
        case 'z':
        case 'Z': {
          if (meta) {
            event.preventDefault();
            onUndo();
          }
          break;
        }
        default:
          break;
      }
    },
    [
      enabled,
      rowIds,
      focusedId,
      onFocusChange,
      onToggleSelect,
      onExtendSelect,
      onSelectAll,
      onOpenDetail,
      onToggleFocusMode,
      onToggleDetail,
      onStage,
      onHide,
      onUndo,
      onFocusSearch,
      onShowHelp,
      onEscape,
    ],
  );

  useEffect(() => {
    if (!global || !enabled) {
      return;
    }
    const listener = (event: globalThis.KeyboardEvent): void => {
      handleKey(event);
    };
    document.addEventListener('keydown', listener);
    return () => document.removeEventListener('keydown', listener);
  }, [global, enabled, handleKey]);

  return useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      handleKey(event);
    },
    [handleKey],
  );
}
