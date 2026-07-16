'use client';

/**
 * @module components/providers/theme-provider
 *
 * Wraps `next-themes` with the app's conventions: class-attribute switching,
 * system default, no flash of the wrong theme on first paint.
 */
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ComponentProps } from 'react';

/**
 * App-wide theme provider (light/dark/system via the `dark` class on
 * `<html>`).
 *
 * @param props - Forwarded to `next-themes`' provider.
 * @returns The provider wrapping `children`.
 */
export function ThemeProvider(props: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider attribute="class" defaultTheme="system" enableSystem {...props} />;
}
