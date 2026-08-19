# UI DESIGN — Job Hunter web app

> Composed with the `design-taste-frontend` skill applied to a data-dense product UI.
> Locked decisions: **dark+light theme toggle · Tailwind + shadcn/ui · dense table + stage kanban · EN+UA i18n**.

## 1. Product posture

Single power user, daily triage of dozens–hundreds of vacancies. The UI is a **pro tool**, not a
marketing surface: information density, keyboard flow and scan speed win over decoration.
Dark theme is the primary design target (daily driver); light theme must be equally polished,
not an inverted afterthought.

## 2. Design tokens

All tokens are CSS variables on `:root` (light) and `.dark` (dark), consumed via Tailwind
(`@theme` / shadcn/ui convention). Never hardcode hex in components.

### 2.1 Color

One accent. No purple-on-dark "AI product" cliché, no multi-color gradients.
Accent = **hunter green** (matches the product name, reads as "go/match").

| Token                 | Dark                                      | Light                       | Use                                   |
| --------------------- | ----------------------------------------- | --------------------------- | ------------------------------------- |
| `--background`        | `#0C1410` (warm near-black, green-tinted) | `#F2F6F2`                   | app canvas                            |
| `--surface`           | `#121D17`                                 | `#FBFDFB`                   | cards, table, kanban columns          |
| `--surface-elevated`  | `#1A2921`                                 | `#E9EFEA`                   | popovers, dialogs, drawers            |
| `--surface-tonal`     | `#22372B`                                 | `#DFE8E1`                   | tinted panel accents                  |
| `--border`            | `#2B3A31`                                 | `#D5DED7`                   | hairlines (1px only)                  |
| `--text-primary`      | `#EDF4EF`                                 | `#142019`                   | body, cell text                       |
| `--text-muted`        | `#98A99F`                                 | `#647169`                   | secondary, timestamps                 |
| `--accent`            | `#67D6A0` → hover `#85E5B7`               | `#0C7A55` → hover `#085F43` | primary actions, active nav, links    |
| `--accent-soft`       | `#153C2B`                                 | `#D4EDE1`                   | soft accent fills (badges, selection) |
| `--accent-foreground` | `#072116`                                 | `#FFFFFF`                   | text on accent                        |
| `--destructive`       | `#F87171`                                 | `#B91C1C`                   | reject, delete                        |
| `--warning`           | `#FBBF24`                                 | `#A16207`                   | red flags, stale runs                 |

The sidebar is a fixed dark-green rail in both themes and carries its own
token family: `--sidebar`, `--sidebar-foreground`, `--sidebar-muted`,
`--sidebar-active`, `--sidebar-border` (translucent separators tuned per
theme/design mode) — components use these, never raw `black/xx`/`white/xx`.

Semantic score scale (badges + table cell tint, both themes AA-checked):
`score ≥ 80` accent-green · `60–79` lime/neutral · `40–59` amber · `< 40` muted gray.
Stage colors: `saved` gray · `applied` blue `#60A5FA/#1D4ED8` · `interview` violet `#A78BFA/#6D28D9` ·
`offer` accent-green · `rejected` muted red. Stage colors appear **only** on badges and kanban
column headers — never as large surfaces.

Rules: backgrounds and borders do 90% of the work; accent appears in ≤ 2 places per screen
region. All text/background pairs must pass WCAG AA (4.5:1 body, 3:1 large/UI).

### 2.2 Typography

| Role                                | Font                                    | Notes                                                                         |
| ----------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------- |
| UI / body                           | **Geist Sans** (next/font, self-hosted) | 13px base in tables, 14px forms/body, `-0.01em` tracking                      |
| Data / numbers                      | **JetBrains Mono**                      | scores, salaries, dates, counts — always `font-variant-numeric: tabular-nums` |
| Display (page titles, empty states) | Geist Sans 600                          | 18–24px; this app needs no hero type                                          |

Scale (px): 12 · 13 · 14 · 16 · 18 · 24, plus a **micro tier (10–11px)** reserved for
non-copy chrome only: the `.utility-label` class (11px mono, uppercase, `0.12em` tracking —
eyebrows and section labels), count badges, and `kbd` hints. Never body or interactive text.
Line-height 1.45 body, 1.2 headings.
Cyrillic must render from the same families (both cover Cyrillic) — no fallback font swap
between EN and UA locales.

### 2.3 Spacing & density

4px base grid. Density presets (user-switchable later, default **compact**):

- Table row height: 36px compact / 44px comfortable; cell padding `px-3`.
- Card padding 16px; page gutter 24px; section gap 24px.
- Sidebar 248px expanded / 64px collapsed (icons + tooltips).

### 2.4 Shape & elevation

