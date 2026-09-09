'use client';

/**
 * @module components/providers/theme-provider
 *
 * Wraps `next-themes` and keeps `data-mode` on <html> in sync with the
 * resolved light/dark class so redesign tokens compose with either design
 * theme (docs/jobs-redesign.md §7).
 */
import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes';
import { useEffect, type ComponentProps, type ReactNode } from 'react';

/**
 * Sync `data-mode` with next-themes' resolved theme.
 *
 * @returns null
 */
function DataModeSync() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const mode = resolvedTheme === 'dark' ? 'dark' : 'light';
    document.documentElement.dataset.mode = mode;
  }, [resolvedTheme]);

  return null;
}

/**
 * App-wide theme provider (light/dark/system via the `dark` class on
 * `<html>`, plus `data-mode` for token composition).
 *
 * @param props - Forwarded to `next-themes`' provider.
 * @returns The provider wrapping `children`.
 */
export function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider> & { children?: ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem {...props}>
      <DataModeSync />
      {children}
    </NextThemesProvider>
  );
}
