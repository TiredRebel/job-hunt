/**
 * @module playwright.config
 *
 * Playwright for jobs/board/settings flows against the multi-zone shell origin.
 * Starts shell + jobs + board + settings remotes. Prefer PLAYWRIGHT_BASE_URL
 * override in CI (default http://localhost:3100).
 */
import { defineConfig, devices } from '@playwright/test';

const shellOrigin = process.env['PLAYWRIGHT_BASE_URL'] ?? 'http://localhost:3100';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env['CI']),
  retries: process.env['CI'] ? 1 : 0,
  workers: 1,
  reporter: 'list',
  timeout: 60_000,
  use: {
    baseURL: shellOrigin,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command:
      'npx turbo run dev --filter=web-shell --filter=web-jobs --filter=web-board --filter=web-settings',
    url: shellOrigin,
    reuseExistingServer: !process.env['CI'],
    timeout: 180_000,
    env: {
      ...process.env,
      API_URL: process.env['API_URL'] ?? 'http://localhost:4000/v1',
      // Leave the browser on the same-origin `/api` proxy (the production
      // path). Do not default NEXT_PUBLIC_API_URL to the gateway — that
      // hides a missing shell proxy the way the original e2e suite did.
      NEXT_PUBLIC_API_URL: process.env['NEXT_PUBLIC_API_URL'] ?? '',
    },
  },
});
