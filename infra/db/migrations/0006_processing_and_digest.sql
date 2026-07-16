-- migrate:up

-- ── scraper.jobs_raw: processing tracking for the n8n processing chain ──
ALTER TABLE scraper.jobs_raw
  ADD COLUMN processed_at timestamptz,
  ADD COLUMN process_attempts integer NOT NULL DEFAULT 0;

-- feed query: pending/queued jobs under the attempt limit, oldest first
CREATE INDEX idx_jobs_raw_unprocessed
  ON scraper.jobs_raw (fetched_at)
  WHERE processing_status IN ('pending', 'queued');

-- ── core.app_settings: digest watermark ──────────────────────────────
INSERT INTO core.app_settings (key, value) VALUES
  ('last_digest_at', 'null')
ON CONFLICT (key) DO NOTHING;

-- migrate:down

DELETE FROM core.app_settings WHERE key = 'last_digest_at';

DROP INDEX scraper.idx_jobs_raw_unprocessed;

ALTER TABLE scraper.jobs_raw
  DROP COLUMN process_attempts,
  DROP COLUMN processed_at;
