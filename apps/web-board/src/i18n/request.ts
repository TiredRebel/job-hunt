/**
 * @module i18n/request
 *
 * Request-scoped next-intl configuration: resolves the active locale from
 * the `[locale]` route segment and loads its flat message catalog from
 * `messages/{locale}.json`.
 */
import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';

import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
