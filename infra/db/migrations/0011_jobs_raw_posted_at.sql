-- migrate:up

-- Listing adapters learn the source publication date before fetching a detail
-- page. Keep it with the raw record so the automation chain can persist it
-- into core.jobs without asking the LLM to infer a date.
ALTER TABLE scraper.jobs_raw
  ADD COLUMN posted_at timestamptz;

-- migrate:down

ALTER TABLE scraper.jobs_raw
  DROP COLUMN posted_at;
