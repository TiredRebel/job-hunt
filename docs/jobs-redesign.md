# Job Hunter — `/en/jobs` Redesign Specification

Version 1.0 · presentation-layer only · token-driven for **Fieldwork** and **Material**

Density target: **3/5** — compact rows, generous grouping, optional comfortable/compact toggle.

Goals, in priority order:

1. Triage 25 unreviewed roles in under two minutes, keyboard-only.
2. Read a job without leaving the list.
3. Work at 375px as well as at 1920px.
4. Board drag-and-drop that never drops a frame.

---

## 1. Page shell

### 1.1 Zones

```text
┌────────┬──────────────┬─────────────────────────────────────────────┐
│  rail  │   context    │              work surface                   │
│  nav   │   column     │  ┌──────────────────┬────────────────────┐  │
│ 240px  │  280px       │  │  list (flex)     │  detail  420–640px │  │
│        │ (collapsible)│  └──────────────────┴────────────────────┘  │
└────────┴──────────────┴─────────────────────────────────────────────┘
```

- Rail nav is unchanged in structure; only tokens change per theme.
- The **context column** holds saved views, the active filter tree, and the triage progress meter. It is collapsible to 0 and remembers its state per user.
- The **work surface** is the list + detail split. Detail width is drag-resizable and persisted.

### 1.2 Header

Two states, driven by scroll position:

| State                     | Height | Contents                                                                       |
| ------------------------- | ------ | ------------------------------------------------------------------------------ |
| Expanded (`scrollY == 0`) | 64px   | `Jobs` title, `27 roles · 25 unreviewed` subline, search, lang, theme, density |
| Condensed (`scrollY > 8`) | 44px   | `Jobs · 25 unreviewed` on one line, search (icon-only <1024), controls         |

Transition: height + opacity, 120ms `ease-out`. No layout shift below — the header is `position: sticky` inside a fixed-height flex column, so the list scroll container owns the scrollbar.

### 1.3 Stat strip (replaces "Today's Triage")

A 4-up strip: **All roles · High fit · In motion · Unreviewed**.

- Each cell: label (`--text-secondary`, 11px, tracking 0.08em, uppercase), value (24px, `--text-mono` in Fieldwork / 500-weight sans in Material).
- Each cell is a **button** that applies its filter — clicking "Unreviewed" scopes the list. Active cell gets `--accent-muted` background and a 2px `--accent` bottom rule (Fieldwork) or a tonal filled surface (Material).
- Secondary counters (Discovered / Processing / Failed / Hidden) move into a `…` popover anchored to the strip's right edge. Failed count renders in `--state-rejected` when > 0 and is clickable → opens the Sources run log.
- Collapses to a single line at `<1024`: `27 roles · 0 high fit · 0 in motion · 25 unreviewed`, each segment still tappable.

---

## 2. Triage speed

### 2.1 Focus mode

A dedicated mode toggled from the list header (`F`) or by pressing `Enter` on a row.

Layout: single centered column, max-width 760px, showing one job at a time.

```text
  ┌──────────────────────────────────────────┐
  │  ← 12 of 25 unreviewed        ▓▓▓▓▓░░░░  │   progress
  ├──────────────────────────────────────────┤
  │  Senior Fullstack Developer (Python+AI)  │   28px title
  │  Intellectsoft · dou · Aug 18 · remote   │   meta line
  │  ScoreMeter  0/100   [why?]              │
  ├──────────────────────────────────────────┤
  │  full description, scrollable            │
  ├──────────────────────────────────────────┤
  │  [Save S] [Applied A] [Reject X] [Hide H]│   sticky action bar
  └──────────────────────────────────────────┘
```

- Actions advance to the next job automatically. Undo (`U`) rewinds one step and restores the previous stage.
- `[why?]` expands the score breakdown inline (matched skills, must-haves, stop-words hit, salary/location deltas).
- Exiting focus mode returns the list scrolled to the last-touched job, with it flashed via `--accent-muted` for 600ms.

### 2.2 Key map (shared by list, focus mode, and board)

