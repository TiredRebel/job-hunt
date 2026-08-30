# Jobs redesign — orientation audit

Generated for Step 0 of `docs/jobs-redesign-agent-prompts.md`. Read-only mapping of the repo against `docs/jobs-redesign.md`. No implementation in this step.

---

## 1. Stack in use

| Concern            | Actual                                                                                          | Proof                                                                                                    |
| ------------------ | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Framework          | Next.js 16 (App Router) + React 19                                                              | `apps/web/package.json` (`next`, `react`); `apps/web/src/app/[locale]/layout.tsx`                        |
| Router / i18n      | `next-intl` with `[locale]` segment; locale-aware `Link`/`useRouter` from `@/i18n/navigation`   | `apps/web/src/app/[locale]/layout.tsx`, `apps/web/src/i18n/routing.ts`                                   |
| Styling            | Tailwind CSS v4 + CSS variables in `globals.css`; `@theme inline` maps tokens to utility colors | `apps/web/src/app/globals.css`, `apps/web/package.json` (`tailwindcss`, `@tailwindcss/postcss`)          |
| Component library  | shadcn/ui (radix-nova) + Radix primitives + lucide                                              | `apps/web/components.json`, `apps/web/src/components/ui/*`                                               |
| Server/client data | TanStack Query v5; jobs list SSR’d then hydrated                                                | `apps/web/src/lib/hooks/use-jobs-query.ts`, `apps/web/src/app/[locale]/(dashboard)/jobs/page.tsx`        |
| Table              | `@tanstack/react-table` + `@tanstack/react-virtual`                                             | `apps/web/src/components/jobs/job-table.tsx`                                                             |
| Board DnD          | Already `@dnd-kit/core` + `@dnd-kit/sortable`                                                   | `apps/web/src/components/board/stage-board.tsx`, `package.json`                                          |
| Themes             | `next-themes` (`class` / `.dark`) + custom `data-design` (`fresh` \| `material`)                | `apps/web/src/components/providers/theme-provider.tsx`, `apps/web/src/components/design-mode-toggle.tsx` |

---

## 2. `/en/jobs` render tree

Route: `apps/web/src/app/[locale]/(dashboard)/jobs/page.tsx` → locale prefix from next-intl (`/en/jobs`).

```text
DashboardLayout (dashboard-shell: sidebar + topbar)
└── JobsPage
    └── Suspense
        └── JobsClient
            ├── JobsDashboardSummary          (4-up “Today’s Triage” strip)
            ├── FilterBar                     (inline filters + more panel)
            ├── scroll region
            │   ├── JobsEmptyState | JobTable
            │   │   └── columns from job-table-columns
            │   │       ├── Checkbox
            │   │       ├── ScoreBadge
            │   │       ├── title/company
            │   │       ├── source / salary / tags / posted
            │   │       ├── StageBadge
            │   │       └── Delete Button (always visible)
            ├── JobsPagination
            ├── keys hint
            ├── BulkActionBar
            ├── ShortcutsDialog
            └── JobDrawer (?job=) → JobDetailView
                ├── CoverLetterEditor
                ├── MatchExplanationBars
                ├── ReactionTimeline
                └── TagsInput
```

Supporting: `jobs-loading-state`, `jobs-load-error`, `multi-select`, `lib/jobs/search-params.ts`, `lib/hooks/use-keyboard-nav.ts`.

---

## 3. `/en/board` and DnD

| Item              | Location                                                                                               |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| Page              | `apps/web/src/app/[locale]/(dashboard)/board/page.tsx` → `<StageBoard />`                              |
| Library           | `@dnd-kit/core` + `@dnd-kit/sortable` (+ utilities) — already installed                                |
| Sensors / overlay | `stage-board.tsx` — `DndContext`, `DragOverlay`, Pointer + Keyboard sensors                            |
| Collision         | `board-collision.ts` — `pointerWithin` / `rectIntersection` (pointer); `closestCenter` (keyboard)      |
| Drop handler      | `stage-board.tsx` `handleDragEnd` — optimistic cache update, then `addReaction` / `setBoardOrder`      |
| Persistence       | `addReaction` (cross-column stage) + `setBoardOrder` (`PUT /v1/board/order`) via `@/lib/api/reactions` |
| Columns / cards   | `stage-column.tsx` (virtualize >50, overscan 8), `stage-card.tsx`                                      |

