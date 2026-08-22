import { expect, test } from '@playwright/test';

test('Material mode keeps compact board cards from becoming pills', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('job-hunter-design-mode', 'material');
  });
  await page.route('**/api/profiles/active', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ id: 1 }),
    }),
  );
  await page.route('**/api/jobs?**', (route) => {
    const stage = new URL(route.request().url()).searchParams.getAll('reaction');
    const items = stage.includes('saved')
      ? [
          {
            id: 'material-radius-fixture',
            title: 'Material radius fixture',
            company: 'Job Hunter',
            url: 'https://example.com/jobs/material-radius-fixture',
            sourceSlug: 'fixture',
            firstSeenAt: '2026-08-22T00:00:00.000Z',
            currentReaction: 'saved',
            currentReactionAt: '2026-08-22T00:00:00.000Z',
            matchScore: 80,
          },
        ]
      : [];
    return route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ items, total: items.length, highFit: 0, inMotion: 1, unreviewed: 0 }),
    });
  });

  await page.goto('/en/board');
  const card = page.locator('article').filter({ hasText: 'Material radius fixture' });
  await expect(card).toBeVisible();

  const cornerRadius = await card.evaluate((element) =>
    Number.parseFloat(window.getComputedStyle(element).borderTopLeftRadius),
  );
  expect(cornerRadius).toBeLessThanOrEqual(16);
});
