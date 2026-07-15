-- migrate:up

CREATE SCHEMA IF NOT EXISTS core;
CREATE SCHEMA IF NOT EXISTS scraper;
CREATE SCHEMA IF NOT EXISTS llm;

-- shared updated_at trigger
CREATE OR REPLACE FUNCTION core.set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── core.sources ────────────────────────────────────────────────────
CREATE TABLE core.sources (
  id             smallserial PRIMARY KEY,
  slug           text NOT NULL UNIQUE,
  name           text NOT NULL,
  base_url       text NOT NULL,
  enabled        boolean NOT NULL DEFAULT true,
  fetch_strategy text NOT NULL CHECK (fetch_strategy IN ('api', 'crawl4ai', 'agent-browser')),
  config         jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_sources_updated_at
  BEFORE UPDATE ON core.sources
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

-- ── scraper.scrape_runs ─────────────────────────────────────────────
CREATE TABLE scraper.scrape_runs (
  id          bigserial PRIMARY KEY,
  source_id   smallint NOT NULL REFERENCES core.sources (id),
  started_at  timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status      text NOT NULL DEFAULT 'running'
              CHECK (status IN ('running', 'success', 'partial', 'failed')),
  stats       jsonb NOT NULL DEFAULT '{}'::jsonb,
  error       text
);

-- ── scraper.jobs_raw ────────────────────────────────────────────────
CREATE TABLE scraper.jobs_raw (
  id                bigserial PRIMARY KEY,
  run_id            bigint NOT NULL REFERENCES scraper.scrape_runs (id),
  source_id         smallint NOT NULL REFERENCES core.sources (id),
  external_id       text NOT NULL,
  url               text NOT NULL,
  raw_html          text,
  content_hash      text NOT NULL,
  fetched_at        timestamptz NOT NULL DEFAULT now(),
  processing_status text NOT NULL DEFAULT 'pending'
                    CHECK (processing_status IN ('pending', 'queued', 'done', 'failed')),
  UNIQUE (source_id, external_id, content_hash)
);

CREATE INDEX idx_jobs_raw_processing_status
  ON scraper.jobs_raw (processing_status);

-- ── core.jobs ───────────────────────────────────────────────────────
CREATE TABLE core.jobs (
  id              bigserial PRIMARY KEY,
  source_id       smallint NOT NULL REFERENCES core.sources (id),
  raw_id          bigint REFERENCES scraper.jobs_raw (id),
  external_id     text NOT NULL,
  url             text NOT NULL,
  title           text NOT NULL,
  company         text,
  description_md  text,
  summary         text,
  tags            text[] NOT NULL DEFAULT '{}',
  red_flags       text[] NOT NULL DEFAULT '{}',
  salary_min      integer,
  salary_max      integer,
  salary_currency text,
  seniority       text NOT NULL DEFAULT 'unknown'
                  CHECK (seniority IN ('junior', 'middle', 'senior', 'lead', 'unknown')),
  remote          text NOT NULL DEFAULT 'unknown'
                  CHECK (remote IN ('remote', 'hybrid', 'office', 'unknown')),
  location        text,
  posted_at       timestamptz,
  first_seen_at   timestamptz NOT NULL DEFAULT now(),
  last_seen_at    timestamptz NOT NULL DEFAULT now(),
  content_hash    text,
  status          text NOT NULL DEFAULT 'new'
                  CHECK (status IN ('new', 'processed', 'archived', 'hidden')),
  UNIQUE (source_id, external_id)
);

CREATE INDEX idx_jobs_status_last_seen ON core.jobs (status, last_seen_at DESC);
CREATE INDEX idx_jobs_posted_at ON core.jobs (posted_at DESC);
CREATE INDEX idx_jobs_first_seen_at ON core.jobs (first_seen_at DESC);
CREATE INDEX idx_jobs_tags ON core.jobs USING gin (tags);

-- full-text search over title + company + description
CREATE INDEX idx_jobs_fts ON core.jobs USING gin (
  to_tsvector('simple',
    coalesce(title, '') || ' ' || coalesce(company, '') || ' ' || coalesce(description_md, ''))
);

-- migrate:down
DROP TABLE core.jobs;
DROP TABLE scraper.jobs_raw;
DROP TABLE scraper.scrape_runs;
DROP TABLE core.sources;
DROP FUNCTION core.set_updated_at();
DROP SCHEMA llm;
DROP SCHEMA scraper;
DROP SCHEMA core;
