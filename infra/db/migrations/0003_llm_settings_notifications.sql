-- migrate:up

-- ── core.llm_providers ──────────────────────────────────────────────
CREATE TABLE core.llm_providers (
  id                 serial PRIMARY KEY,
  slug               text NOT NULL UNIQUE,
  kind               text NOT NULL CHECK (kind IN ('ollama', 'openai-compatible', 'anthropic')),
  base_url           text NOT NULL,
  default_model      text NOT NULL,
  api_key_env        text,
  pipeline_overrides jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active          boolean NOT NULL DEFAULT false,
  params             jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- exactly one active provider (partial unique index)
CREATE UNIQUE INDEX idx_llm_providers_one_active
  ON core.llm_providers ((true)) WHERE is_active;

CREATE TRIGGER trg_llm_providers_updated_at
  BEFORE UPDATE ON core.llm_providers
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

-- ── core.app_settings ───────────────────────────────────────────────
CREATE TABLE core.app_settings (
  key   text PRIMARY KEY,
  value jsonb NOT NULL
);

-- ── core.notifications ──────────────────────────────────────────────
CREATE TABLE core.notifications (
  id           bigserial PRIMARY KEY,
  job_match_id bigint NOT NULL REFERENCES core.job_matches (id) ON DELETE CASCADE,
  channel      text NOT NULL CHECK (channel IN ('telegram', 'email')),
  sent_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_match_id, channel)
);

-- ── llm.pipeline_runs ───────────────────────────────────────────────
CREATE TABLE llm.pipeline_runs (
  id            bigserial PRIMARY KEY,
  job_id        bigint REFERENCES core.jobs (id) ON DELETE SET NULL,
  pipeline      text NOT NULL CHECK (pipeline IN ('normalize', 'tag', 'match', 'cover_letter')),
  provider_slug text NOT NULL,
  model         text NOT NULL,
  tokens_in     integer,
  tokens_out    integer,
  latency_ms    integer,
  status        text NOT NULL CHECK (status IN ('success', 'failed')),
  error         text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- migrate:down
DROP TABLE llm.pipeline_runs;
DROP TABLE core.notifications;
DROP TABLE core.app_settings;
DROP TABLE core.llm_providers;
