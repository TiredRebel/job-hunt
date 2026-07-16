import { getLocale } from 'next-intl/server';

import { redirect } from '@/i18n/navigation';

/**
 * Locale root: redirects to the jobs dashboard, the app's primary surface.
 *
 * @returns Never resolves; redirects before rendering.
 */
export default async function LocaleRootPage(): Promise<void> {
  const locale = await getLocale();
  redirect({ href: '/jobs', locale });
}
