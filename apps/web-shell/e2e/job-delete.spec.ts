/**
 * @module e2e/job-delete
 *
 * Destructive-action coverage for the jobs list and stage board after the
 * jobs redesign: list delete is a ⋯ menu item with an 8s undo toast (no
 * native confirm); bulk delete is immediate + undo; board cards still use
 * `Delete {title}` + `window.confirm`.
 */
import { expect, test, type Locator, type Page } from '@playwright/test';

import { retryUntilHydrated } from './helpers';

const API_BASE =
  process.env['API_URL'] ?? process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000/v1';

/** Soft-delete undo window in `apps/web-jobs` (`UNDO_MS`). */
const UNDO_MS = 8_000;

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

/**
 * Open the jobs list with an optional search query and no Unreviewed view.
 *
 * Passing `query` sets an active filter so the client does not auto-apply
 * `reaction=none`, which would hide fixtures already moved to a stage.
 */
async function openJobs(
  page: Page,
  options: { readonly query?: string; readonly locale?: string } = {},
): Promise<void> {
  const locale = options.locale ?? 'en';
  const params = new URLSearchParams();
  if (options.query) {
    params.set('query', options.query);
  }
  const search = params.toString();
  await page.goto(`/${locale}/jobs${search ? `?${search}` : ''}`);
  await expect(page.locator('main')).toBeVisible({ timeout: 30_000 });
}

async function findJobRow(page: Page, title: string, locale = 'en'): Promise<Locator> {
  await openJobs(page, { query: title, locale });
  const search = page.getByRole('textbox').first();
  const row = page.locator('table tbody tr').filter({ hasText: title }).first();
  await retryUntilHydrated(
    () => search.fill(title),
    () => expect(row).toBeVisible({ timeout: 15_000 }),
  );
  return row;
}

/** Open the row ⋯ menu and choose Delete (optimistic + undo toast). */
async function deleteJobFromRow(page: Page, row: Locator, title: string): Promise<void> {
  await row.hover();
  const menu = row.getByRole('button', { name: `Actions for ${title}` });
  await expect(menu).toBeVisible();
  await menu.click();
  await page.getByRole('menuitem', { name: 'Delete', exact: true }).click();
}

