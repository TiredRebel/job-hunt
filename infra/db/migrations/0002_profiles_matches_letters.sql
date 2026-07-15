-- migrate:up

-- ── core.profiles ───────────────────────────────────────────────────
CREATE TABLE core.profiles (
  id          serial PRIMARY KEY,
  name        text NOT NULL UNIQUE,
  cv_md       text,
  skills      text[] NOT NULL DEFAULT '{}',
  preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active   boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- one active profile at a time
CREATE UNIQUE INDEX idx_profiles_one_active
  ON core.profiles ((true)) WHERE is_active;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON core.profiles
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

-- ── core.job_matches ────────────────────────────────────────────────
CREATE TABLE core.job_matches (
  id          bigserial PRIMARY KEY,
  job_id      bigint NOT NULL REFERENCES core.jobs (id) ON DELETE CASCADE,
  profile_id  integer NOT NULL REFERENCES core.profiles (id) ON DELETE CASCADE,
  score       smallint NOT NULL CHECK (score BETWEEN 0 AND 100),
  explanation text,
  model_used  text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_id, profile_id)
);

CREATE INDEX idx_job_matches_score ON core.job_matches (score DESC);

-- ── core.cover_letters ──────────────────────────────────────────────
CREATE TABLE core.cover_letters (
  id         bigserial PRIMARY KEY,
  job_id     bigint NOT NULL REFERENCES core.jobs (id) ON DELETE CASCADE,
  profile_id integer NOT NULL REFERENCES core.profiles (id) ON DELETE CASCADE,
  body_md    text NOT NULL,
  model_used text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_cover_letters_updated_at
  BEFORE UPDATE ON core.cover_letters
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

-- migrate:down
DROP TABLE core.cover_letters;
DROP TABLE core.job_matches;
DROP TABLE core.profiles;
