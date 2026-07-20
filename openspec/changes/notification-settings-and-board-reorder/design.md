# Design — notification settings + board card reordering

## Context

Two independent features share one change because both add persistence +
API + UI in the same three layers, and both touch the `/profile` and
`/board` surfaces that Phase 5 left feature-complete but static.

Current state established by reading the code, not assumed:

- **Notifications**: `.env.example:45-50` defines `TELEGRAM_BOT_TOKEN`,
  `TELEGRAM_CHAT_ID`, `SMTP_HOST/PORT/USER/PASSWORD`. These are consumed
  **only** by credentials created by hand in the n8n UI
  (`n8n/README.md:51-64`); the workflow JSON references them by credential
  name. The application itself never sees them. `core.app_settings`
  (generic `key text PK` / `value jsonb`) is read in exactly one place —
  `postgres-automation.repository.ts:167,204,248` for `match_threshold`
  and `last_digest_at`. Its seeded `notifications` and `digest_hour` keys
  are read by nothing. No gateway route exposes `app_settings` at all.
- **Board**: `stage-board.tsx` already implements complete cross-column
  drag and drop — `useDraggable` cards, `useDroppable` columns, pointer +
  keyboard sensors, optimistic move with rollback, undo toast, `aria-live`
  announcements. What is missing is _within_-column ordering: columns are
  ordered by the jobs API default (`last_seen_at DESC`), and
  `handleDragEnd` explicitly cancels when `fromStage === toStage`
  (`stage-board.tsx:190-193`).

Constraint that shapes the whole notification half: this repo's security
rules forbid secrets in source or database, and `core.llm_providers`
already established the house pattern — an `api_key_env` column naming the
environment variable rather than holding the key.

## Goals / Non-Goals

**Goals:**

- Make notification configuration visible and editable in the product,
  persisted in Postgres, without any secret entering the database, an API
  response, or a log line.
- Make the n8n workflows actually honor those edits at run time.
- Let a user express priority order inside a board column and have it
  survive reload.
- Preserve the existing cross-column drag behavior exactly — this is
  working, shipped functionality, and the change must not regress it.

**Non-Goals:**

- Moving notification _sending_ out of n8n into the gateway. The Phase 6
  split (n8n orchestrates and sends; the gateway owns data) stays intact.
- Storing or transporting the bot token / SMTP password.
- Multi-profile board ordering semantics beyond "positions are per
  profile" — there is one active profile in practice.
- Reordering the `/jobs` table. Board ordering is a board concept only.
- Cross-column _drop-index_ precision in the keyboard flow beyond what
  `@dnd-kit/sortable`'s keyboard coordinate getter provides for free.

## Decisions

### D1 — Secrets stay in the environment; the DB stores the variable name

`core.notification_settings` gets `bot_token_env` and `smtp_password_env`
columns holding **names** (defaulting to `TELEGRAM_BOT_TOKEN` /
`SMTP_PASSWORD`). The gateway resolves them only to compute a boolean
"is this variable currently populated" and never returns the value.

_Alternatives considered._ Storing the secrets themselves would make the
UI self-sufficient (no shell access to rotate a token) but puts plaintext
credentials in Postgres, in every API response, and in any DB backup —
directly against the repo's security rules and inconsistent with
`llm_providers.api_key_env`, which solved this identical problem already.
Storing nothing about secrets at all was also rejected: the UI then cannot
tell the user _why_ a channel silently does nothing.

### D2 — A typed singleton table, not another `app_settings` key

Channel configuration goes in a new `core.notification_settings` table
with one row pinned by `CHECK (id = 1)`, giving real columns, a port-range
constraint, and a `NOT NULL` discipline that a jsonb blob cannot express.

`match_threshold` and `digest_hour` **stay** in `core.app_settings`.
Moving `match_threshold` would mean editing the working raw-SQL subquery
at `postgres-automation.repository.ts:167` for no behavioral gain. The
settings API composes both sources into one DTO so the UI sees a single
coherent form; only the storage is split, and the split is invisible
above the repository.

The seeded-but-dead `app_settings` key `notifications` is **deleted** by
the migration. Leaving it would create a second, authoritative-looking
source of truth for the same concept — exactly the kind of trap that
costs an hour later.

### D3 — Integer positions rewritten in full, not fractional indexing

`PUT /v1/board/order` takes `{ profileId, stage, jobIds: string[] }` and
rewrites `position = 0..n-1` for exactly those ids inside one transaction.

_Alternatives considered._ Fractional (float midpoint) indexing avoids
touching siblings on each move, but exhausts double precision after ~50
consecutive inserts at the same gap and then needs a renormalization pass
anyway — real complexity for a board whose columns the client already
caps at 200 cards (`stage-board.tsx:53`). A prev/next linked list is
robust but makes "give me this column in order" a recursive CTE. Rewriting
≤200 narrow rows is trivial for Postgres and has a valuable property: it
is idempotent and self-healing, so a client posting a stale list simply
renormalizes rather than corrupting order.

### D4 — Ordering surfaces through the existing sort allowlist

`GET /v1/jobs` gains `sortBy=board`, added to the `SORT_EXPRESSIONS`
allowlist in `postgres-job.repository.ts:25-30` and backed by a
`LEFT JOIN core.job_board_position bp ON bp.job_id = j.id AND
bp.profile_id = p.id` — reusing the active-profile join the query already
performs at lines 200/217. `buildOrderBy` already emits `NULLS LAST`, so
never-positioned cards fall to the bottom with no special casing.