async function prepareBoardJob(page: Page, title: string): Promise<void> {
  const row = await findJobRow(page, title);
  await row.getByRole('checkbox', { name: 'Select row' }).click();
  const toolbar = page.getByRole('toolbar');
  await expect(toolbar).toBeVisible();
  await toolbar.getByRole('button', { name: 'Save', exact: true }).click();
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
    const title = 'CI E2E Delete Job list';
    const row = await findJobRow(page, title);
    await deleteJobFromRow(page, row, title);
    await expect(row).toHaveCount(0, { timeout: 5_000 });
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await expect(page.locator('table tbody tr').filter({ hasText: title })).toBeVisible({
      timeout: 15_000,
    });
  });

  test('job detail drawer exposes a delete action', async ({ page }) => {
    test.skip(
      !(await fixtureExists('CI E2E Delete Job list')),
      'Delete fixture unavailable — seed the isolated CI deletion fixtures to run this test',
    );
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
    const row = await findJobRow(page, 'CI E2E Delete Job list');
    await row.click();

    const drawer = page.getByRole('dialog');
    await expect(drawer).toBeVisible({ timeout: 15_000 });
    // Chrome close (scrim is xl:hidden on Desktop Chrome).
    const closeButton = drawer.getByRole('button', { name: 'Close' });
    const score = drawer.locator('header').locator('span').first();
    await expect(score).toBeVisible({ timeout: 15_000 });
    await expect(closeButton).toBeVisible();

    const [scoreBox, closeBox] = await Promise.all([
      score.boundingBox(),
      closeButton.boundingBox(),
    ]);
    if (!scoreBox || !closeBox) {
      throw new Error('Job score or drawer close button is not measurable');
    }
    // DetailPane puts close in the chrome bar and score in the content header.
    expect(closeBox.y + closeBox.height).toBeLessThanOrEqual(scoreBox.y);
  });

  test('Material stage menu uses a bounded surface radius', async ({ page }) => {
    test.skip(
      !(await fixtureExists('CI E2E Delete Job list')),
      'Delete fixture unavailable — seed the isolated CI deletion fixtures to run this test',
    );
    await page.addInitScript(() => {
      window.localStorage.setItem('job-hunter-design-mode', 'material');
    });
    const row = await findJobRow(page, 'CI E2E Delete Job list');
    await row.click();

    const drawer = page.getByRole('dialog');
    await drawer.getByRole('combobox', { name: 'Set stage' }).click();
    const menu = page.getByRole('listbox');
    await expect(menu).toBeVisible({ timeout: 15_000 });
    const cornerRadius = await menu.evaluate((element) =>
      Number.parseFloat(window.getComputedStyle(element).borderTopLeftRadius),
    );
    expect(cornerRadius).toBeLessThanOrEqual(16);
  });

  test('Ukrainian drawer actions fit without overflow', async ({ page }) => {
    test.skip(
      !(await fixtureExists('CI E2E Delete Job list')),
      'Delete fixture unavailable — seed the isolated CI deletion fixtures to run this test',
    );
    // Open on desktop first — 720px uses the card list (no table).
    const row = await findJobRow(page, 'CI E2E Delete Job list', 'uk');
    await row.click();

    const drawer = page.getByRole('dialog');
    await expect(drawer).toBeVisible({ timeout: 15_000 });
    const footer = drawer.locator('footer').last();
    await expect(
      footer.getByRole('button', { name: 'Позначити як відгук надіслано', exact: true }),
    ).toBeVisible({ timeout: 15_000 });

    await page.setViewportSize({ width: 720, height: 800 });
    await expect
      .poll(() => footer.evaluate((element) => element.scrollWidth <= element.clientWidth))
      .toBe(true);
  });

  test('confirmed list deletion removes the vacancy after reload', async ({ page }) => {
    test.skip(
      !(await fixtureExists('CI E2E Delete Job failure')),
      'Delete fixture unavailable — seed the isolated CI deletion fixtures to run this test',
    );
    const title = 'CI E2E Delete Job failure';
    const row = await findJobRow(page, title);
    const deleteCommitted = page.waitForResponse(
      (response) =>
        response.request().method() === 'DELETE' && /\/(?:api|v1)\/jobs\//.test(response.url()),
      { timeout: UNDO_MS + 5_000 },
    );
    await deleteJobFromRow(page, row, title);
    await expect(row).toHaveCount(0, { timeout: 5_000 });
    await deleteCommitted;
    await page.reload();
    await openJobs(page, { query: title });
    await expect(page.locator('table tbody tr').filter({ hasText: title })).toHaveCount(0);
  });

  test('failed list deletion preserves the vacancy', async ({ page }) => {
    test.skip(
      !(await fixtureExists('CI E2E Delete Job board')),
      'Delete fixture unavailable — seed the isolated CI deletion fixtures to run this test',
    );
    const title = 'CI E2E Delete Job board';
    const row = await findJobRow(page, title);
    // Browser may hit the gateway (`/v1`) or the jobs-zone same-origin proxy (`/api`).
    await page.route(/\/(?:api|v1)\/jobs\//, async (route) => {
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
    await deleteJobFromRow(page, row, title);
    await expect(page.locator('table tbody tr').filter({ hasText: title })).toHaveCount(0);
    await expect(page.getByText('Could not delete the job')).toBeVisible({
      timeout: UNDO_MS + 5_000,
    });
    await expect(page.locator('table tbody tr').filter({ hasText: title })).toBeVisible({
      timeout: 15_000,
    });
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

  // The two tests below run last and each other's fixtures are load-bearing:
  // "CI E2E Delete Job list" is only ever cancelled/read by the tests above,
  // never permanently removed, so it is still present here for a real
  // single-delete. Bulk delete needs two rows of its own — "CI E2E Bulk
  // Delete Job 1"/"2" — since the three fixtures above are consumed for
  // real by tests earlier in this file by the time this one runs; seed
  // these two alongside the existing fixtures for this test to run.

  test('job detail drawer closes promptly after a successful delete', async ({ page }) => {
    test.skip(
      !(await fixtureExists('CI E2E Delete Job list')),
      'Delete fixture unavailable — seed the isolated CI deletion fixtures to run this test',
    );
    const row = await findJobRow(page, 'CI E2E Delete Job list');
    await row.click();

    const drawer = page.getByRole('dialog');
    await expect(drawer).toBeVisible({ timeout: 15_000 });
    page.once('dialog', (dialog) => dialog.accept());
    await drawer.getByRole('button', { name: 'Delete', exact: true }).click();

    // Regression for the ~7s stale-close bug (design.md D4): the drawer must
    // close well within a couple of seconds, not merely "eventually".
    await expect(drawer).toBeHidden({ timeout: 2_000 });
    await expect(page.getByText('Deleted “CI E2E Delete Job list”')).toBeVisible();
  });

  test('bulk delete removes all selected rows and clears the selection', async ({ page }) => {
    const [job1Exists, job2Exists] = await Promise.all([
      fixtureExists('CI E2E Bulk Delete Job 1'),
      fixtureExists('CI E2E Bulk Delete Job 2'),
    ]);
    test.skip(
      !job1Exists || !job2Exists,
      'Bulk-delete fixtures unavailable — seed "CI E2E Bulk Delete Job 1"/"2" to run this test',
    );
    await openJobs(page, { query: 'CI E2E Bulk Delete Job' });
    const search = page.getByRole('textbox').first();
    const rows = page.locator('table tbody tr').filter({ hasText: 'CI E2E Bulk Delete Job' });
    await retryUntilHydrated(
      () => search.fill('CI E2E Bulk Delete Job'),
      () => expect(rows).toHaveCount(2, { timeout: 15_000 }),
    );
    await rows.nth(0).getByRole('checkbox', { name: 'Select row' }).click();
    await rows.nth(1).getByRole('checkbox', { name: 'Select row' }).click();

    const toolbar = page.getByRole('toolbar');
    await expect(toolbar).toBeVisible();
    // Redesign: no Confirm step — delete is optimistic with an undo toast.
    await toolbar.getByRole('button', { name: 'Delete', exact: true }).click();

    await expect(rows).toHaveCount(0, { timeout: 15_000 });
    await expect(toolbar).toBeHidden();
    await expect(page.getByText('Deleted 2 jobs')).toBeVisible();
  });
});
