'use client';

/**
 * @module components/providers/toaster
 *
 * Sonner toaster, themed to track the active `next-themes` theme. Mutation
 * feedback surfaces here (design.md §8: "polite" toasts; destructive bulk
 * actions use inline confirms instead).
 */
import { useTheme } from 'next-themes';
import { Toaster as SonnerToaster } from 'sonner';

/**
 * App-wide toast host.
 *
 * @returns The themed toaster element.
 */
export function Toaster() {
  const { resolvedTheme } = useTheme();
  return (
    <SonnerToaster
      theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
      position="bottom-right"
      richColors
      closeButton
    />
  );
}
