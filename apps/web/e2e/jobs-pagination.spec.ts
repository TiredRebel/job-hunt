/**
 * @module e2e/jobs-pagination
 *
 * Regression for the jobs list pagination controls (jobs-dashboard spec
 * "Jobs list pagination controls"): changing page size writes `limit` to
 * the URL, and Next advances `offset` and updates the range readout.
 *
 * Skips when the API is unreachable or too few jobs are seeded to exercise
 * paging, so CI without a fully-seeded gateway does not report false
 * failures (same pattern as `jobs-happy-path.spec.ts`).
 */
import { expect, test } from '@playwright/test';

const API_BASE =
  process.env['API_URL'] ?? process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000/v1';

async function apiIsReachable(): Promise<boolean> {
  for (const url of [`${API_BASE.replace(/\/$/, '')}/health`, 'http://localhost:4000/v1/health']) {
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

test.beforeAll(async () => {
  const ok = await apiIsReachable();
  test.skip(!ok, `API not reachable at ${API_BASE} — start apps/api + seeded DB to run e2e`);
});

test('changing page size updates the URL and range readout', async ({ page }) => {
  await page.goto('/en/jobs');

  const main = page.locator('main');
  await expect(main).toBeVisible({ timeout: 30_000 });
  // The client island (FilterBar + table) hydrates behind a Suspense
  // fallback skeleton with no pagination control — wait for the search box,
  // which only the hydrated view renders, before deciding whether to skip.
  await expect(main.getByRole('textbox').first()).toBeVisible({ timeout: 15_000 });

  const pageSizeTrigger = main.getByRole('combobox', { name: 'Rows per page' });
  test.skip(
    (await pageSizeTrigger.count()) === 0,
    'No jobs seeded — pagination controls are hidden when the result set is empty',
  );
  await expect(pageSizeTrigger).toBeVisible({ timeout: 15_000 });

  await pageSizeTrigger.click();
  await page.getByRole('option', { name: '50' }).click();

  await expect(page).toHaveURL(/[?&]limit=50/);
  await expect(page).not.toHaveURL(/[?&]offset=/);

  const nextButton = main.getByRole('button', { name: 'Next page' });
  const rangeBefore = await main.getByText(/–\d+ of \d+/).textContent();

  if (await nextButton.isEnabled()) {
    await nextButton.click();
    await expect(page).toHaveURL(/[?&]offset=50/);
    const rangeAfter = await main.getByText(/–\d+ of \d+/).textContent();
    expect(rangeAfter).not.toBe(rangeBefore);
  }
});
