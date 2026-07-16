/**
 * @module next.config
 *
 * Next.js configuration: wraps the app with the next-intl plugin so the
 * `src/i18n/request.ts` config is picked up for server-side message loading.
 */
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {};

export default withNextIntl(nextConfig);