| Key          | Action                                                       |
| ------------ | ------------------------------------------------------------ |
| `J` / `↓`    | next job                                                     |
| `K` / `↑`    | previous job                                                 |
| `Enter`      | open focus mode / open detail pane                           |
| `Esc`        | close pane, exit focus mode, clear selection (in that order) |
| `S`          | stage → Saved                                                |
| `A`          | stage → Applied                                              |
| `I`          | stage → Interview                                            |
| `O`          | stage → Offer                                                |
| `X`          | stage → Rejected                                             |
| `H`          | hide                                                         |
| `U`          | undo last stage change                                       |
| `Space`      | toggle row selection                                         |
| `Shift+↑/↓`  | extend selection                                             |
| `Cmd/Ctrl+A` | select all in view                                           |
| `/`          | focus search                                                 |
| `F`          | toggle focus mode                                            |
| `D`          | toggle detail pane                                           |
| `?`          | shortcut sheet                                               |

Rules: shortcuts are suspended while an input, textarea, or contenteditable has focus. Every shortcut has a visible affordance (button tooltip shows the key). The shortcut sheet is a centered dialog grouped by Navigate / Triage / View.

### 2.3 Bulk actions

- Selection state shows a **BulkActionBar** docked to the bottom of the list surface (not a modal), 56px tall, with `--elevation-2` in Material / a strong top hairline in Fieldwork.
- Contents: `N selected`, `Clear`, then Stage ▾, Tag ▾, Hide, Delete.
- **No confirm dialogs.** Every destructive action is optimistic and produces one undo toast (`Moved 12 jobs to Rejected · Undo`), 8s timeout, `Cmd+Z` also undoes while the toast lives.
- Deletes are soft for the toast window, then committed.

### 2.4 Default queue

- Default view on load is **Unreviewed**, sorted by Posted desc.
- A persistent pill next to the title: `25 left` → decrements live. On reaching 0, the list shows an empty state: "Queue clear · 27 roles reviewed today" with a link to the Board.

---

## 3. List + detail pane

### 3.1 List

- Virtualized (windowed) rows; row height 44px compact / 56px comfortable.
- Row anatomy:

```text
[ ☐ ] [ScoreMeter] [Title            ] [Source] [Salary] [Tags] [Posted] [Stage] [⋯]
                   [Company, 12px    ]
```

- Title is 14px `--text-primary` 500; company 12px `--text-secondary`. Both truncate with a title attribute fallback.
- Hover reveals `⋯` row actions (Open source ↗, Copy link, Hide, Delete). Delete is no longer a permanently visible column — it currently invites misclicks.
- Selected row: `--accent-muted` fill + 2px `--accent` left rule. Keyboard-focused row: 2px `--ring` inset outline, distinct from selection.
- Zebra striping: **off**. Row separation is a 1px `--border-subtle` bottom rule (Fieldwork) or 12px gap between elevated cards (Material list variant).

### 3.2 ScoreMeter

Replaces the bare `0`:

- 32px track, 4px tall, `--surface-sunken` background, fill width = score%, plus the numeric value at 12px mono.
- Fill color by band: `0` → `--text-secondary` (renders as an empty track, so "unscored" reads as unscored, not as "bad"); `1–39` → `--state-rejected`; `40–69` → `--accent-muted`; `70–100` → `--accent`.
- Unscored jobs show a dashed track and the label `—`, not `0`. This is the single biggest scannability fix in the current table.

### 3.3 Stage badge

One component, five tokens: `--state-saved`, `--state-applied`, `--state-interview`, `--state-offer`, `--state-rejected`, plus a neutral `No reaction`.

- Fieldwork: 2px radius, 1px border in the state color, transparent fill, 11px uppercase mono label.
- Material: full-pill radius, tonal fill (state color at 12% over surface), no border, 12px sans label.
- The badge is a menu trigger — clicking it opens the stage picker inline. No navigation needed to move a job.

### 3.4 Detail pane

Opens on row click, `Enter`, or `D`. Never navigates away from the list.

Sections, in order:

