'use client';

/**
 * @module components/shell/lazy-command-palette
 *
 * Keep the global keyboard trigger small while deferring the command palette's
 * dialog and command-menu dependencies until the user opens it.
 */
import dynamic from 'next/dynamic';
import { useEffect } from 'react';

import { useCommandPalette } from './command-palette-context';

const CommandPalette = dynamic(
  () => import('./command-palette').then((module) => module.CommandPalette),
  { ssr: false },
);

/**
 * Global command-palette trigger with deferred menu loading.
 *
 * @returns The loaded palette while open, otherwise no visible element.
 */
export function LazyCommandPalette() {
  const { open, setOpen } = useCommandPalette();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((current) => !current);
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [setOpen]);

  return open ? <CommandPalette /> : null;
}
