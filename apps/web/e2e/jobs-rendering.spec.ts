/**
 * @module e2e/jobs-rendering
 *
 * Regression for the jobs route collapsing into its Server Component error
 * boundary when the gateway cannot read PostgreSQL.
 */
import { expect, test } from '@playwright/test';

const CASES = [
  {
    locale: 'en',
    summaryLabel: "Today's triage",
    searchPlaceholder: 'Search jobs…',
    genericError: 'Something went wrong',
  },
  {
    locale: 'uk',
    summaryLabel: 'Сьогоднішній розбір',
    searchPlaceholder: 'Пошук вакансій…',
    genericError: 'Щось пішло не так',
  },
] as const;

for (const testCase of CASES) {
  test(`renders the complete jobs workspace (${testCase.locale})`, async ({ page }) => {
    await page.goto(`/${testCase.locale}/jobs`);

    const main = page.locator('main');
    await expect(main).toBeVisible({ timeout: 30_000 });
    await expect(main).not.toContainText(testCase.genericError);
    await expect(main.getByRole('region', { name: testCase.summaryLabel })).toBeVisible();
    await expect(main.getByPlaceholder(testCase.searchPlaceholder)).toBeVisible();
    await expect(main.getByRole('link', { name: /Open pipeline|Відкрити воронку/ })).toBeVisible();
  });
}

test('keeps the opportunity summary visible on a mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/en/jobs');

  const main = page.locator('main');
  const summary = main.getByRole('region', { name: "Today's triage" });
  await expect(main.getByRole('link', { name: 'Open pipeline' })).toBeVisible();
  await expect(main.getByText('All roles')).toBeVisible();
  const dimensions = await summary.evaluate((element) => ({
    clientHeight: element.clientHeight,
    scrollHeight: element.scrollHeight,
  }));
  expect(dimensions.scrollHeight).toBeLessThanOrEqual(dimensions.clientHeight);
});