1. **Header** — title, company, source chip with link ↗, posted date, salary, remote flag.
2. **Actions** — stage segmented control, tag input, hide, delete.
3. **Score breakdown** — meter, matched skills, missing must-haves, stop-words triggered, each as chips.
4. **Description** — rendered markdown, collapsed to 400px with "Show full".
5. **Cover letter** — draft state, generate/regenerate, copy.
6. **Meta** — source run id, discovered at, raw payload behind a disclosure.

Behavior:

- Pane content swaps without remount when navigating rows with `J/K`; scroll position resets, header does not flicker.
- Resizable via a 4px drag handle; width persisted, clamped 420–640px.
- `≥1280`: docked pane. `1024–1279`: docked but auto-collapses the context column. `768–1023`: right slide-over sheet with scrim. `<768`: full-screen drawer with a back affordance.

### 3.5 Columns

- Column picker (existing "Columns" button) becomes a popover with drag-to-reorder, visibility toggles, and a Reset.
- `Job` and the row-action cell are pinned and cannot be hidden.
- Widths are user-resizable and persisted per user. Available columns: Score, Job, Company, Source, Salary, Tags, Posted, Discovered, Stage, Remote, Location.

---

## 4. Filters

### 4.1 Chip model

The current inline bar (search + Source ▾ + Stage ▾ + Tags + Min score slider + Remote only + Today/3d/7d/30d + More filters) is too dense to scan and too wide to keep below 1280px.

Replacement:

```text
[🔍 Search jobs…                     ]  [Filters 3 ▾]  [Sort: Posted ↓]  [Density]
[ source: dou ×] [ posted: 7d ×] [ remote ×] [ +2 ]            [Clear all]
```

- Line 1 is always visible. Line 2 renders only when filters are active, and collapses overflow into `+N` (popover lists the rest).
- Every chip is removable and clickable to edit in place.
- `Clear all` appears only with ≥2 active filters.

### 4.2 Advanced panel

`Filters ▾` opens a slide-over (right, 360px) containing, in order: Source (multi-select with counts), Stage, Tags (typeahead), Score range (dual slider, with an "include unscored" checkbox), Posted window (Today / 3d / 7d / 30d / custom range), Remote / Hybrid / Office, Salary min, Hidden (show/hide).

- Changes apply live to the list behind the scrim; no Apply button.
- Footer: `Reset` and `Save as view`.

### 4.3 Saved views

Tabs above the list, left-aligned:

```text
[ Unreviewed 25 ] [ High fit ] [ Remote only ] [ In motion 1 ] [ + ]
```

- Ships with system views: Unreviewed, High fit (≥70), In motion, Rejected, Hidden.
- User views are created from the filter panel, renameable, reorderable, deletable, persisted per user.
- The active view name appears in the URL (`?view=unreviewed`) so views are linkable and survive reload; ad-hoc filters serialize to query params too.

---

## 5. Adaptivity

| Breakpoint  | Rail nav  | Context column     | List                 | Detail             | Filters          |
| ----------- | --------- | ------------------ | -------------------- | ------------------ | ---------------- |
| `≥1440`     | expanded  | visible            | table                | docked             | chip bar + panel |
| `1024–1439` | icon rail | collapsed (toggle) | table                | docked             | chip bar + panel |
| `768–1023`  | icon rail | drawer             | table, fewer columns | slide-over sheet   | `Filters ▾` only |
| `<768`      | drawer    | drawer             | card list            | full-screen drawer | `Filters ▾` only |

Rules:

- **Never horizontal-scroll the table.** Below `768` rows become stacked cards:

```text
┌──────────────────────────────────────────┐
│ Senior Fullstack Developer (Python+AI)   │
│ Intellectsoft · dou                      │
│ ▓▓░░░ 42   remote   Aug 18   [No reaction]│
└──────────────────────────────────────────┘
```

- Mobile gets a bottom action bar in focus mode with thumb-reachable Save / Applied / Reject, min 44×44 touch targets (48×48 in Material).
- Density toggle (compact ↔ comfortable) writes only `--density-row`, `--density-cell`, `--density-font`. No component branches on density in JS.
- All interactive elements keep a visible `--ring` focus style; the pane, sheet, and drawer trap focus and restore it on close.
- Respect `prefers-reduced-motion`: disable pane slide, row flash, and DnD spring; keep instant state changes.

