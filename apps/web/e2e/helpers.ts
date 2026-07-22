/**
 * @module e2e/helpers
 *
 * Shared utilities for the apps/web e2e suite.
 */

/**
 * Run an interaction and confirm its effect, retrying the interaction once
 * if the check doesn't hold.
 *
 * Freshly-navigated pages are server-rendered, so Playwright can see an
 * input or button as actionable before React finishes attaching its event
 * listeners. An interaction landing in that window fires a native DOM
 * event with nothing listening — it's dropped, not delayed, so waiting
 * longer on the following assertion never recovers it. Confirmed via a CI
 * trace: an identical fill-then-assert sequence failed on one run and
 * passed on another of the same freshly-loaded page. By the time a full
 * assertion timeout has elapsed, hydration is done, so a second attempt is
 * reliable.
 *
 * @param act - Performs the interaction (fill, click, etc).
 * @param check - Asserts the interaction's effect; throws if it hasn't happened.
 */
export async function retryUntilHydrated(
  act: () => Promise<void>,
  check: () => Promise<void>,
): Promise<void> {
  await act();
  try {
    await check();
  } catch {
    await act();
    await check();
  }
}
