# Notification settings + board card reordering

## Why

Two gaps block day-to-day use of the finished app. **Notification config is
invisible to the product**: Telegram and SMTP values live only in the root
`.env` and in credentials hand-created inside the n8n UI, so changing a chat
id, a recipient, or turning a channel off means editing files and clicking
through n8n — there is no way to see or change any of it from the app, and
nothing in the database records what the intended configuration even is.
(`core.app_settings` carries a seeded `notifications` key that no code has
ever read.) **The board can't be ordered**: cards inside a column are
ordered by `last_seen_at` — the user's own sense of priority within a stage
("these three applications matter most this week") cannot be expressed or
persisted.

## What Changes

**Notification settings**

- New `core.notification_settings` single-row table holding non-secret
  channel configuration: per-channel enabled flags, Telegram chat id, SMTP
  host/port/user/from/to, and the **names** of the environment variables
  holding the bot token and SMTP password.
- Secrets are never stored in Postgres and never returned by the API.
  Following the existing `core.llm_providers.api_key_env` convention, the
  database stores an env-var _name_; the gateway reports only whether that
  variable is currently populated, so the UI can show a "configured /
  not configured" health signal without ever transporting the value.
- New public gateway endpoints `GET /v1/settings/notifications` and
  `PATCH /v1/settings/notifications` for the dashboard.
- New internal endpoint `GET /v1/automation/settings` (internal-token
  guarded, joined to the existing automation surface) returning the
  effective notification + digest configuration for n8n to consume at run
  time, so edits made in the UI actually change workflow behavior.
- The three existing `core.app_settings` scalars the automation flow already
  depends on (`match_threshold`, `digest_hour`) become editable through the
  same settings API rather than staying seed-only.
- The `/profile` page gains a "Notifications" section editing all of the
  above, with a per-channel status indicator showing whether the referenced
  env var is currently populated.
- The `telegram-notifications` and `email-digest` n8n workflows fetch
  `GET /v1/automation/settings` and honor the enabled flags, chat id, and
  recipient rather than relying purely on static credentials.

**Board reordering**

- New `core.job_board_position` table storing a manual per-`(profile, job)`
  position, scoped to the stage the card sits in.
- New `PUT /v1/board/order` endpoint accepting a stage and its full ordered
  list of job ids, rewriting positions transactionally.
- `GET /v1/jobs` gains `sortBy=board`, which orders by stored board position
  with unpositioned jobs last — an addition to the existing sort allowlist,
  reusing the active-profile join the query already performs.
- The board's columns become `SortableContext`s so a card can be dropped at
  a specific index within its own column, not only moved between columns.
  Cross-column drags continue to append a reaction event exactly as today,
  and additionally record the drop index in the destination column.

## Capabilities

### New Capabilities

- `notification-settings`: DB-backed, UI-editable notification channel
  configuration with env-var-referenced secrets, exposed to the dashboard
  and to n8n through the gateway.

### Modified Capabilities

- `stage-board`: adds manual within-column ordering that survives reloads;
  the existing cross-column drag requirement gains a drop-index component.
- `profile-editor`: the `/profile` page gains a notifications section
  alongside the matching-profile form.
- `automation-api`: the internal surface gains a settings endpoint so
  workflows read configuration from the gateway instead of static env only.

## Impact

- **Database**: two new tables (`core.notification_settings`,
  `core.job_board_position`) in one new migration; no changes to existing
  tables. `core.app_settings` gains no new keys — the existing
  `match_threshold` / `digest_hour` rows become writable.
- **Gateway (`apps/api`)**: new `settings` module (controller, service,
  repository port + Postgres adapter); `automation` module gains one
  endpoint; `reactions` module gains board-order persistence; the jobs
  repository's `SORT_EXPRESSIONS` allowlist and page query gain a `board`
  entry and a `LEFT JOIN`.
- **OpenAPI + `packages/shared-ts`**: regenerated for the new endpoints.
- **Web (`apps/web`)**: new notifications section + API client on
  `/profile`; `stage-board.tsx` / `stage-column.tsx` / `stage-card.tsx`
  migrate from `useDraggable` / `useDroppable` to
  `@dnd-kit/sortable`'s `SortableContext` / `useSortable`; new dependency
  `@dnd-kit/sortable`.
- **n8n**: `telegram-notifications.json` and `email-digest.json` gain a
  settings fetch + conditional gate; `n8n/README.md` updated to describe
  which values now come from the gateway versus n8n credentials.
- **Docs**: `docs/DEPLOYMENT.md` env reference and §7 n8n setup,
  `docs/DATA_MODEL.md` for the two new tables.
- **Not changed**: secrets remain in the environment and in n8n's credential
  store; no secret is added to the database, to any API response, or to any
  log line.
