/**
 * @module app/[locale]/layout
 *
 * Locale root for the jobs remote: providers + dashboard chrome.
 * Multi-zones remotes render their own shell (hard navigation between zones).
 */
import type { Metadata } from 'next';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Geist, JetBrains_Mono } from 'next/font/google';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import { DashboardShell } from '@/components/shell/dashboard-shell';
import { QueryProvider } from '@/components/providers/query-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { Toaster } from '@/components/providers/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { routing } from '@/i18n/routing';
import { THEME_BOOT_SCRIPT } from '@/lib/theme-boot';

import '../globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin', 'cyrillic'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin', 'cyrillic'],
});

/** Jobs remote metadata. */
export const metadata: Metadata = {
  title: 'Job Hunter',
  description: 'Personal job-search dashboard: triage, match, and track vacancies.',
};

/**
 * Pre-render supported locale segments.
 *
 * @returns Locale params.
 */
export function generateStaticParams(): Array<{ locale: string }> {
  return routing.locales.map((locale) => ({ locale }));
}

/**
 * Locale document + dashboard shell for jobs routes.
 *
 * @param props - Route props.
 * @returns The layout.
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
      data-theme="fieldwork"
      data-density="compact"
      data-mode="light"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="min-h-full">
        <ThemeProvider>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <QueryProvider>
              <TooltipProvider>
                <DashboardShell>{children}</DashboardShell>
                <Toaster />
              </TooltipProvider>
            </QueryProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
