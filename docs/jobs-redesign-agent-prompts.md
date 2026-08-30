# Job Hunter redesign — coding-agent prompt pack

For an agent (Cursor / Claude Code / Codex) running locally with write access to `E:\job-hunter`.

The full design spec is `docs/jobs-redesign.md` from this project. **Copy that file into the repo at `docs/jobs-redesign.md` first** — every prompt below references it. If you'd rather not, paste the relevant spec section into the prompt instead of the `§` reference.

Run the steps **in order**, one prompt per agent session/commit. Do not batch — each step ends with a verifiable checkpoint.

---

## Step 0 — Orientation (read-only, run first)

```
Read docs/jobs-redesign.md end to end. Then explore this repo and produce a
written mapping report at docs/redesign-audit.md containing:

1. The framework, router, styling system, state/data layer, and component
   library actually in use (with the file that proves each).
2. The file path of the /en/jobs page and every component it renders,
   as a tree.
3. The file path of the /en/board page and its drag-and-drop implementation:
   which library, where the drop handler lives, and where the persistence
   mutation is called.
4. Where the Fieldwork/Material theme toggle is implemented, how the theme
   value is stored, and how it reaches CSS today.
5. A table of every hardcoded color, border-radius, box-shadow, and
   font-family literal found under the jobs/board/theme files:
   file:line -> literal value -> the semantic token from spec §7.1 it should
   become.
6. Any place the spec conflicts with an existing constraint (i18n routing,
   SSR, a design system already in use). List conflicts; do not resolve them.

Change no other file. Do not start implementing.
```

**Checkpoint:** read `docs/redesign-audit.md`. If §6 lists real conflicts, resolve them with me before Step 1.

---

## Step 1 — Token layer

```
Implement spec §7 (token system).

- Add the Fieldwork and Material token blocks from §7.2 to the global
  stylesheet, keyed on `:root[data-theme="fieldwork"]` and
  `:root[data-theme="material"]`, plus the density blocks on
  `:root[data-density="..."]`.
- Wire the existing theme toggle so it sets `data-theme` on <html>. Keep the
  existing dark-mode mechanism working; dark mode is a separate `data-mode`
  attribute and must compose with either theme.
- Persist theme and density; set both attributes before first paint so there
  is no flash (inline script in the document head, or the framework's
  equivalent).
- Add a `data-density` toggle (compact | comfortable) to the header,
  defaulting to compact.
- Do NOT restyle any component yet.

Acceptance: toggling Fieldwork/Material changes the attribute and the token
values resolve in devtools; the app still looks exactly as it does today
because no component consumes the new tokens yet. Dark mode still works in
both themes. No hydration warnings.
```

---

## Step 2 — Token migration sweep

```
Using the table in docs/redesign-audit.md §5, replace every hardcoded color,
radius, shadow, and font-family under the jobs, board, and shared-UI files
with the semantic tokens from spec §7.1.

Rules:
- No component may contain a literal hex/rgb/oklch color, a numeric
  border-radius, a box-shadow, or a font-family. All come from tokens.
- Fieldwork values must be transcribed so the Fieldwork theme is
  pixel-equivalent to today's UI. Material will look different — that is
  expected and correct.
- Apply the theme character table in spec §7.3 where a component needs
  per-theme behavior (chips outlined vs tonal, borders vs elevation,
  touch target size). Express this through tokens, never a JS branch on
  theme.

Acceptance: grep the touched files for `#`, `rgb(`, `box-shadow:`,
`border-radius:`, `font-family:` — only token definitions match. Toggling
data-theme visibly rethemes the page with zero JS re-render.
```

---

## Step 3 — ScoreMeter, StageBadge, JobRow

```
Implement the ScoreMeter, StageBadge, and JobRow components per spec §3.1,
§3.2, §3.3 and their entries in §8.

Key requirements:
- ScoreMeter: unscored jobs render a dashed track and "—", NOT "0". Score
  bands and colors exactly as §3.2. aria-label "Score N of 100".
- StageBadge: one component, five state tokens plus neutral. Clicking it
  opens an inline stage picker that mutates the job's stage optimistically —
  no navigation.
- JobRow: row height from --density-row, cell padding from --density-cell.
  Remove the always-visible Delete column; row actions move into a hover/
  focus-revealed "⋯" menu (Open source, Copy link, Hide, Delete).
- Selection styling and keyboard-focus styling must be visually distinct
  (§3.1).
- Virtualize the list.

Acceptance: the jobs table renders identically in structure but scores are
scannable, stages are editable inline, and no Delete button is reachable
without an intentional menu open. Both themes correct.
```

---

## Step 4 — Detail pane and list/detail split

```
Implement spec §3.4 (detail pane) and the list/detail split from §1.1.

- Clicking a row, pressing Enter, or pressing D opens a docked right pane
  with the six sections in §3.4, in that order.
- The pane swaps content without remounting when the selection changes.
- Resizable via a drag handle, width clamped 420–640px and persisted.
- Responsive behavior exactly per §3.4: docked ≥1280, docked + collapsed
  context column 1024–1279, slide-over sheet 768–1023, full-screen drawer
  <768. Sheet and drawer trap focus and restore it on close.
- The pane must never trigger a route navigation.

Acceptance: a job can be read in full, staged, tagged, and its score
explained, without the list losing scroll position.
```

---

## Step 5 — Keyboard triage, focus mode, bulk actions

```
Implement spec §2 in full.