Radius: 8px controls (`--radius-control`), 12px cards/popovers (`--radius-card`).
Elevation is soft and green-tinted in both themes: light uses layered shadows
(`--shadow-elevated`, plus `--shadow-panel` with a subtle inset highlight for
`.workspace-panel` framing); dark uses one deep ambient shadow
(`0 18px 40px rgb(0 0 0 / 0.28)`) on top of lighter surface steps
(`--surface` → `--surface-elevated`). No glassmorphism, no glow effects.

## 3. Theming

- `next-themes`, `attribute="class"`, `defaultTheme="system"`, toggle in the topbar
  (light/dark/system three-state).
- **Design-mode axis** (orthogonal to light/dark): `data-design` on the root element
  selects between **Fieldwork** (default, the token values above) and an optional
  **Material 3** interpretation seeded from the same hunter green (pill controls
  `--radius-control: 999px`, 22px cards, light-green sidebar). Only token _values_
  change — no component forks. Toggled via `DesignModeToggle` in the topbar,
  persisted in `localStorage`, applied after hydration.
- Tokens defined once in `globals.css`; shadcn/ui components inherit automatically.
- Charts/score tints read tokens via `hsl(var(--…))` — no theme-forked component code.
- Guard: no `dark:` utility overrides for colors that exist as tokens.

## 4. Layout & navigation

```
┌──────────┬──────────────────────────────────────────────┐
│ Sidebar  │ Topbar: page title · global search (⌘K) ·    │
│          │ locale switch · theme toggle                  │
│ Jobs     ├──────────────────────────────────────────────┤
│ Board    │                                              │
│ Sources  │              Page content                    │
│ Dicts    │                                              │
│ Profile  │                                              │
│ Settings │                                              │
└──────────┴──────────────────────────────────────────────┘
```

Desktop-first (min target 1280px); functional down to 1024px (sidebar collapses).
Mobile is read-only convenience, not a design target (per ARCHITECTURE.md).

## 5. Screens

### 5.1 Jobs dashboard (`/jobs`) — primary surface

- **Summary panel**: four counts — all roles / high fit / in motion / unreviewed. All four
  come from the list endpoint's count query and share one scope: every row matching the
  active filter, never the loaded page. Deriving some from the page while `total` stayed
  global made the panel contradict the table; never mix the two scopes in one row of numbers.
- **Filter bar** (sticky under topbar, single row, overflow → "More filters" popover):
  full-text search input (title + company + LLM summary — **never** the raw description:
  almost every posting body name-drops the whole team, so "QA" matched every backend role;
  tech-stack queries belong in the tags filter) · source multi-select · score min slider ·
  stage multi-select ·
  tags combobox · remote switch · salary min · **date-range picker** (shadcn Calendar,
  presets: today / 3d / 7d / 30d / custom; bound to `date_field` selector posted/first-seen).
  Active filters render as removable chips; "Reset" appears only when ≥ 1 filter active.
- **Table** (TanStack Table + shadcn Table):
  columns `☑ | score | title+company | source | salary | tags (≤3 +N) | posted | stage`.
  Sortable: score, posted, salary — **posted descending is the default**, and the header
  indicator reflects it even with no `sortBy` in the URL. Column visibility menu.
  Virtualized (`@tanstack/react-virtual`)
  above 200 rows. Row click → detail drawer; ⌘/ctrl-click → full page.
- **Bulk actions**: checkbox column; selection summons a bottom action bar
  ("N selected — Mark applied · Reject · Save · Set stage…"). Esc clears selection.
- **Keyboard**: `j/k` row navigation, `x` toggle select, `Enter` open, `a` applied, `r` rejected,
  `/` focus search. Shortcuts listed in a `?` help dialog.
- Empty states: distinct copy for "no jobs yet" (point to Sources) vs "filters match nothing"
  (offer reset). No illustration clip-art; icon + one sentence + one action.
- Each row has a keyboard-accessible Delete action. It names the vacancy in the
  existing confirmation prompt, is not optimistic, and preserves URL filters
  and selection state when a request fails. Deletion is permanent.

### 5.2 Board (`/board`) — reaction stages kanban

- Columns: **Saved · Applied · Interview · Offer · Rejected** (job_reaction_current view).
- Card: title, company, score badge, source favicon, days-in-stage; ≤ 64px tall.
- Drag & drop via `@dnd-kit/core` (+ keyboard sensor: space to lift, arrows to move) —
  drop = new reaction event (same API as bulk actions). Optimistic update, toast on failure
  with undo.
- Column header: count + WIP hint; virtualized column bodies past 50 cards.
- Rejected column collapsed by default.
- Each card has a keyboard-accessible Delete action that stops drag handling,
  confirms the vacancy title, and removes the card only after the API succeeds.