Gap vs spec §6: collision is not a start-of-drag rect map; overscan is 8 not 6; empty columns show copy rather than auto-collapsing to a 56px strip; source card opacity/indicator may differ from §6.1.

---

## 4. Fieldwork / Material theme toggle

| Item          | Today                                                                                                      |
| ------------- | ---------------------------------------------------------------------------------------------------------- |
| Control       | `DesignModeToggle` in `topbar.tsx`                                                                         |
| Storage       | `localStorage` key `job-hunter-design-mode` (`fresh` \| `material`)                                        |
| DOM attribute | `document.documentElement.dataset.design` → `data-design="fresh"                                           | "material"` |
| CSS           | `:root[data-design='material']` and `.dark[data-design='material']` in `globals.css`                       |
| Dark mode     | Orthogonal via `next-themes` → `class="dark"` on `<html>` (not `data-mode`)                                |
| FOUC          | Design mode applied in `useEffect` after mount — **can flash**; dark mode uses next-themes blocking script |

Spec wants: `data-theme="fieldwork"|"material"`, `data-mode="dark"`, density `data-density`, attributes before first paint.

---

## 5. Hardcoded literals → semantic tokens (§7.1)

Components under jobs/board mostly use Tailwind token utilities (`bg-surface`, `border-border`, `rounded-[var(--radius-control)]`, `shadow-[var(--shadow-elevated)]`). Literals live primarily in **token definitions** and a few utility class radii.

### `globals.css` (token definitions — migrate to §7.2)

| Location                 | Literal                                              | Target semantic token                                    |
| ------------------------ | ---------------------------------------------------- | -------------------------------------------------------- |
| `:root` L11–24           | `#f2f6f2` … `#ffffff` surfaces/text/accent           | `surface`, `surface-raised`, `text-primary`, `accent`, … |
| `:root` L31              | `rgb(255 255 255 / 0.1)`                             | `border-subtle` / sidebar border (keep or map)           |
| `:root` L34–53           | score/stage hex pairs                                | `state-*` / score via `accent` / `state-rejected` bands  |
| `:root` L55–56           | `0.5rem` / `0.75rem` radius                          | `radius-md` / `radius-lg`                                |
| `:root` L58–59           | shadow rgb stacks                                    | `elevation-1` / `elevation-2`                            |
| `.dark` L67–110          | dark hex/rgb                                         | `:root[data-mode="dark"][data-theme="…"]`                |
| material blocks L114–156 | material hex/rgb                                     | `:root[data-theme="material"]`                           |
| L231, 256, 268           | `font-family: var(--font-sans/mono)`                 | `font-ui` / `font-mono`                                  |
| L262–264                 | `border-radius` / `box-shadow` in `.workspace-panel` | `radius-lg` / `elevation-1`                              |

### Jobs / board / shared UI (consume tokens, not hex)

Most files already reference CSS variables. Remaining **numeric radius / shadow / font** patterns to replace with semantic tokens:

