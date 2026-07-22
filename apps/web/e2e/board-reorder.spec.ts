/**
 * @module e2e/board-reorder
 *
 * Regression guard for the board's dnd-kit sortable migration (design.md D8
 * in openspec/changes/notification-settings-and-board-reorder): a
 * cross-column drag persists the destination stage, and a within-column
 * drag persists the new card order across a reload, with no reaction event
 * created for the latter. Uses dnd-kit's keyboard interaction (space to
 * lift, arrows to move, space to drop) rather than synthetic mouse events —
 * more reliable in headless Chromium and a supported user path per the
 * stage-board spec's keyboard-accessible drag requirement. Skips when the
 * API is unreachable, matching jobs-happy-path.spec.ts.
 */
import { expect, test, type Locator, type Page } from '@playwright/test';

import { retryUntilHydrated } from './helpers';

const API_BASE =
  process.env['API_URL'] ?? process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000/v1';

/** Search term matching only the three jobs the e2e CI job seeds. */
const SEED_QUERY = 'CI E2E Seed Job';

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
 * Move any job in the Saved stage that isn't one of the three CI fixtures
 * out of the way. A single ArrowDown press moves the active card exactly
 * one *visual* position — correct, expected behavior — so an ambient job
 * sitting between two fixture cards breaks the within-column reorder
 * test's assumption that ArrowDown always swaps with "the next fixture
 * job". Confirmed locally: a leftover manually-tested job left in Saved
 * reproduced this test's order-mismatch failure at a high rate; clearing
 * it dropped that to zero across 25 runs. Runs on the browser's own
 * session via the `/api` proxy, matching how the app itself calls it.
 *
 * @param page - Playwright page, navigated to any same-origin route.
 */
async function clearAmbientSavedJobs(page: Page): Promise<void> {
  await page.evaluate(async (seedQuery) => {
    const profileRes = await fetch('/api/profiles/active');
    if (!profileRes.ok) {
      return;
    }
    const profile = (await profileRes.json()) as { id: number | string };
    const savedRes = await fetch('/api/jobs?reaction=saved&limit=100&offset=0&sortBy=board');
    if (!savedRes.ok) {
      return;
    }
    const saved = (await savedRes.json()) as { items: { id: string; title: string }[] };
    const ambient = saved.items.filter((job) => !job.title.startsWith(seedQuery));
    await Promise.all(
      ambient.map((job) =>
        fetch('/api/reactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobId: job.id,
            profileId: Number(profile.id),
            reaction: 'withdrawn',
          }),
        }),
      ),
    );
  }, SEED_QUERY);
}

/**
 * Force the three CI-seeded jobs into the Saved stage via the jobs page's
 * bulk action bar, giving the board a deterministic, isolated fixture
 * regardless of ambient data or a previous test's side effects — bulk-save
 * always appends a newer "saved" reaction event, so it wins over whatever
 * stage a job was already in.
 *
 * @param page - Playwright page.
 */
async function seedSavedColumn(page: Page): Promise<void> {
  await page.goto('/en/jobs');
  await expect(page.locator('main')).toBeVisible({ timeout: 30_000 });
  await clearAmbientSavedJobs(page);

  const search = page.getByRole('textbox').first();
  const rows = page.locator('table tbody tr');
  await retryUntilHydrated(
    () => search.fill(SEED_QUERY),
    () => expect(rows).toHaveCount(3, { timeout: 15_000 }),
  );

  await page.getByRole('checkbox', { name: 'Select all rows' }).click();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByText('Updated 3 jobs')).toBeVisible({ timeout: 15_000 });
}

/**
 * Locate a stage column's `<section>` by its localized stage badge text.
 *
 * @param page - Playwright page.
 * @param label - Stage badge text (e.g. "Saved").
 * @returns The column section locator.
 */
function stageColumn(page: Page, label: string): Locator {
  return page.locator('section').filter({ has: page.getByText(label, { exact: true }) });
}

/**
 * Locate a card `<article>` by its job title, scoped to one column.
 * `p.font-medium` uniquely selects the title paragraph — the company
 * paragraph shares the `truncate` class but not `font-medium`.
 *
 * @param column - Column section locator.
 * @param title - Job title text.
 * @returns The card locator.
 */
function card(column: Locator, title: string): Locator {
  return column.locator('article').filter({ has: column.page().getByText(title, { exact: true }) });
}

