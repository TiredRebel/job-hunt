-- migrate:up

-- Threads the listing title (already known to the scraper at fetch time,
-- see scraper.models.JobLead.title) through to jobs_raw so the Phase 6
-- automation feed can supply POST /process/job with a title without
-- re-scraping or parsing raw_html.
ALTER TABLE scraper.jobs_raw
  ADD COLUMN title text NOT NULL DEFAULT '';

ALTER TABLE scraper.jobs_raw
  ALTER COLUMN title DROP DEFAULT;

-- migrate:down

ALTER TABLE scraper.jobs_raw
  DROP COLUMN title;
