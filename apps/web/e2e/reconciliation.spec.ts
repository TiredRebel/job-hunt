/**
 * @module e2e/reconciliation
 *
 * Regression for the jobs-count reconciliation features: per-source
 * jobs-health summary on `/sources` and the dashboard reconciliation strip
 * on `/jobs`, plus the dead-letter listing route reachable from the strip.
 *
 * Skips when the API is unreachable so CI without a seeded gateway does not
 * report false failures (same pattern as `jobs-happy-path.spec.ts`).
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

test('sources page renders a jobs-health summary line on at least one row', async ({ page }) => {
  await page.goto('/en/sources');

  const main = page.locator('main');
  await expect(main).toBeVisible({ timeout: 30_000 });

  // The cumulative "Discovered:" label is unique to the new summary line.
  // If the seeded DB has zero scrape runs across every source the line is
  // still rendered (zeros), so this assertion holds without requiring a
  // specific bucket value.
  await expect(main.getByText('Discovered:', { exact: false }).first()).toBeVisible({
    timeout: 15_000,
  });
});

test('jobs dashboard renders the reconciliation strip below the metrics row', async ({ page }) => {
  await page.goto('/en/jobs');

  const main = page.locator('main');
  await expect(main).toBeVisible({ timeout: 30_000 });

  // The strip is hidden entirely when discovered=0. On a seeded DB with at
  // least one scrape run, the strip should render. The reconciliation query
  // is independent from the jobs list query, so wait for it explicitly.
  const strip = main.getByTestId('jobs-reconciliation-strip');
  await expect(strip).toBeVisible({ timeout: 15_000 });

  await expect(strip).toContainText('Discovered:');
  await expect(strip).toContainText('Processing:');
  await expect(strip).toContainText('Failed:');
  await expect(strip).toContainText('Hidden:');
});

test('dead-letter route renders a table or an empty state', async ({ page }) => {
  await page.goto('/en/jobs/dead-letter');

  const main = page.locator('main');
  await expect(main).toBeVisible({ timeout: 30_000 });
  await expect(main.getByRole('heading', { level: 1, name: 'Dead-letter queue' })).toBeVisible();

  // Either the table renders (rows present) or the localized empty state.
  // Both are valid outcomes depending on whether any jobs have failed
  // processing.
  const tableRows = main.locator('tbody tr');
  const emptyState = main.getByTestId('dead-letter-empty');
  const rowCount = await tableRows.count();
  if (rowCount === 0) {
    await expect(emptyState).toBeVisible();
  }
});
