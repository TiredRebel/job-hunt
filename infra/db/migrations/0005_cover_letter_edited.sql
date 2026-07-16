-- migrate:up

ALTER TABLE core.cover_letters
  ADD COLUMN edited boolean NOT NULL DEFAULT false;

-- one draft per job/profile pair; the gateway upserts edits onto it
ALTER TABLE core.cover_letters
  ADD CONSTRAINT uq_cover_letters_job_profile UNIQUE (job_id, profile_id);

-- migrate:down

ALTER TABLE core.cover_letters
  DROP CONSTRAINT uq_cover_letters_job_profile;

ALTER TABLE core.cover_letters
  DROP COLUMN edited;
