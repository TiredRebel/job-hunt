-- migrate:up

ALTER TABLE core.llm_providers ADD COLUMN api_key_ciphertext text;
-- Keep legacy environment references working until each connection is saved
-- with a directly entered key. The application clears the old reference on
-- that explicit update, so this migration never discards authentication data.

-- migrate:down

ALTER TABLE core.llm_providers DROP COLUMN api_key_ciphertext;