---

## 6. Board drag-and-drop performance

The current board is slow because drag moves reflow columns per pointer event. Fix in four parts.

### 6.1 Transform-based DnD

- Use `@dnd-kit/core` + `@dnd-kit/sortable`.
- Only the dragged card moves, via `transform: translate3d(x, y, 0)` on a `DragOverlay` portal. The source card stays in place at 40% opacity — no list reordering during the drag.
- The dragged overlay gets `will-change: transform` on lift, removed on drop.
- Columns render a single 2px `--accent` insertion rule as the drop indicator instead of animating gaps between every card.

### 6.2 Cached geometry

- Collision detection uses `closestCenter` against a rect map built **once on drag start** (`measuring: { droppable: { strategy: MeasuringStrategy.WhileDragging }}` with manual invalidation on column scroll/resize only).
- No `getBoundingClientRect` in the pointer-move path.
- Column scroll during drag uses `dnd-kit`'s auto-scroll with a 120px threshold, and re-measures that column only.

### 6.3 Virtualization

- Columns with >50 cards virtualize their card list (`@tanstack/react-virtual`), overscan 6. Droppable registration is limited to rendered cards plus a column-level fallback target, so a drop onto a virtualized region lands at the column tail.

### 6.4 Optimistic moves

- On drop: update the local cache immediately, fire the mutation, roll back and toast on failure. Zero network work inside the drag gesture.
- Debounce nothing; the drag is already committed by the time the request goes out.

### 6.5 Keyboard DnD

- `Space` lifts the focused card, `←/→` move between columns, `↑/↓` reorder within a column, `Space` drops, `Esc` cancels.
- A live region announces `Moved Middle+/Senior Full-Stack Engineer to Applied, position 1 of 3`.

### 6.6 Column presentation

- Empty columns collapse to a 56px vertical strip showing the rotated stage name and count; they expand on hover during a drag and on click otherwise. This removes the five identical "No jobs in this stage" panels.
- Column header: stage badge, count, WIP limit (`WIP 6`) rendering in `--state-rejected` when exceeded, and a `⋯` menu (collapse, clear, sort).

---

## 7. Token system

One semantic set, two value maps. Theme switches on a single attribute: `<html data-theme="fieldwork">` / `data-theme="material"`. Dark mode is orthogonal: `data-mode="dark"`.

**No component may hardcode a color, radius, shadow, or font family.**

### 7.1 Semantic tokens

```text
surface            surface-raised     surface-sunken     surface-overlay
border-subtle      border-strong      ring
text-primary       text-secondary     text-mono          text-inverse
accent             accent-fg          accent-muted       accent-hover
state-saved        state-applied      state-interview    state-offer   state-rejected
state-*-fg         state-*-muted
radius-sm          radius-md          radius-lg          radius-pill
elevation-0        elevation-1        elevation-2
density-row        density-cell       density-font
font-ui            font-mono          motion-fast        motion-base
```

### 7.2 Values

