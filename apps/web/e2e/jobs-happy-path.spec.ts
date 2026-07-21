/**
 * @module e2e/jobs-happy-path
 *
 * Happy-path e2e: jobs list → filter → open drawer → mark applied → board.
 * Runs for `en` and `uk`. Skips the whole suite when the API is unreachable
 * so CI without a seeded gateway does not report false failures.
 */
import { expect, test, type Page } from '@playwright/test';

const API_BASE =
  process.env['API_URL'] ?? process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000/v1';

/**
 * Probe the API health endpoint.
 *
 * @returns Whether the API answered successfully.
 */
async function apiIsReachable(): Promise<boolean> {
  const candidates = [
    `${API_BASE.replace(/\/$/, '')}/health`,
    'http://localhost:4000/v1/health',
    'http://localhost:4000/health',
  ];
  for (const url of candidates) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return true;
      }
    } catch {
      // try next candidate
    }
  }
  return false;
}

/**
 * Open the jobs page for a locale and wait for the shell.
 *
 * @param page - Playwright page.
 * @param locale - UI locale segment.
 */
async function openJobs(page: Page, locale: 'en' | 'uk'): Promise<void> {
  await page.goto(`/${locale}/jobs`);
  // `main` alone: the page also renders named `role="region"` landmarks
  // (the opportunity-radar panel, the jobs list, the toast/notification
  // live region), so `getByRole('region').or(...)` matches multiple
  // elements and trips Playwright's strict mode — `main` is the one
  // guaranteed-unique landmark, matching the pattern already used for the
  // board page below.
  await expect(page.locator('main')).toBeVisible({ timeout: 30_000 });
}

for (const locale of ['en', 'uk'] as const) {
  test.describe(`jobs happy path (${locale})`, () => {
    test.beforeAll(async () => {
      const ok = await apiIsReachable();
      test.skip(!ok, `API not reachable at ${API_BASE} — start apps/api + seeded DB to run e2e`);
    });

    test('filter, open drawer, mark applied, see board card', async ({ page }) => {
      await openJobs(page, locale);

      const search = page.getByRole('textbox').first();
      await expect(search).toBeVisible();

      // Date-range preset (7d) — exercises dateField + dateFrom/dateTo URL encoding.
      const preset7d = page.getByRole('button', { name: locale === 'uk' ? '7д' : '7d' });
      if (await preset7d.isVisible()) {
        await preset7d.click();
        await expect(page).toHaveURL(/dateFrom=/);
      }

      // Prefer an existing row; if the table is empty the empty-state still renders.
      const rows = page.locator('tbody tr[data-state], tbody tr.cursor-pointer, table tbody tr');
      const rowCount = await rows.count();
      test.skip(rowCount === 0, 'No jobs in seeded API — seed jobs before running this path');

      await rows.first().click();
      await expect(page).toHaveURL(/[?&]job=/);

      const appliedLabel = locale === 'uk' ? 'Відгук надіслано' : 'Applied';
      const appliedButton = page.getByRole('button', { name: appliedLabel }).first();
      await expect(appliedButton).toBeVisible({ timeout: 15_000 });
      await appliedButton.click();

      await page.goto(`/${locale}/board`);
      await expect(page.locator('main')).toBeVisible();
      // Board columns render; Applied column should exist.
      await expect(page.getByText(appliedLabel).first()).toBeVisible({ timeout: 15_000 });
    });
  });
}

test('sorts jobs without duplicating the locale in the URL', async ({ page }) => {
  await openJobs(page, 'uk');

  await page.getByRole('button', { name: 'Оцінка' }).click();

  await expect(page).toHaveURL(/\/uk\/jobs\?sortBy=score&sortDir=desc$/);
  await expect(page.locator('main')).toBeVisible();
});
