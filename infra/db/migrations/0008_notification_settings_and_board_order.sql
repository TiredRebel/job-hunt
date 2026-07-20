-- migrate:up

-- Notification channel configuration (design.md D1/D2 in
-- openspec/changes/notification-settings-and-board-reorder): a typed
-- singleton row, not another core.app_settings jsonb key, so the schema
-- can enforce a port range and NOT NULL discipline a blob can't. Secrets
-- (bot token, SMTP password) are never stored here — only the name of the
-- environment variable holding each one (D1), matching the existing
-- core.llm_providers.api_key_env convention.
CREATE TABLE core.notification_settings (
  id                  integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  telegram_enabled    boolean NOT NULL DEFAULT false,
  telegram_chat_id    text,
  telegram_bot_token_env text NOT NULL DEFAULT 'TELEGRAM_BOT_TOKEN',
  email_enabled       boolean NOT NULL DEFAULT false,
  smtp_host           text,
  smtp_port           integer CHECK (smtp_port BETWEEN 1 AND 65535),
  smtp_user           text,
  smtp_password_env   text NOT NULL DEFAULT 'SMTP_PASSWORD',
  from_email          text,
  to_email            text,
  updated_at          timestamptz NOT NULL DEFAULT now()
);

INSERT INTO core.notification_settings (id) VALUES (1);

-- Manual per-column card ordering on the board (D3/D5). Keyed by
-- (profile_id, job_id) since job_reaction_current already guarantees one
-- current stage per job per profile. `stage` is denormalized and
-- advisory-only: which column a card renders in is always decided by the
-- reaction log, never by this column, so a stale value here cannot
-- misplace a card, only leave a harmless stale position number.
CREATE TABLE core.job_board_position (
  profile_id  integer NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
  job_id      bigint NOT NULL REFERENCES core.jobs(id) ON DELETE CASCADE,
  stage       text NOT NULL,
  position    integer NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (profile_id, job_id)
);

CREATE INDEX job_board_position_profile_stage_position_idx
  ON core.job_board_position (profile_id, stage, position);

-- The seeded 'notifications' app_settings key has never been read by any
-- code (grepped apps/api/src before writing this migration) — remove it
-- so core.notification_settings is the one source of truth for channel
-- config, not a second jsonb blob that looks authoritative but isn't.
DELETE FROM core.app_settings WHERE key = 'notifications';

-- migrate:down

INSERT INTO core.app_settings (key, value) VALUES
  ('notifications', '{"telegram": false, "email": false}')
ON CONFLICT (key) DO NOTHING;

DROP TABLE core.job_board_position;
DROP TABLE core.notification_settings;