### 5.3 Job detail (drawer + `/jobs/[id]`)

Drawer (right, 560px) for triage flow; same component rendered full-page for deep work.
Sections in fixed order:

1. Header: title, company, source link (external ↗), score badge, stage select, posted/seen dates.
2. **LLM summary** + tech-stack tag chips + **red flags** list (warning tint, never red-on-red).
3. **Match explanation** (score breakdown from job_matches).
4. Description (sanitized original, collapsible, `prose` styling).
5. **Reaction timeline** (event log, mono timestamps).
6. **Cover letter**: draft viewer/editor (textarea + regenerate button, diff-safe save).

Primary actions pinned in drawer footer: Apply-stage buttons + "Open original".

### 5.4 Settings cluster

- `/settings/llm` — provider cards (name, model, latency/health dot), one active radio,
  "Test connection" inline result. Switching is one click + confirm.
- `/dictionaries` — table per dictionary kind (search / stop-words / must-have / nice-to-have /
  aliases); inline add row, tag-style item editing, enable/disable switch per item.
- `/sources` — source rows: enable switch, schedule (cron, human-readable hint), last run
  status + "Run now"; run history table with duration and item counts.
- `/profile` — form: skills tags, seniority, salary expectation, locations, stop-words.

## 6. i18n (EN + UA)

- `next-intl`, locales `en` / `uk`, default from `Accept-Language`, switcher in topbar,
  persisted in cookie. Messages in `apps/web/messages/{en,uk}.json`, flat, namespaced by page.
- **UA strings run ~15–30% longer** — all buttons/labels/table headers must tolerate this:
  no fixed-width buttons, truncate with tooltip in table cells, test both locales in Playwright.
- Dates/numbers/salary via `Intl` with active locale (uk: `1 500 грн`, en: `UAH 1,500`).
- LLM-generated content (summaries, letters) stays in its generated language — UI chrome only
  is translated. Job source data is never machine-translated by the UI.

## 7. Motion

Dashboard = minimal motion. Budget:

- Micro only: 120–160ms `ease-out` on hover/press/open (drawer 200ms slide).
- No scroll-triggered animation, no staggered page reveals, no skeleton shimmer loops longer
  than the load itself. Loading = skeleton rows matching real layout (no spinners in tables).
- `prefers-reduced-motion`: all transitions collapse to opacity or none.
- DnD uses transform-only movement (no layout thrash).

## 8. Accessibility gates (blocking)

- WCAG AA contrast in **both** themes, including score/stage badges.
- Full keyboard path: filter bar → table → bulk bar → drawer, visible `:focus-visible` ring
  (2px accent, 2px offset).
- Table: real `<table>` semantics, `aria-sort`, row selection announced; kanban DnD has
  keyboard sensor + `aria-live` move announcements.
- Toasts (`sonner`) polite; destructive bulk actions get an inline confirm (not a toast).
- Icon-only buttons always have tooltip + `aria-label` (both locales).

## 9. Component inventory (shadcn/ui base)

Table, Badge, Button, Input, Select, Combobox (multi), Popover, Calendar (range), Slider,
Switch, Tabs, Sheet (drawer), Dialog, DropdownMenu, Command (⌘K), Tooltip, Toast/sonner,
Skeleton, Separator, ScrollArea. Additions: TanStack Table v8, `@tanstack/react-virtual`,
`@dnd-kit/core`, `next-themes`, `next-intl`, `lucide-react` icons (16px in tables, 20px nav).

Custom components (in `apps/web/src/components/`): `ScoreBadge`, `StageBadge`, `JobTable`,
`FilterBar`, `BulkActionBar`, `JobDrawer`, `StageBoard`, `ReactionTimeline`, `DictEditor`,
`ProviderCard`, `LocaleSwitch`, `ThemeToggle`, `DesignModeToggle`, `JobsDashboardSummary`,
`SourceFormDialog`, `ProviderFormDialog`, `ProviderConfigDialog`.

## 10. Forbidden (anti-generic guard, adapted from skill)

- Purple/indigo gradient accents, glassmorphism, glow shadows, emoji as icons.
- More than one accent color per screen; colored panel backgrounds for content.
- Spinners inside content areas; layout-shifting loads.
- `dark:` per-component color overrides bypassing tokens.
- Fixed English-width UI that breaks under UA strings.
- Any scroll-hijack/parallax; animation above the stated budget.

## 11. Open items

- Density toggle (compact/comfortable) — later, post-MVP.
- Saved filter presets ("Hot remote TS jobs") — Phase 5 stretch.
- Charts (score distribution, pipeline funnel) — not in MVP; if added: unstyled recharts +
  tokens.
