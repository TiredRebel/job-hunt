-- migrate:up

-- ── core.keyword_dictionaries ───────────────────────────────────────
CREATE TABLE core.keyword_dictionaries (
  id         serial PRIMARY KEY,
  slug       text NOT NULL UNIQUE,
  name       text NOT NULL,
  kind       text NOT NULL CHECK (kind IN ('search', 'include', 'exclude', 'alias')),
  items      jsonb NOT NULL DEFAULT '[]'::jsonb,
  applies_to text[] NOT NULL DEFAULT '{}',
  enabled    boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_keyword_dictionaries_updated_at
  BEFORE UPDATE ON core.keyword_dictionaries
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

-- ── core.job_reactions (append-only event log) ──────────────────────
CREATE TABLE core.job_reactions (
  id          bigserial PRIMARY KEY,
  job_id      bigint NOT NULL REFERENCES core.jobs (id) ON DELETE CASCADE,
  profile_id  integer NOT NULL REFERENCES core.profiles (id) ON DELETE CASCADE,
  reaction    text NOT NULL CHECK (reaction IN (
                'saved', 'applied', 'viewed_by_employer', 'replied', 'interview',
                'test_task', 'offer', 'rejected', 'withdrawn', 'note')),
  note        text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_job_reactions_timeline
  ON core.job_reactions (job_id, profile_id, occurred_at DESC);

-- latest non-note reaction = current stage
CREATE VIEW core.job_reaction_current AS
SELECT DISTINCT ON (job_id, profile_id) job_id, profile_id, reaction, occurred_at
FROM core.job_reactions WHERE reaction <> 'note'
ORDER BY job_id, profile_id, occurred_at DESC, id DESC;

-- migrate:down
DROP VIEW core.job_reaction_current;
DROP TABLE core.job_reactions;
DROP TABLE core.keyword_dictionaries;
