/**
 * @module proxy
 *
 * Next 16 proxy (formerly middleware): runs next-intl's locale negotiation
 * (Accept-Language on first visit, cookie persistence thereafter) before
 * every dashboard request. See docs/UI_DESIGN.md §6 and design.md D4.
 */
import createMiddleware from 'next-intl/middleware';

import { routing } from './i18n/routing';

/** next-intl locale-negotiation proxy. */
export const proxy = createMiddleware(routing);

/** Run the proxy for every path except static assets and API routes. */
export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