_Alternative considered._ A separate `GET /v1/board/order` returning just
the id sequence, merged client-side. Rejected: two round trips per column,
client-side sort logic duplicating what the server already does well, and
a divergence from the server-driven sorting the jobs table is built on.
The allowlist extension is four lines and inherits the injection-safe
pattern that comment at line 20-24 exists to protect.

### D5 — `stage` on the position row is advisory, never authoritative

The position table is keyed `(profile_id, job_id)` — one position per job
per profile, matching `job_reaction_current`'s `DISTINCT ON (job_id,
profile_id)` guarantee that a job has exactly one current stage. It also
carries a denormalized `stage` column, written on every reorder.

That column is **never read for correctness.** Which column a card renders
in is decided solely by the reaction filter (`?reaction=applied`), whose
source of truth is the append-only reaction log. So if `stage` drifts —
because a card moved via the jobs-table bulk action without a reorder — a
stale value cannot misplace the card; at worst its position is a leftover
number, and `NULLS LAST` plus the `j.id DESC` tie-break keeps the result
deterministic. The column earns its place by making the table
self-describing when debugging, at zero correctness risk.

### D6 — Configuration reaches n8n by fetch, not by redeploy

`GET /v1/automation/settings` joins the existing internal-token surface
(`@SkipThrottle()`, `InternalTokenGuard`) and returns the effective
config. `telegram-notifications.json` and `email-digest.json` gain a
leading HTTP node plus an IF gate on the channel's `enabled` flag, and
read `chatId` / `toEmail` from that response instead of from static
workflow parameters. Credentials — the token and password — continue to
come from n8n's own credential store, untouched.

This is what makes the feature real rather than decorative: without it,
the Profile page would edit a database nothing consults.

### D7 — Env-presence is a computed field, not a test endpoint

`GET /v1/settings/notifications` returns `telegram.botTokenConfigured` and
`email.smtpPasswordConfigured` as computed booleans. This refines the
proposal's "test action" wording: a dedicated `POST .../test` endpoint
would do nothing but re-read `process.env`, so it would be ceremony around
a value the GET can always return fresh. (This is unlike the LLM
provider Test button, which performs a real network call to a provider and
therefore genuinely needs its own endpoint.)

### D8 — Migrate the board to `@dnd-kit/sortable` rather than hand-rolling indices

Columns become `SortableContext` with `verticalListSortingStrategy`; cards
move from `useDraggable` to `useSortable`. This is the library's supported
path for exactly this pattern and brings the keyboard coordinate getter,
drop animation, and `arrayMove` helper. The existing `DndContext`,
sensors, `DragOverlay`, optimistic mutation and undo toast all stay.

`handleDragEnd` gains a same-stage branch (currently an early cancel at
`stage-board.tsx:190-193`) that computes the new index via `arrayMove` and
calls the order mutation; the cross-stage branch keeps calling
`addReaction` unchanged, and additionally persists the destination order.

## Risks / Trade-offs

- **Regressing working drag-and-drop.** The cross-column flow is shipped
  and currently has no e2e coverage of the drag itself. → Add a Playwright
  case covering both a cross-column drag and a within-column reorder
  before touching `stage-board.tsx`, so the refactor is guarded rather
  than eyeballed.
- **n8n workflow edits cannot be fully validated here.** Phase 6 validated
  workflow JSON with a real `n8n import:workflow` against a running
  instance; no Telegram/SMTP credentials exist on any instance yet
  (`docs/DEPLOYMENT.md:442`). → Keep the JSON edits minimal and
  schema-validated, and state plainly in the task notes that live send
  verification remains an operator step.
- **Two writes for one cross-column drag** (reaction event + order
  rewrite). A failure between them leaves a correct stage with stale
  ordering. → Acceptable: order is cosmetic and self-heals on the next
  reorder; the reaction write stays the one that must succeed, and the
  existing rollback/undo covers it. Explicitly _not_ worth a distributed
  transaction.
- **Env-var names are visible in the API.** A reader learns that
  `SMTP_PASSWORD` exists. → Accepted; this is the same exposure
  `llm_providers.api_key_env` already carries, and it is strictly less
  than exposing the value.
- **`digest_hour` becomes editable but n8n's cron is static.** Changing
  the hour in the UI will not move the n8n schedule trigger. → Document it
  as a known limitation in the settings UI copy and `n8n/README.md`;
  making cron dynamic is a separate change.

## Migration Plan

One dbmate migration, `0008_notification_settings_and_board_order.sql`:

- **up**: create `core.notification_settings` (+ seed the single row from
  the current `.env` defaults, all channels disabled), create
  `core.job_board_position` with its index, delete the dead
  `app_settings` key `notifications`.
- **down**: drop both tables, restore the `notifications` key.

Deployment is forward-only in practice (single-operator app). Existing
data is untouched: no column is altered, and board columns simply render
in their current default order until the first reorder writes a position.

## Open Questions

None blocking. Two decisions were taken with the user before writing this:
secrets use the env-var-reference pattern (D1), and n8n consumes settings
through a gateway endpoint (D6).
