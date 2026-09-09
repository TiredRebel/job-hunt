/**
 * @module next.config
 *
 * Multi-zone shell: proxies locale-prefixed domain paths and remote
 * assetPrefix trees to independently running Next remotes. No Module
 * Federation. No iframes.
 */
import type { NextConfig } from 'next';

const JOBS_ORIGIN = process.env['WEB_JOBS_ORIGIN'] ?? 'http://localhost:3001';
const BOARD_ORIGIN = process.env['WEB_BOARD_ORIGIN'] ?? 'http://localhost:3002';
const SETTINGS_ORIGIN = process.env['WEB_SETTINGS_ORIGIN'] ?? 'http://localhost:3003';

const nextConfig: NextConfig = {
  transpilePackages: ['@job-hunter/web-ui', '@job-hunter/web-api', '@job-hunter/shared-ts'],
  async rewrites() {
    return [
      // Jobs remote
      { source: '/:locale/jobs', destination: `${JOBS_ORIGIN}/:locale/jobs` },
      { source: '/:locale/jobs/:path+', destination: `${JOBS_ORIGIN}/:locale/jobs/:path+` },
      { source: '/jobs-static/:path+', destination: `${JOBS_ORIGIN}/jobs-static/:path+` },
      // Board remote
      { source: '/:locale/board', destination: `${BOARD_ORIGIN}/:locale/board` },
      { source: '/:locale/board/:path+', destination: `${BOARD_ORIGIN}/:locale/board/:path+` },
      { source: '/board-static/:path+', destination: `${BOARD_ORIGIN}/board-static/:path+` },
      // Settings remote
      { source: '/:locale/sources', destination: `${SETTINGS_ORIGIN}/:locale/sources` },
      {
        source: '/:locale/sources/:path+',
        destination: `${SETTINGS_ORIGIN}/:locale/sources/:path+`,
      },
      {
        source: '/:locale/dictionaries',
        destination: `${SETTINGS_ORIGIN}/:locale/dictionaries`,
      },
      {
        source: '/:locale/dictionaries/:path+',
        destination: `${SETTINGS_ORIGIN}/:locale/dictionaries/:path+`,
      },
      { source: '/:locale/profile', destination: `${SETTINGS_ORIGIN}/:locale/profile` },
      {
        source: '/:locale/profile/:path+',
        destination: `${SETTINGS_ORIGIN}/:locale/profile/:path+`,
      },
      { source: '/:locale/settings', destination: `${SETTINGS_ORIGIN}/:locale/settings` },
      {
        source: '/:locale/settings/:path+',
        destination: `${SETTINGS_ORIGIN}/:locale/settings/:path+`,
      },
      {
        source: '/settings-static/:path+',
        destination: `${SETTINGS_ORIGIN}/settings-static/:path+`,
      },
    ];
  },
};

export default nextConfig;
