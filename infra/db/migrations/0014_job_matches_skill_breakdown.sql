-- migrate:up

ALTER TABLE core.job_matches
  ADD COLUMN matched_skills text[] NOT NULL DEFAULT '{}',
  ADD COLUMN missing_skills text[] NOT NULL DEFAULT '{}';

-- migrate:down

ALTER TABLE core.job_matches
  DROP COLUMN matched_skills,
  DROP COLUMN missing_skills;
