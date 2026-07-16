import type { Metadata } from 'next';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Geist, JetBrains_Mono } from 'next/font/google';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import { QueryProvider } from '@/components/providers/query-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { Toaster } from '@/components/providers/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { routing } from '@/i18n/routing';

import '../globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin', 'cyrillic'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin', 'cyrillic'],
});

/** Static site metadata. */
export const metadata: Metadata = {
  title: 'Job Hunter',
  description: 'Personal job-search dashboard: triage, match, and track vacancies.',
};

/**
 * Pre-render both supported locale segments at build time.
 *
 * @returns The list of locale route params to statically generate.
 */
export function generateStaticParams(): Array<{ locale: string }> {
  return routing.locales.map((locale) => ({ locale }));
}

/**
 * Root layout: `<html>`/`<body>`, self-hosted fonts, theme + i18n providers.
 * This is the actual Next.js root layout (no `app/layout.tsx` above it) —
 * the `[locale]` segment owns `<html lang>`, per next-intl's App Router
 * convention.
 *
 * @param props - Route props.
 * @param props.children - Nested route content.
 * @param props.params - Route params, including the locale segment.
 * @returns The root document shell.
 */
export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full">
        <ThemeProvider>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <QueryProvider>
              <TooltipProvider>
                {children}
                <Toaster />
              </TooltipProvider>
            </QueryProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
