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

| Token | Dark | Light | Use |
|---|---|---|---|
| `--background` | `#101311` (warm near-black, green-tinted) | `#FAFAF7` | app canvas |
| `--surface` | `#171B18` | `#FFFFFF` | cards, table, kanban columns |
| `--surface-elevated` | `#1E2420` | `#FFFFFF` + shadow | popovers, dialogs, drawers |
| `--border` | `#2A312C` | `#E6E8E3` | hairlines (1px only) |
| `--text-primary` | `#ECEEE9` | `#1A1D1B` | body, cell text |
| `--text-muted` | `#9AA39C` | `#5F6660` | secondary, timestamps |
| `--accent` | `#4ADE80` → hover `#36C56C` | `#15803D` → hover `#116632` | primary actions, active nav, links |
| `--accent-foreground` | `#0B140D` | `#FFFFFF` | text on accent |
| `--destructive` | `#F87171` | `#B91C1C` | reject, delete |
| `--warning` | `#FBBF24` | `#A16207` | red flags, stale runs |

Semantic score scale (badges + table cell tint, both themes AA-checked):
`score ≥ 80` accent-green · `60–79` lime/neutral · `40–59` amber · `< 40` muted gray.
Stage colors: `saved` gray · `applied` blue `#60A5FA/#1D4ED8` · `interview` violet `#A78BFA/#6D28D9` ·
`offer` accent-green · `rejected` muted red. Stage colors appear **only** on badges and kanban
column headers — never as large surfaces.

Rules: backgrounds and borders do 90% of the work; accent appears in ≤ 2 places per screen
region. All text/background pairs must pass WCAG AA (4.5:1 body, 3:1 large/UI).

### 2.2 Typography

| Role | Font | Notes |
|---|---|---|
| UI / body | **Geist Sans** (next/font, self-hosted) | 13px base in tables, 14px forms/body, `-0.01em` tracking |
| Data / numbers | **JetBrains Mono** | scores, salaries, dates, counts — always `font-variant-numeric: tabular-nums` |
| Display (page titles, empty states) | Geist Sans 600 | 18–24px; this app needs no hero type |

Scale (px): 12 · 13 · 14 · 16 · 18 · 24. Line-height 1.45 body, 1.2 headings.
Cyrillic must render from the same families (both cover Cyrillic) — no fallback font swap
between EN and UA locales.

### 2.3 Spacing & density

4px base grid. Density presets (user-switchable later, default **compact**):
- Table row height: 36px compact / 44px comfortable; cell padding `px-3`.
- Card padding 16px; page gutter 24px; section gap 24px.
- Sidebar 232px expanded / 56px collapsed (icons + tooltips).

### 2.4 Shape & elevation

Radius: 6px controls, 8px cards/popovers. Dark theme: elevation via lighter surface steps
(`--surface` → `--surface-elevated`), shadows nearly invisible. Light theme: 1px border +
soft shadow (`0 1px 2px rgb(0 0 0 / 0.06)`). No glassmorphism, no glow effects.

## 3. Theming

- `next-themes`, `attribute="class"`, `defaultTheme="system"`, toggle in the sidebar footer
  (light/dark/system three-state).
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

- **Filter bar** (sticky under topbar, single row, overflow → "More filters" popover):
  full-text search input · source multi-select · score min slider · stage multi-select ·
  tags combobox · remote switch · salary min · **date-range picker** (shadcn Calendar,
  presets: today / 3d / 7d / 30d / custom; bound to `date_field` selector posted/first-seen).
  Active filters render as removable chips; "Reset" appears only when ≥ 1 filter active.
- **Table** (TanStack Table + shadcn Table):
  columns `☑ | score | title+company | source | salary | tags (≤3 +N) | posted | stage`.
  Sortable: score, posted, salary. Column visibility menu. Virtualized (`@tanstack/react-virtual`)
  above 200 rows. Row click → detail drawer; ⌘/ctrl-click → full page.
- **Bulk actions**: checkbox column; selection summons a bottom action bar
  ("N selected — Mark applied · Reject · Save · Set stage…"). Esc clears selection.
- **Keyboard**: `j/k` row navigation, `x` toggle select, `Enter` open, `a` applied, `r` rejected,
  `/` focus search. Shortcuts listed in a `?` help dialog.
- Empty states: distinct copy for "no jobs yet" (point to Sources) vs "filters match nothing"
  (offer reset). No illustration clip-art; icon + one sentence + one action.

### 5.2 Board (`/board`) — reaction stages kanban

- Columns: **Saved · Applied · Interview · Offer · Rejected** (job_reaction_current view).
- Card: title, company, score badge, source favicon, days-in-stage; ≤ 64px tall.
- Drag & drop via `@dnd-kit/core` (+ keyboard sensor: space to lift, arrows to move) —
  drop = new reaction event (same API as bulk actions). Optimistic update, toast on failure
  with undo.
- Column header: count + WIP hint; virtualized column bodies past 50 cards.
- Rejected column collapsed by default.

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
`ProviderCard`, `LocaleSwitch`, `ThemeToggle`.

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
