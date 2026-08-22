'use client';

/**
 * @module components/shell/lazy-command-palette
 *
 * Keep the global keyboard trigger small while deferring the command palette's
 * dialog and command-menu dependencies until the user opens it. Also owns the
 * `g` then `b` chord (design_handoff app-shell: "Open Board") — the other
 * global shortcut that, like ⌘K, has to listen on `document` since it must
 * fire from any page, not just inside the jobs table.
 */
import dynamic from 'next/dynamic';
import { useEffect, useRef } from 'react';

import { useRouter } from '@/i18n/navigation';

import { useCommandPalette } from './command-palette-context';

const CommandPalette = dynamic(
  () => import('./command-palette').then((module) => module.CommandPalette),
  { ssr: false },
);

/** Max gap between `g` and the next key for the chord to still count. */
const CHORD_WINDOW_MS = 800;

/**
 * True when the event target is a place the user is typing text — a bare
 * letter there is input, never a shortcut. `useKeyboardNav` avoids this by
 * listening on the table container only; a chord has to be global to work
 * from any page, so it checks the target explicitly instead.
 *
 * @param target - The keydown event's target.
 * @returns Whether the target is an editable text field.
 */
function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  return (
    target.isContentEditable ||
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT'
  );
}

/**
 * Global command-palette trigger with deferred menu loading, plus the
 * `g` `b` → `/board` chord.
 *
 * @returns The loaded palette while open, otherwise no visible element.
 */
export function LazyCommandPalette() {
  const { open, setOpen } = useCommandPalette();
  const router = useRouter();
  const chordArmedRef = useRef(false);
  const chordTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((current) => !current);
        return;
      }

      if (event.metaKey || event.ctrlKey || event.altKey || isTypingTarget(event.target)) {
        return;
      }

      if (event.key === 'g') {
        chordArmedRef.current = true;
        clearTimeout(chordTimerRef.current);
        chordTimerRef.current = setTimeout(() => {
          chordArmedRef.current = false;
        }, CHORD_WINDOW_MS);
        return;
      }

      if (event.key === 'b' && chordArmedRef.current) {
        chordArmedRef.current = false;
        clearTimeout(chordTimerRef.current);
        router.push('/board');
        return;
      }

      chordArmedRef.current = false;
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      clearTimeout(chordTimerRef.current);
    };
  }, [router, setOpen]);

  return open ? <CommandPalette /> : null;
}
