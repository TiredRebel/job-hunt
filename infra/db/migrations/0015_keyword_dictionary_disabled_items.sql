-- migrate:up

ALTER TABLE core.keyword_dictionaries
  ADD COLUMN disabled_items text[] NOT NULL DEFAULT '{}';

-- migrate:down

ALTER TABLE core.keyword_dictionaries
  DROP COLUMN disabled_items;
