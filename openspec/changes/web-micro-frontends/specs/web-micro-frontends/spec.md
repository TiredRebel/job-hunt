## Purpose

Defines how the job-hunter web UI is split into a host shell and independently deployable domain remotes composed via path-based multi-zones, with shared UI/API packages and stable locale-prefixed public routes.

## ADDED Requirements

### Requirement: Multi-zones composition only

The web frontend SHALL be composed as a host application plus independently deployable domain remotes using Next.js multi-zones (or equivalent path rewrites/proxies that preserve a single public origin). The system MUST NOT use Module Federation to load remotes. The system MUST NOT embed remotes in iframes.

#### Scenario: Forbidden composition models rejected

- **WHEN** an implementation proposes Module Federation remotes or iframe-embedded remotes for dashboard domains
- **THEN** that composition is out of contract for this capability and MUST NOT ship

#### Scenario: Path-based composition serves one origin

- **WHEN** a user opens a dashboard URL under the shell origin with a locale prefix
- **THEN** the shell hosts chrome and the matching domain remote serves the page content for that path without changing the public origin

### Requirement: Application ownership map

The repository SHALL own four web apps with these responsibilities:

- `apps/web-shell` — locale routing, dashboard shell chrome (sidebar/topbar), theme, i18n host, multi-zone proxy/rewrites
- `apps/web-jobs` — jobs list, job detail, and dead-letter routes under `/jobs`
- `apps/web-board` — stage board under `/board`
- `apps/web-settings` — `/sources`, `/dictionaries`, `/profile`, and `/settings/llm`

#### Scenario: Jobs path owned by jobs remote

- **WHEN** the user navigates to `/{locale}/jobs` or `/{locale}/jobs/{id}`
- **THEN** `apps/web-jobs` owns the page implementation served through the shell composition

#### Scenario: Board path owned by board remote

- **WHEN** the user navigates to `/{locale}/board`
- **THEN** `apps/web-board` owns the page implementation served through the shell composition

#### Scenario: Settings paths owned by settings remote

- **WHEN** the user navigates to `/{locale}/sources`, `/{locale}/dictionaries`, `/{locale}/profile`, or `/{locale}/settings/llm`
- **THEN** `apps/web-settings` owns the page implementation served through the shell composition

### Requirement: Shared packages for UI and API

Shared UI primitives and the typed dashboard API client layer SHALL live in workspace packages consumed by the shell and remotes:

- `packages/web-ui` — shared UI primitives and styling helpers extracted from the former monolith UI kit
- `packages/web-api` — HTTP client modules and shared React Query keys extracted from the former monolith API layer
- `packages/shared-ts` — reused generated/shared Nest contract types; Nest API contracts remain unchanged

Domain remotes and the shell MUST import shared UI/API code from these packages rather than maintaining divergent copies as the source of truth.

#### Scenario: Remotes share one API client source of truth

- **WHEN** jobs and board remotes fetch jobs list data
- **THEN** both use `packages/web-api` (including shared query keys) and do not define a separate conflicting client as the source of truth

#### Scenario: Nest contracts unchanged

- **WHEN** the micro-frontend split ships
- **THEN** existing Nest gateway OpenAPI contracts remain compatible; this change MUST NOT require Nest endpoint redesign to enable composition

### Requirement: Locale prefix preserved

All public dashboard routes SHALL retain the `/{locale}/...` URL shape. Locale negotiation and switching behavior defined by `web-app-shell` remains authoritative; remotes MUST NOT introduce locale-less public URLs for the owned domains.

#### Scenario: Locale segment present on remote routes

- **WHEN** a user opens Jobs, Board, or a settings page via the shell
- **THEN** the browser URL includes the active locale segment before the domain path

### Requirement: Monolith cutover

After shell and remotes provide parity for owned routes, `apps/web` MUST NOT remain the primary user-facing entry. It SHALL be removed or reduced to a documented redirect/shim to `apps/web-shell`.

#### Scenario: Primary entry is the shell

- **WHEN** cutover is complete
- **THEN** documented local and deployment entry points for the dashboard target `apps/web-shell` (composing remotes), not a feature-complete monolith `apps/web`