/**
 * Read the seeded cards' titles within a column, in DOM (visual) order,
 * ignoring any other cards ambient data may have placed in that column.
 *
 * @param column - Column section locator.
 * @returns Titles of the three seeded cards present, in order.
 */
async function seededOrder(column: Locator): Promise<string[]> {
  const titles = await column.locator('article p.font-medium').allTextContents();
  return titles.filter((title) => title.startsWith(SEED_QUERY));
}

test.describe('board keyboard drag-and-drop', () => {
  test.beforeAll(async () => {
    const ok = await apiIsReachable();
    test.skip(!ok, `API not reachable at ${API_BASE} — start apps/api + seeded DB to run e2e`);
  });

  test('within-column keyboard reorder persists across reload, stage unchanged', async ({
    page,
  }) => {
    await seedSavedColumn(page);
    await page.goto('/en/board');
    await expect(page.locator('main')).toBeVisible();

    const saved = stageColumn(page, 'Saved');
    await expect.poll(() => seededOrder(saved), { timeout: 15_000 }).toHaveLength(3);

    const before = await seededOrder(saved);
    const [first, second] = before as [string, string, string];

    const liveRegion = page.locator('p[aria-live="polite"]');
    const firstCard = card(saved, first);
    await firstCard.focus();
    await page.keyboard.press('Space');
    await expect(liveRegion).toHaveText(`Picked up ${first}`);

    // dnd-kit's KeyboardSensor attaches its move listener via a deferred
    // setTimeout (to avoid double-handling the activating keydown) and
    // measures drop targets on a render tick — give both a moment to settle
    // before the next key, or the move resolves with no collision target.
    await page.waitForTimeout(200);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(200);
    await page.keyboard.press('Space');

    await expect(liveRegion).toHaveText(`Reordered ${first} within Saved`, { timeout: 15_000 });

    // The dragged card moved past the one that was below it; the stage
    // itself must not have changed — still exactly the 3 seeded cards.
    const afterDrop = await seededOrder(saved);
    expect(afterDrop).toEqual([second, first, before[2]]);

    await page.reload();
    await expect(page.locator('main')).toBeVisible();
    await expect
      .poll(() => seededOrder(stageColumn(page, 'Saved')), { timeout: 15_000 })
      .toEqual([second, first, before[2]]);
  });

  test('cross-column keyboard drag persists the new stage', async ({ page }) => {
    await seedSavedColumn(page);
    await page.goto('/en/board');
    await expect(page.locator('main')).toBeVisible();

    const saved = stageColumn(page, 'Saved');
    await expect.poll(() => seededOrder(saved), { timeout: 15_000 }).toHaveLength(3);
    const [moving] = (await seededOrder(saved)) as [string, string, string];

    const liveRegion = page.locator('p[aria-live="polite"]');
    const movingCard = card(saved, moving);
    await movingCard.focus();
    await page.keyboard.press('Space');
    await expect(liveRegion).toHaveText(`Picked up ${moving}`);

    await page.waitForTimeout(200);
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(200);
    await page.keyboard.press('Space');

    await expect(liveRegion).toHaveText(`Moved ${moving} to Applied`, { timeout: 15_000 });

    const applied = stageColumn(page, 'Applied');
    await expect(card(applied, moving)).toBeVisible();
    await expect(card(saved, moving)).toHaveCount(0);

    // The undo affordance (moveMutation.onSuccess's toast action) is
    // unchanged by the dnd-kit/sortable migration, but the migration
    // touches the same card component the toast re-triggers a move on —
    // confirm it still round-trips before checking persistence.
    await page.getByRole('button', { name: 'Undo' }).click();
    await expect(liveRegion).toHaveText(`Moved ${moving} to Saved`, { timeout: 15_000 });
    await expect(card(saved, moving)).toBeVisible();
    await expect(card(applied, moving)).toHaveCount(0);

    // Redo the move so the persistence check below has something to verify.
    await card(saved, moving).focus();
    await page.keyboard.press('Space');
    await expect(liveRegion).toHaveText(`Picked up ${moving}`);
    await page.waitForTimeout(200);
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(200);
    await page.keyboard.press('Space');
    await expect(liveRegion).toHaveText(`Moved ${moving} to Applied`, { timeout: 15_000 });

    await page.reload();
    await expect(page.locator('main')).toBeVisible();
    await expect(card(stageColumn(page, 'Applied'), moving)).toBeVisible({ timeout: 15_000 });
    await expect(card(stageColumn(page, 'Saved'), moving)).toHaveCount(0);
  });
});
