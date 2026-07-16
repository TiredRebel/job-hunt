import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for `apps/web` happy-path e2e (Phase 5 task 8.2).
 * Expects a seeded API at `API_URL` / `http://localhost:4000/v1` and starts
 * the Next.js dev server. Tests skip when the API health check fails.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env['CI']),
  retries: process.env['CI'] ? 1 : 0,
  workers: 1,
  reporter: 'list',
  timeout: 60_000,
  use: {
    baseURL: process.env['PLAYWRIGHT_BASE_URL'] ?? 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev -- --port 3000',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
    env: {
      ...process.env,
      API_URL: process.env['API_URL'] ?? 'http://localhost:4000/v1',
      NEXT_PUBLIC_API_URL: process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000/v1',
    },
  },
});