- The key map in §2.2, shared by the list, focus mode, and board. Shortcuts
  suspend while an input/textarea/contenteditable is focused.
- Focus mode (§2.1): toggled by F or Enter, one job at a time, auto-advance
  after a stage action, U to undo, [why?] expands the score breakdown.
  Exiting returns the list to the last-touched job and flashes it.
- BulkActionBar (§2.3): docked to the bottom of the list surface on
  selection. No confirm dialogs anywhere. Every destructive action is
  optimistic with a single 8s undo toast; Cmd/Ctrl+Z also undoes while the
  toast is alive.
- Default view is the Unreviewed queue with a live "N left" pill and the
  queue-clear empty state from §2.4.
- Add the ShortcutSheet (§8) on "?".

Acceptance: 25 unreviewed jobs can be triaged end to end without touching
the mouse, and any mistake is one keystroke away from being undone.
```

---

## Step 6 — Filters, chips, saved views

```
Implement spec §4.

- Replace the inline filter bar with the two-line chip model in §4.1.
- Advanced filters move into a right slide-over (§4.2) that applies live
  with no Apply button.
- SavedViewTabs (§4.3) above the list, with the five system views shipped
  and user views creatable from the filter panel footer.
- Active view and all ad-hoc filters serialize to query params
  (?view=unreviewed&source=dou&posted=7d) so state is linkable and survives
  reload. Preserve the /en locale prefix in every generated URL.

Acceptance: filter state round-trips through a copy-pasted URL; the filter
UI occupies at most two lines at 1024px wide.
```

---

## Step 7 — Responsive pass

```
Implement spec §5.

- Honor the breakpoint matrix exactly. The table must NEVER horizontally
  scroll: below 768 rows become the JobCard from §8, with swipe-left reject
  and swipe-right save.
- Rail nav becomes a drawer below 768; context column becomes a drawer
  below 1024.
- Focus mode gets a thumb-reachable bottom action bar on mobile, 44px min
  touch targets (48px under the Material theme, via tokens).
- Density toggle must only change --density-* values; no JS branching on
  density.
- Respect prefers-reduced-motion: disable pane slide, row flash, and DnD
  spring animations.

Acceptance: the page is fully usable at 375px, 768px, 1024px, 1440px, and
1920px with no horizontal scroll and no clipped controls, in both themes.
```

---

## Step 8 — Board drag-and-drop

```
Implement spec §6. This is the only step that changes a dependency.

- Replace the current DnD implementation with @dnd-kit/core +
  @dnd-kit/sortable. The dragged card renders in a DragOverlay portal and
  moves via translate3d; the source card stays in place at 40% opacity.
  Columns must not reflow during the drag.
- Drop indicator is a single 2px --accent insertion rule, not animated gaps.
- Collision detection uses closestCenter against a rect map measured on drag
  start. There must be zero getBoundingClientRect calls in the pointer-move
  path. Auto-scroll re-measures only the scrolled column.
- Virtualize columns over 50 cards with @tanstack/react-virtual, overscan 6,
  with a column-level fallback drop target for the virtualized region.
- Moves are optimistic: update the cache, then fire the mutation, roll back
  and toast on failure. No network call inside the drag gesture.
- Keyboard DnD per §6.5 with a live region announcement.
- Empty columns collapse to a 56px strip per §6.6; column header shows the
  stage badge, count, WIP limit (red when exceeded), and a ⋯ menu.

Acceptance: profile a drag across all five columns in the browser
performance panel — no long tasks over 16ms in the pointer-move path, and no
layout/recalc-style entries attributable to non-dragged cards. A card can be
moved end to end using only the keyboard.
```

---

## Step 9 — Verification

```
Run a final pass and report findings in docs/redesign-verification.md:

1. Grep the touched files for hardcoded colors, radii, shadows, and
   font-families. List any survivors.
2. Screenshot /en/jobs and /en/board at 375, 768, 1024, 1440, 1920 in
   Fieldwork light, Fieldwork dark, Material light, Material dark.
   20 screenshots. Flag any layout break.
3. Keyboard-only walkthrough: triage 3 jobs from the list, 3 from focus
   mode, and move 1 card across the board. Note any focus trap, lost focus,
   or unreachable control.
4. Confirm every acceptance criterion from steps 1–8. List any not met.

Fix only regressions you introduced; report anything else.
```

---

## Guardrails to paste into every prompt

```
Constraints for this task:
- Presentation layer only. Do not change the data model, API routes,
  scoring logic, or database schema.
- Preserve the /en locale prefix and existing i18n keys; add new keys for
  new strings in both EN and UK.
- Do not remove existing functionality. If the spec omits something the
  current page does, keep it and note it.
- No component may hardcode a color, radius, shadow, or font-family.
- Every interactive element needs a visible focus ring and an accessible
  name.
- Run the project's typecheck, lint, and tests before declaring done.
- Stop and ask if a spec requirement conflicts with an existing constraint.
```

## Suggested commit sequence

`feat(theme): semantic token layer for fieldwork + material` → `refactor(ui): migrate jobs/board to tokens` → `feat(jobs): score meter, stage badge, virtualized rows` → `feat(jobs): detail pane` → `feat(jobs): keyboard triage + focus mode + bulk actions` → `feat(jobs): filter chips + saved views` → `feat(jobs): responsive pass` → `perf(board): dnd-kit transform drag + virtualization` → `chore: redesign verification`
