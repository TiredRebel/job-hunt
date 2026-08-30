# Jobs redesign — verification report

Updated after gap-closure pass (FilterChipBar, context column, soft-delete undo, board collision).

## 1. Hardcoded color / radius / shadow / font-family grep

Scoped to `apps/web/src/components/jobs` and `apps/web/src/components/board`:

- No matches for `#…`, `rgb(`, `oklch(`, `box-shadow:`, `border-radius:`, or `font-family:` in component TSX.
- Survivors intentionally live in `apps/web/src/app/globals.css` (token definitions only).

## 2. Screenshots

Skipped (no lightweight Playwright capture this pass). Manual QA: `/en/jobs` and `/en/board` at 375 / 768 / 1024 / 1440 / 1920 × Fieldwork/Material × light/dark.

## 3. Keyboard walkthrough

Key map implemented in `use-keyboard-nav.ts`. Live in-app triage not run this pass — leave as manual QA.

## 4. Acceptance criteria checklist (steps 1–8)

| Step | Criterion                                                                                                         | Status                     |
| ---- | ----------------------------------------------------------------------------------------------------------------- | -------------------------- |
| 1    | Token layer (`data-theme` / `data-density` / `data-mode`)                                                         | Met                        |
| 2    | Jobs/board consume tokens                                                                                         | Met                        |
| 3    | ScoreMeter, StageBadge picker, row ⋯, virtualized rows                                                            | Met                        |
| 4    | Detail pane local state, resize, responsive sheet/drawer                                                          | Met                        |
| 5    | Key map, focus mode, bulk bar, undo toast, Unreviewed default                                                     | Met                        |
| 6    | Two-line FilterChipBar + live advanced Sheet; SavedViewTabs in context; `?view=`                                  | Met                        |
| 7    | JobCard &lt;768, density tokens, reduced-motion                                                                   | Met (shell rail unchanged) |
| 8    | dnd-kit + cached `closestCenter` rect map; BeforeDragging measure; empty-column collapse; overscan 6; 40% opacity | Met                        |

## 5. Automated verification

- `npm run typecheck` in `apps/web`: **pass** (after gap closure)
- Targeted vitest: filter-bar, jobs-client soft-delete, bulk-action-bar, board-collision
- `graphify update .`: after code changes

## 6. Closed this pass

1. **FilterChipBar §4** — `filter-bar.tsx`: line 1 search + Filters sheet + sort; line 2 chips / `+N` / Clear all (≥2); advanced Sheet applies live; footer Reset + Save as view (localStorage).
2. **Context column + sticky header §1** — `jobs-context-column.tsx` (280px ≥1440, icon rail 1024–1439, drawer &lt;1024); `jobs-page-header.tsx` condensed on list scroll.
3. **Soft-delete / hide undo** — Hide restores via `setJobStatus(id, 'processed')`. Deletes soft for 8s (optimistic cache remove; timer commits `deleteJob`/`deleteJobs`; Undo cancels timer).
4. **Board collision §6.2** — `board-collision.ts` snapshots droppableRects and runs `closestCenter`; `MeasuringStrategy.BeforeDragging`; invalidate on drag start/end/cancel; empty columns auto-collapse (expand on drag / click).

## 7. Remaining / deferred

1. Full 20-viewport screenshot matrix — manual.
2. Live keyboard triage session — manual.
3. User saved views are localStorage stubs (create only); no rename/reorder/delete UI yet.
4. Soft-delete undo cannot resurrect after the 8s commit (no server soft-delete API) — by design of delayed hard delete.
5. Context column does not yet host a full “active filter tree” beyond saved views + progress meter.
