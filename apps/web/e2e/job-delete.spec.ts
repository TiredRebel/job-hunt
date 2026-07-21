/**
 * @module e2e/job-delete
 *
 * Destructive-action coverage for the jobs list and stage board. The CI
 * workflow supplies isolated delete fixtures; local runs skip when the API
 * or those fixtures are unavailable.
 */
import { expect, test, type Locator, type Page } from '@playwright/test';

const API_BASE =
  process.env['API_URL'] ?? process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000/v1';

async function apiIsReachable(): Promise<boolean> {
  const gatewayBase = API_BASE.replace(/\/v1\/?$/, '');
  const healthUrls = [
    `${API_BASE.replace(/\/$/, '')}/health`,
    `${gatewayBase.replace(/\/$/, '')}/health`,
  ];
  for (const url of healthUrls) {
    try {
      if ((await fetch(url)).ok) {
        return true;
      }
    } catch {
      // Try the other health URL: deployments may or may not version it.
    }
  }
  return false;
}

async function fixtureExists(title: string): Promise<boolean> {
  try {
    const response = await fetch(
      `${API_BASE.replace(/\/$/, '')}/jobs?query=${encodeURIComponent(title)}`,
    );
    if (!response.ok) {
      return false;
    }
    const payload: unknown = await response.json();
    if (
      !payload ||
      typeof payload !== 'object' ||
      !Array.isArray((payload as { items?: unknown }).items)
    ) {
      return false;
    }
    return (payload as { items: unknown[] }).items.some(
      (item) =>
        Boolean(item) && typeof item === 'object' && (item as { title?: unknown }).title === title,
    );
  } catch {
    return false;
  }
}

async function openJobs(page: Page): Promise<void> {
  await page.goto('/en/jobs');
  await expect(page.locator('main')).toBeVisible({ timeout: 30_000 });
}

async function findJobRow(page: Page, title: string): Promise<Locator> {
  const search = page.getByRole('textbox').first();
  await search.fill(title);
  const row = page.locator('table tbody tr').filter({ hasText: title }).first();
  await expect(row).toBeVisible({ timeout: 15_000 });
  return row;
}

async function prepareBoardJob(page: Page, title: string): Promise<void> {
  await openJobs(page);
  const row = await findJobRow(page, title);
  await row.getByRole('checkbox').click();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByText('Updated 1 job')).toBeVisible({ timeout: 15_000 });
}

