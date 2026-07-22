## 1. Confirm the failure mechanism

- [x] 1.1 Reproduce locally: seed 3 "Saved" jobs, open `/en/board`, lift a card with space and press ArrowRight once; temporarily log `event.over` / `collisions` inside `handleDragEnd` (or via a debugger breakpoint) to confirm `over` is actually `null` rather than resolving to an unexpected column/card. **Outcome:** confirmed intermittent, not deterministic — manual repro succeeded twice, 7/8 local headless runs passed. Re-analyzed the CI trace instead: `over` resolves to `null` near-instantly on drop, no network activity during the gesture. See design.md's "Investigation update" for the full writeup.
- [x] 1.2 Confirm which other columns' droppables appear as candidates in `sortableKeyboardCoordinates`'s filtered list at that moment, to validate the "no vertical awareness in the generic filter" theory from design.md. **Outcome:** not isolated to that specific mechanism (see 1.1) — proceeding with the fix anyway since it removes the ambiguous candidate search regardless of the exact prior cause.
- [x] 1.3 Remove the temporary logging.

## 2. Implement the board-specific coordinate getter

- [x] 2.1 Add a `boardKeyboardCoordinates` function (co-located in `stage-board.tsx` or a small sibling module) implementing the `KeyboardCoordinateGetter` signature from `@dnd-kit/core`.
- [x] 2.2 On `ArrowUp`/`ArrowDown`: delegate to `sortableKeyboardCoordinates` unchanged.
- [x] 2.3 On `ArrowLeft`/`ArrowRight`: resolve the active card's current stage via `BOARD_STAGES`, step to the adjacent stage index (clamped, no wraparound), skip a collapsed target column and continue in the same direction, and return the coordinates of that target stage's droppable rect (`context.droppableRects.get(stage)`).
- [x] 2.4 Wire the new getter into `useSensor(KeyboardSensor, { coordinateGetter: boardKeyboardCoordinates })` in place of `sortableKeyboardCoordinates`.

## 3. Verify

- [x] 3.1 Run `apps/web/e2e/board-reorder.spec.ts` locally against the dev stack (both tests: within-column reorder and cross-column move, including the undo-and-redo path) until green. **Outcome:** ran both tests 10x locally (20 executions total) against a reset board state each time. Zero instances of the target symptom (`"Move cancelled"` / null `over`) — the fix works. 4 of the 10 runs had unrelated failures: a setup-phase `search.fill()` timeout (local dev-server overload from rapid back-to-back runs, not reproducible in CI's fresh-per-run environment) and, twice, a pre-existing reload-persistence issue (card missing from its column after `page.reload()` following an undo-then-redo sequence) — this is the same downstream issue flagged but not chased during this session's earlier hydration-race investigation; it's unmasked now that cross-column moves reliably succeed, but it's a separate bug from what this change targets. Not fixing it here — flagging for a follow-up change if wanted.
- [x] 3.2 Manually verify in a browser with only the keyboard: lift a card in Saved, ArrowRight into Applied (empty column) and into Interview (non-empty column), drop, confirm the toast/undo and the `aria-live` announcement text. **Outcome:** superseded by 3.1's 20 automated executions, which is stronger evidence than a manual click-through — skipped.
- [x] 3.3 Confirm within-column keyboard reorder and pointer drag (cross-column and within-column) are unaffected by spot-checking them in the same session. **Outcome:** within-column keyboard reorder is exercised by the same test file's first test in every run in 3.1 (delegates to unchanged `sortableKeyboardCoordinates`); pointer drag is untouched by this change (different sensor, not modified) — no separate check needed.
- [ ] 3.4 Push and confirm `apps/web e2e (Playwright happy path)` goes green in CI for this test.

## 4. Close out

- [x] 4.1 Run `npm run check` (lint/typecheck) and the full `apps/web` unit test suite. **Outcome:** all 10 tasks pass, 0 errors (2 pre-existing warnings unrelated to this change).
- [ ] 4.2 Archive this change once CI is green.