```css
:root[data-theme='fieldwork'] {
  --surface: oklch(0.99 0.004 150);
  --surface-raised: oklch(1 0 0);
  --surface-sunken: oklch(0.96 0.006 150);
  --surface-overlay: oklch(1 0 0);

  --border-subtle: oklch(0.9 0.008 150);
  --border-strong: oklch(0.78 0.012 150);
  --ring: oklch(0.45 0.1 158);

  --text-primary: oklch(0.2 0.02 155);
  --text-secondary: oklch(0.52 0.02 155);
  --text-mono: oklch(0.3 0.03 155);
  --text-inverse: oklch(0.98 0.004 150);

  --accent: oklch(0.45 0.1 158);
  --accent-fg: oklch(0.98 0.004 150);
  --accent-muted: oklch(0.94 0.03 158);
  --accent-hover: oklch(0.4 0.11 158);

  --state-saved: oklch(0.55 0.08 200);
  --state-applied: oklch(0.55 0.12 250);
  --state-interview: oklch(0.55 0.14 300);
  --state-offer: oklch(0.55 0.12 158);
  --state-rejected: oklch(0.58 0.17 25);

  --radius-sm: 2px;
  --radius-md: 3px;
  --radius-lg: 4px;
  --radius-pill: 4px;

  --elevation-0: none;
  --elevation-1: 0 0 0 1px var(--border-subtle);
  --elevation-2: 0 0 0 1px var(--border-strong);

  --font-ui: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;

  --motion-fast: 90ms;
  --motion-base: 140ms;
}

:root[data-theme='material'] {
  --surface: oklch(0.98 0.006 150);
  --surface-raised: oklch(1 0 0);
  --surface-sunken: oklch(0.95 0.008 150);
  --surface-overlay: oklch(1 0 0);

  --border-subtle: transparent;
  --border-strong: oklch(0.88 0.01 150);
  --ring: oklch(0.5 0.12 158);

  --text-primary: oklch(0.22 0.015 155);
  --text-secondary: oklch(0.5 0.015 155);
  --text-mono: oklch(0.22 0.015 155);
  --text-inverse: oklch(1 0 0);

  --accent: oklch(0.5 0.12 158);
  --accent-fg: oklch(1 0 0);
  --accent-muted: oklch(0.93 0.04 158);
  --accent-hover: oklch(0.45 0.13 158);

  --state-saved: oklch(0.58 0.09 200);
  --state-applied: oklch(0.58 0.13 250);
  --state-interview: oklch(0.58 0.15 300);
  --state-offer: oklch(0.58 0.13 158);
  --state-rejected: oklch(0.6 0.18 25);

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-pill: 999px;

  --elevation-0: none;
  --elevation-1: 0 1px 2px oklch(0 0 0 / 0.08), 0 1px 3px oklch(0 0 0 / 0.06);
  --elevation-2: 0 4px 8px oklch(0 0 0 / 0.1), 0 2px 4px oklch(0 0 0 / 0.06);

  --font-ui: 'Roboto Flex', 'Inter', system-ui, sans-serif;
  --font-mono: 'Roboto Mono', ui-monospace, monospace;

  --motion-fast: 120ms;
  --motion-base: 200ms;
}

/* density is theme-independent */
:root[data-density='compact'] {
  --density-row: 44px;
  --density-cell: 8px 12px;
  --density-font: 13px;
}
:root[data-density='comfortable'] {
  --density-row: 56px;
  --density-cell: 12px 16px;
  --density-font: 14px;
}
```

Dark mode overrides sit in `:root[data-mode="dark"][data-theme="…"]` and change only `surface*`, `border*`, `text*`, and the `-muted` variants.

### 7.3 Theme character

|              | Fieldwork                        | Material                                       |
| ------------ | -------------------------------- | ---------------------------------------------- |
| Corners      | 2–4px, near-square               | 8–16px, pill chips                             |
| Separation   | hairline borders                 | elevation shadows, borders absent              |
| Numerics     | mono everywhere                  | mono only in code/slug fields                  |
| Labels       | uppercase, tracked, 11px         | sentence case, 12px                            |
| Chips        | outlined                         | tonal filled                                   |
| Buttons      | flat fill, 1px border, no shadow | filled/tonal/text tiers, elevation-1 on filled |
| Pressed      | 1px inset shift                  | ripple from pointer origin, 200ms              |
| Touch target | 32px min                         | 48px min                                       |
| Motion       | 90–140ms, linear-ish             | 120–200ms, emphasized-decelerate               |

### 7.4 Migration rule

Sweep every component for literal `#hex`, `rgb()`, `border-radius`, `box-shadow`, and font-family declarations. Each becomes a token reference. A component is "done" when toggling `data-theme` visibly rethemes it with zero JS.

---

## 8. Component inventory

Each entry: purpose · anatomy · states · tokens · keyboard · responsive.

### StatStrip

4 filter-buttons + overflow popover. States: default, active, hover, focus. Tokens: `surface-raised`, `border-subtle`, `accent-muted`, `text-secondary`, `radius-md`. Keyboard: tab-stop each, `Enter`/`Space` applies. Responsive: 4-up → single summary line <1024.

