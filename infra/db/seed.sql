-- Seed data (idempotent — safe to re-run).
-- Apply: npm run db:seed

BEGIN;

-- ── 5 sources (docs/SOURCES.md) ─────────────────────────────────────
INSERT INTO core.sources (slug, name, base_url, enabled, fetch_strategy, config) VALUES
  ('dou', 'DOU.ua', 'https://jobs.dou.ua', true, 'crawl4ai',
   '{"categories": [], "cities": [], "list_url": "https://jobs.dou.ua/vacancies/"}'),
  ('workua', 'Work.ua', 'https://www.work.ua', true, 'crawl4ai',
   '{"cities": [], "search_params": {}}'),
  ('jobua', 'Job.ua', 'https://www.job.ua', true, 'crawl4ai',
   '{"cities": [], "search_params": {}}'),
  ('reddit', 'Reddit', 'https://www.reddit.com', true, 'api',
   '{"subreddits": ["forhire", "hiringcafe", "remotejs", "jobbit"], "flair_filters": ["[Hiring]"], "rate_limit_rpm": 60}'),
  ('upwork', 'Upwork (best-effort)', 'https://www.upwork.com', false, 'agent-browser',
   '{"note": "aggressive anti-bot; adapter degrades gracefully, reports blocked", "rss_feeds": []}')
ON CONFLICT (slug) DO NOTHING;

-- ── per-source scrape cadence hints (n8n scrape-scheduler) ──────────
-- jsonb merge so re-running the seed doesn't clobber other config keys
UPDATE core.sources SET config = config || '{"cron": "0 * * * *"}'
  WHERE slug IN ('dou', 'workua', 'jobua');
UPDATE core.sources SET config = config || '{"cron": "0 */4 * * *"}'
  WHERE slug IN ('reddit', 'upwork');

-- ── default profile ─────────────────────────────────────────────────
INSERT INTO core.profiles (name, cv_md, skills, preferences, is_active) VALUES
  ('default', NULL, '{}',
   '{"remote": ["remote", "hybrid"], "seniority": ["middle", "senior"], "locations": ["Ukraine", "remote"], "stop_words": [], "salary_min": null}',
   true)
ON CONFLICT (name) DO NOTHING;

-- ── default LLM provider (docs/LLM_CONFIG.md) ───────────────────────
INSERT INTO core.llm_providers
  (slug, name, kind, base_url, default_model, pipeline_overrides, is_active, params) VALUES
  ('ollama-local', 'Ollama local', 'ollama', 'http://localhost:11434', 'qwen3:14b',
   '{"normalize": {"model": "qwen3:8b", "temperature": 0}, "tag": {"model": "qwen3:8b", "temperature": 0}, "match": {"model": "qwen3:14b", "temperature": 0.2}, "cover_letter": {"model": "qwen3:32b", "temperature": 0.7}}',
   true,
   '{"num_ctx": 16384, "timeout_s": 120}')
ON CONFLICT (slug) DO NOTHING;

-- ── starter keyword dictionaries ────────────────────────────────────
INSERT INTO core.keyword_dictionaries (slug, name, kind, items, applies_to, enabled) VALUES
  ('search-terms', 'Search terms', 'search',
   '["python", "fastapi", "typescript", "node.js", "react", "next.js", "nestjs", "backend", "full stack"]', '{}', true),
  ('stop-words', 'Stop words', 'exclude',
   '["1c", "bitrix", "wordpress", "unpaid", "volunteer"]', '{}', true),
  ('excluded-employers', 'Excluded employers', 'exclude_employer',
   '[]', '{}', true),
  ('must-have', 'Must have', 'include',
   '[]', '{}', false),
  ('nice-to-have', 'Nice to have', 'include',
   '["remote", "b2b", "langchain", "langgraph", "llm", "postgresql"]', '{}', true),
  ('tag-aliases', 'Tag aliases', 'alias',
   '{"js": "javascript", "ts": "typescript", "node": "node.js", "nodejs": "node.js", "postgres": "postgresql", "pg": "postgresql", "k8s": "kubernetes", "react.js": "react", "nextjs": "next.js"}', '{}', true)
ON CONFLICT (slug) DO NOTHING;

-- ── app settings defaults ───────────────────────────────────────────
INSERT INTO core.app_settings (key, value) VALUES
  ('match_threshold', '70'),
  ('digest_hour', '9')
ON CONFLICT (key) DO NOTHING;

COMMIT;