test.describe('job deletion', () => {
  test.beforeAll(async () => {
    test.skip(
      !(await apiIsReachable()),
      `API not reachable at ${API_BASE} — start apps/api + seeded DB to run e2e`,
    );
  });

  test('cancelling list deletion leaves the vacancy visible', async ({ page }) => {
    test.skip(
      !(await fixtureExists('CI E2E Delete Job list')),
      'Delete fixture unavailable — seed the isolated CI deletion fixtures to run this test',
    );
    await openJobs(page);
    const row = await findJobRow(page, 'CI E2E Delete Job list');
    page.once('dialog', (dialog) => dialog.dismiss());
    await row.getByRole('button', { name: 'Delete CI E2E Delete Job list' }).click();
    await expect(row).toBeVisible();
  });

  test('job detail drawer exposes a delete action', async ({ page }) => {
    test.skip(
      !(await fixtureExists('CI E2E Delete Job list')),
      'Delete fixture unavailable — seed the isolated CI deletion fixtures to run this test',
    );
    await openJobs(page);
    const row = await findJobRow(page, 'CI E2E Delete Job list');
    await row.click();
    await expect(page.getByRole('button', { name: 'Delete', exact: true })).toBeVisible({
      timeout: 15_000,
    });
  });

  test('job detail score stays clear of the drawer close button', async ({ page }) => {
    test.skip(
      !(await fixtureExists('CI E2E Delete Job list')),
      'Delete fixture unavailable — seed the isolated CI deletion fixtures to run this test',
    );
    await openJobs(page);
    const row = await findJobRow(page, 'CI E2E Delete Job list');
    await row.click();

    const drawer = page.getByRole('dialog');
    const score = drawer.locator('header > div:first-child > span').first();
    const closeButton = drawer.getByRole('button', { name: 'Close' });
    await expect(score).toBeVisible({ timeout: 15_000 });
    const [scoreBox, closeBox] = await Promise.all([
      score.boundingBox(),
      closeButton.boundingBox(),
    ]);
    if (!scoreBox || !closeBox) {
      throw new Error('Job score or drawer close button is not measurable');
    }
    expect(scoreBox.x + scoreBox.width).toBeLessThanOrEqual(closeBox.x - 8);
  });

  test('Ukrainian drawer actions fit without wrapping', async ({ page }) => {
    test.skip(
      !(await fixtureExists('CI E2E Delete Job list')),
      'Delete fixture unavailable — seed the isolated CI deletion fixtures to run this test',
    );
    await page.setViewportSize({ width: 720, height: 800 });
    await page.goto('/uk/jobs');
    await expect(page.locator('main')).toBeVisible({ timeout: 30_000 });
    const row = await findJobRow(page, 'CI E2E Delete Job list');
    await row.click();

    const footer = page.locator('footer').last();
    await expect(footer.getByRole('button', { name: 'Видалити', exact: true })).toBeVisible({
      timeout: 15_000,
    });
    await expect
      .poll(() => footer.evaluate((element) => element.scrollWidth <= element.clientWidth))
      .toBe(true);
  });

  test('confirmed list deletion removes the vacancy after reload', async ({ page }) => {
    test.skip(
      !(await fixtureExists('CI E2E Delete Job failure')),
      'Delete fixture unavailable — seed the isolated CI deletion fixtures to run this test',
    );
    await openJobs(page);
    const row = await findJobRow(page, 'CI E2E Delete Job failure');
    page.once('dialog', (dialog) => dialog.accept());
    await row.getByRole('button', { name: 'Delete CI E2E Delete Job failure' }).click();
    await expect(row).toHaveCount(0, { timeout: 15_000 });
    await page.reload();
    await expect(
      page.locator('table tbody tr').filter({ hasText: 'CI E2E Delete Job failure' }),
    ).toHaveCount(0);
  });

  test('failed list deletion preserves the vacancy', async ({ page }) => {
    test.skip(
      !(await fixtureExists('CI E2E Delete Job board')),
      'Delete fixture unavailable — seed the isolated CI deletion fixtures to run this test',
    );
    await openJobs(page);
    const row = await findJobRow(page, 'CI E2E Delete Job board');
    await page.route('**/api/jobs/**', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: '{"message":"failed"}',
        });
        return;
      }
      await route.continue();
    });
    page.once('dialog', (dialog) => dialog.accept());
    await row.getByRole('button', { name: 'Delete CI E2E Delete Job board' }).click();
    await expect(row).toBeVisible();
  });

  test('board card keeps its delete action inside the card', async ({ page }) => {
    test.skip(
      !(await fixtureExists('CI E2E Delete Job board')),
      'Delete fixture unavailable — seed the isolated CI deletion fixtures to run this test',
    );
    await prepareBoardJob(page, 'CI E2E Delete Job board');
    await page.setViewportSize({ width: 800, height: 600 });
    await page.goto('/en/board');

    const card = page.locator('article').filter({ hasText: 'CI E2E Delete Job board' }).first();
    await expect(card).toBeVisible({ timeout: 15_000 });
    const deleteButton = card.getByRole('button', { name: 'Delete CI E2E Delete Job board' });
    await expect(deleteButton).toBeVisible();
    await expect
      .poll(() => card.evaluate((element) => element.scrollWidth <= element.clientWidth))
      .toBe(true);
    const [cardBox, deleteBox] = await Promise.all([
      card.boundingBox(),
      deleteButton.boundingBox(),
    ]);
    if (!cardBox || !deleteBox) {
      throw new Error('Board card or delete button is not measurable');
    }
    expect(deleteBox.x + deleteBox.width).toBeLessThanOrEqual(cardBox.x + cardBox.width);
  });

  test('cancelling and confirming board deletion preserve order and remove only the target', async ({
    page,
  }) => {
    test.skip(
      !(await fixtureExists('CI E2E Delete Job board')),
      'Delete fixture unavailable — seed the isolated CI deletion fixtures to run this test',
    );
    await prepareBoardJob(page, 'CI E2E Delete Job board');
    await page.goto('/en/board');
    await expect(page.locator('main')).toBeVisible();

    const saved = page.locator('section').filter({ hasText: 'Saved' }).first();
    const card = saved.locator('article').filter({ hasText: 'CI E2E Delete Job board' }).first();
    await expect(card).toBeVisible({ timeout: 15_000 });

    page.once('dialog', (dialog) => dialog.dismiss());
    await card.getByRole('button', { name: 'Delete CI E2E Delete Job board' }).click();
    await expect(card).toBeVisible();

    page.once('dialog', (dialog) => dialog.accept());
    await card.getByRole('button', { name: 'Delete CI E2E Delete Job board' }).click();
    await expect(card).toHaveCount(0, { timeout: 15_000 });
    await page.reload();
    await expect(
      page
        .locator('section')
        .filter({ hasText: 'Saved' })
        .first()
        .locator('article')
        .filter({ hasText: 'CI E2E Delete Job board' }),
    ).toHaveCount(0);
  });
});
