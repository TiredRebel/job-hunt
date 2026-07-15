# Log — append-only

## [2026-07-15] ingest | Wiki bootstrapped (Karpathy llm-wiki pattern)

Instantiated schema (CLAUDE.md), index, log. Seed-ingested PROGRESS.md,
docs/ARCHITECTURE.md, docs/DECISIONS.md → wrote project-overview,
architecture, decisions pages. Remaining docs catalogued as raw sources
in index.md.

## [2026-07-15] checkpoint | Phase 0 complete, Phase 1 (DB & migrations) next

Monorepo bootstrapped and committed; all design docs composed; jobhunter DB
created in pg-learn. See pages/current-state.md for resume details.

## [2026-07-15] ingest | Graphify code knowledge graph built

`graphify update .` (v0.9.6, local AST pass, no LLM) → `../graphify-out/`:
graph.html (interactive), GRAPH_REPORT.md, graph.json. 372 nodes, 348 edges,
41 communities, 100% EXTRACTED, from commit badce609. Restore aid: use
`graphify explain "Node"` / `graphify path "A" "B"` to navigate code structure;
refresh with `graphify update .` after code changes (free). Semantic doc pass
and `--wiki`/`--obsidian` export remain optional upgrades.

## [2026-07-15] checkpoint | Phase 2 scraper service complete (commit 6b24cdc)

PoliteClient (robots.txt, throttle+jitter, FetchBlockedError, no bot evasion),
5 adapters (dou.ua, work.ua, job.ua, Reddit JSON, Upwork RSS best-effort),
fingerprint dedup + incremental runs, REST POST /scrape/{source} + GET /runs.
25 fixture-based tests, ruff + mypy --strict green. Deferred: crawl4ai +
agent-browser fallback for JS-heavy pages. Next: Phase 3 (LLM service).
Graphify graph now stale — refresh before relying on it.
