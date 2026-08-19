-- migrate:up

-- Searching over `description_md` made the jobs search unusable: nearly every
-- posting's body mentions QA, DevOps, PM and the rest of the team, so typing
-- "QA" returned 20 backend and full-stack roles and one actual QA role.
--
-- Search now covers the fields that identify the role — title, company, and
-- the LLM summary — and no longer the raw description. Free-text tech search
-- therefore depends on enrichment having populated summaries; the tags column
-- keeps its own `&&` filter (and idx_jobs_tags) for stack queries, so it is
-- deliberately not folded in here: array_to_string is STABLE, not IMMUTABLE,
-- and cannot appear in an index expression without a wrapper function.
DROP INDEX core.idx_jobs_fts;

CREATE INDEX idx_jobs_fts ON core.jobs USING gin (
  to_tsvector('simple',
    coalesce(title, '') || ' ' || coalesce(company, '') || ' ' || coalesce(summary, ''))
);

-- migrate:down

DROP INDEX core.idx_jobs_fts;

CREATE INDEX idx_jobs_fts ON core.jobs USING gin (
  to_tsvector('simple',
    coalesce(title, '') || ' ' || coalesce(company, '') || ' ' || coalesce(description_md, ''))
);