| File                                                         | Pattern                                                               | Token                                                                  |
| ------------------------------------------------------------ | --------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `job-table-columns.tsx` L136                                 | `rounded-[calc(var(--radius-control)-2px)]`                           | `radius-sm`                                                            |
| `bulk-action-bar.tsx` L85                                    | `rounded-t-[var(--radius-card)]`, `shadow-[var(--shadow-elevated)]`   | `radius-lg`, `elevation-2`                                             |
| `filter-bar.tsx`                                             | `rounded-full`, `rounded-[var(--radius-control)]`                     | `radius-pill`, `radius-md`                                             |
| `jobs-empty-state.tsx`                                       | `rounded-full`                                                        | `radius-pill`                                                          |
| `jobs-load-error.tsx`                                        | `rounded-[var(--radius-control)]`, `rounded-full`                     | `radius-md`, `radius-pill`                                             |
| `tags-input.tsx` / `multi-select.tsx`                        | calc radius                                                           | `radius-sm`                                                            |
| `match-explanation-bars.tsx`                                 | `rounded-full`                                                        | `radius-pill`                                                          |
| `shortcuts-dialog.tsx`                                       | `rounded` / `font-mono`                                               | `radius-sm`, `font-mono`                                               |
| `stage-card.tsx`                                             | `rounded-[min(...)]`, `shadow-[var(--shadow-elevated)]`, `rounded-sm` | `radius-md`, `elevation-2`, `radius-sm`                                |
| `stage-column.tsx`                                           | `rounded-[var(--radius-card)]`, calc control                          | `radius-lg`, `radius-sm`                                               |
| `score-badge.tsx` / `stage-badge.tsx`                        | calc radius + score/stage color utilities                             | ScoreMeter / StageBadge redesign; `state-*`, `radius-sm`/`radius-pill` |
| `design-mode-toggle.tsx` / `theme-toggle.tsx` / `topbar.tsx` | calc radius                                                           | `radius-sm` / `radius-md`                                              |
| `globals.css` `.workspace-panel`                             | literal `border-radius`/`box-shadow`                                  | token refs only                                                        |

No raw `#` / `rgb(` / `oklch(` in jobs/board **component** TSX today — they already go through CSS variables. Step 2 still remaps variable names and eliminates calc/literal radius/shadow/font-family in those files.

---

## 6. Spec vs existing constraints (conflicts — do not resolve here)

1. **Attribute naming:** Spec `data-theme` + values `fieldwork`/`material` vs current `data-design` + `fresh`/`material`. Renaming breaks stored `localStorage` unless migrated.
2. **Dark mode mechanism:** Spec `data-mode="dark"` vs `next-themes` `class="dark"`. Must compose both or replace class strategy carefully to avoid FOUC/hydration issues.
3. **Token rename & color science:** Spec §7.2 uses oklch semantic names (`surface-raised`, `accent-muted`, `state-saved`, …). Current UI_DESIGN tokens use hex and different names (`surface-elevated`, `accent-soft`, `stage-*-bg`). Whole app (Sources, Profile, shadcn) consumes current names — pure swap would restyle non-jobs pages.
4. **Detail pane routing:** Spec: pane must never navigate. Current `JobDrawer` is driven by `?job=` via `router.push`/`replace` — conflicts with “no route navigation” and deep-link survivability.
5. **Confirm dialogs:** Spec forbids confirms; current delete/reject use `window.confirm`.
6. **Keyboard map:** Spec Space=select, `X`=reject, `H`=hide, `U`=undo, `F`/`D` focus/detail. Current: `x`=select, `r`=reject (with confirm), no hide/undo/focus-mode/`D`.
7. **Default view:** Spec default Unreviewed queue + `?view=`. Current list has no saved-view system; default is unfiltered page with `DEFAULT_JOBS_LIMIT=20`.
8. **Fonts:** Spec Fieldwork Inter / Material Roboto Flex. App loads Geist + JetBrains Mono via `next/font`. Changing fonts globally affects brand consistency outside jobs.
9. **Row height:** Spec 44/56 via `--density-row`. Table hardcodes `ROW_HEIGHT = 36`.
10. **Board Step 8 “replace DnD”:** DnD already is dnd-kit; step is refinement, not a greenfield dependency add — still the only step allowed to change deps/mutation path.
11. **i18n:** New strings need EN + UK keys; locale prefix `/en` must stay on every generated URL (already via next-intl navigation helpers).
12. **SSR / hydration:** Design mode currently post-hydration; adding blocking script + `data-theme`/`data-density` must keep `suppressHydrationWarning` and avoid React attribute mismatches.
13. **Presentation-only guardrail:** Optimistic undo toasts and saved views need client persistence (localStorage) without API/schema changes — user views cannot be server-persisted “per user” without a store; local-only is the conflict.

**Resolution policy for later steps (not applied in Step 0):** migrate attributes with localStorage alias; sync `data-mode` with next-themes; add §7 tokens and alias legacy names so non-jobs pages keep working; detail pane local state (optional read of `?job` on mount without push on open); remove confirms in favor of undo toasts; implement keymap/views/density per spec; keep Geist as Fieldwork `font-ui` for pixel continuity unless fonts are explicitly swapped.
