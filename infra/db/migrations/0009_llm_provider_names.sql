-- migrate:up

ALTER TABLE core.llm_providers ADD COLUMN name text;
UPDATE core.llm_providers SET name = slug WHERE name IS NULL;
ALTER TABLE core.llm_providers ALTER COLUMN name SET NOT NULL;

-- migrate:down

ALTER TABLE core.llm_providers DROP COLUMN name;
