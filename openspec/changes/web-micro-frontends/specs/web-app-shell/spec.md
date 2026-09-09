## ADDED Requirements

### Requirement: Shell hosts multi-zone remotes

The dashboard shell SHALL run as `apps/web-shell` and compose domain remotes for Jobs, Board, and Settings via multi-zones / path rewrites on a single public origin. In-process App Router pages inside the shell MUST NOT remain the long-term owners of those domain routes after cutover.

#### Scenario: Sidebar navigation reaches composed remotes

- **WHEN** the user clicks a sidebar entry for Jobs, Board, Sources, Dicts, Profile, or Settings
- **THEN** the corresponding locale-prefixed route renders inside the shell chrome and is served by the owning remote through multi-zone composition

#### Scenario: Shell retains chrome across domain navigations

- **WHEN** the user navigates between Jobs and Board through the sidebar
- **THEN** sidebar and topbar chrome remain provided by the shell host while page content switches to the owning remote

## MODIFIED Requirements

### Requirement: Typed API access layer

All communication with the backend SHALL go through a typed client layer in `packages/web-api`, built on the `packages/shared-ts` generated types (`ApiPaths`/`ApiOperations`). Components in the shell and remotes MUST NOT issue raw `fetch` calls to the API or any third party. Job ids SHALL be treated as opaque strings end-to-end (bigint-safe), never parsed to `number`. Shared React Query keys for dashboard domains SHALL live in `packages/web-api` so remotes invalidate the same cache identities.

#### Scenario: API error surfaces meaningfully

- **WHEN** the API returns a non-2xx response for a page's initial data
- **THEN** the route's error boundary renders a localized message with a retry action instead of a blank or crashed page

#### Scenario: Loading uses layout-matching skeletons

- **WHEN** a route's data is still loading
- **THEN** skeletons matching the real layout render (no spinners inside content areas, no layout shift on completion)

#### Scenario: Remotes share query key identities

- **WHEN** a mutation in one remote invalidates jobs list queries
- **THEN** other mounted consumers using `packages/web-api` query keys observe the same cache identity and refresh consistently