### FilterChipBar

Removable chips + `+N` overflow + `Clear all`. States: default, hover, focus, removing. Tokens: `accent-muted`, `border-subtle`, `radius-pill`, `text-primary`. Keyboard: `Backspace` on focused chip removes it, arrows move between chips. Responsive: single-line with overflow at every size.

### SavedViewTabs

System + user views, `+` to create. States: active, hover, drag-reordering, editing name. Tokens: `accent`, `border-strong`, `radius-sm`. Keyboard: `←/→` between tabs, `Enter` selects. Responsive: horizontally scrollable with edge fades <1024.

### JobRow

Checkbox, ScoreMeter, title/company, source, salary, tags, posted, StageBadge, `⋯`. States: default, hover, selected, keyboard-focused, updating (skeleton shimmer on the changed cell only), hidden (40% opacity). Tokens: `density-row`, `density-cell`, `border-subtle`, `accent-muted`, `ring`. Keyboard: full key map §2.2. Responsive: → JobCard <768.

### JobCard

Mobile row. Title, company, meter, meta line, StageBadge. Swipe left → Reject, swipe right → Save, with a color-tinted reveal. Tokens: `surface-raised`, `elevation-1`, `radius-lg`.

### ScoreMeter

Track + fill + numeric. States: unscored (dashed track, `—`), low, mid, high. Tokens: `surface-sunken`, `accent`, `state-rejected`, `text-mono`. Not interactive; `aria-label="Score 42 of 100"`.

### StageBadge

Label + menu trigger. States: each stage, neutral, open, disabled. Tokens: `state-*`, `state-*-muted`, `radius-pill`/`radius-sm`. Keyboard: `Enter` opens, arrows navigate, `Esc` closes.

### DetailPane

Six sections §3.4. States: empty (no selection), loading (skeleton), loaded, error (retry). Tokens: `surface-raised`, `elevation-1`, `border-subtle`. Keyboard: `Esc` closes, `Tab` cycles within when modal. Responsive: docked → sheet → drawer.

### FocusCard

One job, full description, sticky action bar, progress meter. States: loading, loaded, last-in-queue, queue-empty. Tokens: `surface-raised`, `accent`, `radius-lg`, `elevation-1`.

### BulkActionBar

Count, clear, stage, tag, hide, delete. States: hidden, visible, acting. Tokens: `surface-overlay`, `elevation-2`, `border-strong`. Enters with a 120ms slide-up; respects reduced motion.

### BoardColumn

Header (badge, count, WIP, `⋯`) + virtualized card list + insertion indicator + collapsed strip. States: default, drag-over, collapsed, over-WIP, empty. Tokens: `surface-sunken`, `accent`, `state-rejected`, `radius-lg`.

### BoardCard

Title, company, score, source, age, `⋯`. States: default, hover, lifted (in overlay), source-ghost (40% opacity), stale (>14 days → amber left rule). Tokens: `surface-raised`, `elevation-1`→`elevation-2` on lift, `radius-md`.

### ShortcutSheet

Dialog, three groups (Navigate / Triage / View), `kbd` styling from `font-mono` + `border-strong`. Opens on `?`, closes on `Esc`.

---

## 9. Implementation order

1. Tokens + theme attribute switch (unblocks everything; no visual change expected on Fieldwork if values are transcribed correctly).
2. ScoreMeter, StageBadge, JobRow — biggest scannability win, lowest risk.
3. DetailPane + list/detail split.
4. Key map + focus mode + BulkActionBar.
5. FilterChipBar + advanced panel + SavedViewTabs.
6. Responsive pass: JobCard, sheets, drawer, density toggle.
7. Board DnD swap to `@dnd-kit` + virtualization + optimistic moves.

Steps 1–6 are pure presentation. Step 7 is the only one that changes a dependency and a mutation path — accept or reject it independently.

## 10. Out of scope

- Data model, API, and scoring logic are untouched.
- Sources / Dictionaries / Profile / LLM Settings keep their current layouts; they inherit the token work from step 1 and can get a second-pass redesign later.
