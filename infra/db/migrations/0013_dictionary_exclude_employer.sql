-- migrate:up

ALTER TABLE core.keyword_dictionaries
  DROP CONSTRAINT keyword_dictionaries_kind_check;

ALTER TABLE core.keyword_dictionaries
  ADD CONSTRAINT keyword_dictionaries_kind_check
  CHECK (kind IN ('search', 'include', 'exclude', 'exclude_employer', 'alias'));

-- migrate:down

ALTER TABLE core.keyword_dictionaries
  DROP CONSTRAINT keyword_dictionaries_kind_check;

ALTER TABLE core.keyword_dictionaries
  ADD CONSTRAINT keyword_dictionaries_kind_check
  CHECK (kind IN ('search', 'include', 'exclude', 'alias'));
