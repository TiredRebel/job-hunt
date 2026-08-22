-- migrate:up

ALTER TABLE core.profiles
  ADD COLUMN cv_language text NOT NULL DEFAULT 'en'
    CHECK (cv_language IN ('en', 'uk')),
  ADD COLUMN cv_md_by_language jsonb NOT NULL DEFAULT '{}';

UPDATE core.profiles
SET cv_md_by_language = jsonb_build_object('en', cv_md)
WHERE cv_md IS NOT NULL;

-- migrate:down

UPDATE core.profiles
SET cv_md = COALESCE(cv_md_by_language ->> cv_language, cv_md);

ALTER TABLE core.profiles
  DROP COLUMN cv_md_by_language,
  DROP COLUMN cv_language;
