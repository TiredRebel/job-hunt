/**
 * @module i18n/routing
 *
 * Locale routing configuration shared by the proxy, navigation helpers, and
 * the request-scoped message loader. `en` is the default and fallback
 * locale; `uk` is the only other supported locale (see docs/UI_DESIGN.md §6).
 */
import { defineRouting } from 'next-intl/routing';

/** Locale routing configuration (locale-prefixed URLs, `en` default). */
export const routing = defineRouting({
  locales: ['en', 'uk'],
  defaultLocale: 'en',
});
