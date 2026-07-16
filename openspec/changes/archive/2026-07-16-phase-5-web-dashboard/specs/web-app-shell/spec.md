# web-app-shell

## ADDED Requirements

### Requirement: Dashboard layout with sidebar and topbar

The web app SHALL render every dashboard page inside a shared shell: a left sidebar with navigation entries (Jobs, Board, Sources, Dicts, Profile, Settings) and a topbar with the page title, global search trigger (⌘K), locale switch and theme toggle. The sidebar SHALL be 232px expanded and collapse to a 56px icon rail (icons with tooltips) at viewports below 1280px.

#### Scenario: Navigating between sections

- **WHEN** the user clicks a sidebar entry (e.g. Board)
- **THEN** the corresponding route renders inside the shell and the active entry is visually highlighted using the accent token

#### Scenario: Sidebar collapses on narrow viewport

- **WHEN** the viewport width drops below 1280px
- **THEN** the sidebar renders as a 56px icon rail and each icon button exposes a tooltip and `aria-label`

### Requirement: Design tokens and theme switching

The app SHALL define all colors from UI_DESIGN §2.1 as CSS variables on `:root` (light) and `.dark` (dark) consumed through Tailwind theme tokens. Components MUST NOT hardcode hex colors or use `dark:` overrides for tokenized colors. The user SHALL be able to switch between light, dark and system themes via a three-state toggle; the choice persists across reloads and system theme is the default.

#### Scenario: Switching to dark theme

- **WHEN** the user selects "dark" in the theme toggle
- **THEN** the `dark` class is applied to the document, all surfaces re-render with dark tokens without a flash of wrong theme, and the choice survives a page reload

#### Scenario: System theme follows OS

- **WHEN** the theme is set to "system" and the OS switches from light to dark
- **THEN** the app follows without a reload

### Requirement: EN and UA localization

The app SHALL support `en` and `uk` locales via next-intl: locale negotiated from `Accept-Language` on first visit, switchable in the topbar, persisted in a cookie. All UI chrome (labels, buttons, table headers, empty states, tooltips) SHALL be translated; LLM-generated content and scraped job data SHALL NOT be machine-translated. Dates, numbers and salaries SHALL be formatted with the active locale.

#### Scenario: Switching locale

- **WHEN** the user switches the locale from EN to UA in the topbar
- **THEN** all UI chrome re-renders in Ukrainian, the URL locale segment updates, and the preference persists across reloads

#### Scenario: Longer UA strings do not break layout

- **WHEN** the UA locale is active
- **THEN** buttons, labels and table headers accommodate the longer strings without overflow; table cells truncate with a tooltip

### Requirement: Global command palette

The topbar search SHALL open a command palette (⌘K / Ctrl+K) offering navigation to every section and a "search jobs" action that routes to `/jobs` with the entered text as the full-text query.

#### Scenario: Searching jobs from the palette

- **WHEN** the user presses ⌘K, types "react", and picks "Search jobs"
- **THEN** the app navigates to the jobs dashboard with the full-text filter set to "react"

### Requirement: Accessibility and motion baselines

Both themes SHALL pass WCAG AA contrast (4.5:1 body, 3:1 large/UI) including score and stage badges. Every interactive element SHALL be keyboard reachable with a visible `:focus-visible` ring (2px accent, 2px offset). Icon-only buttons SHALL have tooltips and `aria-label`s in both locales. Animations SHALL stay within the UI_DESIGN §7 budget and collapse to opacity-or-none under `prefers-reduced-motion`.

#### Scenario: Keyboard-only traversal

- **WHEN** a user tabs through the shell without a pointer
- **THEN** sidebar, topbar controls and page content are reachable in a logical order with a visible focus ring

#### Scenario: Reduced motion honored

- **WHEN** the OS reports `prefers-reduced-motion: reduce`
- **THEN** drawer slides and hover transitions are replaced with opacity changes or removed

### Requirement: Typed API access layer

All communication with the backend SHALL go through a typed client layer built on the `packages/shared-ts` generated types (`ApiPaths`/`ApiOperations`). Components MUST NOT issue raw `fetch` calls to the API or any third party. Job ids SHALL be treated as opaque strings end-to-end (bigint-safe), never parsed to `number`.

#### Scenario: API error surfaces meaningfully

- **WHEN** the API returns a non-2xx response for a page's initial data
- **THEN** the route's error boundary renders a localized message with a retry action instead of a blank or crashed page

#### Scenario: Loading uses layout-matching skeletons

- **WHEN** a route's data is still loading
- **THEN** skeletons matching the real layout render (no spinners inside content areas, no layout shift on completion)
