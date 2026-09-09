/**
 * @module next.config
 *
 * Settings multi-zone remote with next-intl and shared package transpilation.
 * Unique assetPrefix avoids `/_next` collisions with the shell and other remotes.
 */
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  assetPrefix: '/settings-static',
  transpilePackages: ['@job-hunter/web-ui', '@job-hunter/web-api', '@job-hunter/shared-ts'],
};

export default withNextIntl(nextConfig);
