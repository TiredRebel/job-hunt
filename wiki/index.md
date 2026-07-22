# Index — job-hunter wiki

> Read this first. For session restore: go straight to [current-state](pages/current-state.md).

## Context pages

| Page                                          | Summary                                                                                                                                                                          |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [current-state](pages/current-state.md)       | ⭐ Latest checkpoint: jobs-count reconciliation surfaced end-to-end and live-verified (OpenSpec `sources-jobs-count-discrepancy`, 44/44, not yet committed on `fix-jobs_count`). |
| [project-overview](pages/project-overview.md) | What job-hunter is, goals, monorepo layout, external systems.                                                                                                                    |
| [architecture](pages/architecture.md)         | Services, ports, layering rules, data flow, orchestration split.                                                                                                                 |
| [decisions](pages/decisions.md)               | ADR-001…007 digest: the seven accepted architecture decisions.                                                                                                                   |

## Raw sources (canonical project docs — read in place, never edit from wiki)

| Source                            | One-liner                                                                                    |
| --------------------------------- | -------------------------------------------------------------------------------------------- |
| `../PROGRESS.md`                  | Living phase checklist (Phases 0–7 + gates) and dated milestone log.                         |
| `../docs/ARCHITECTURE.md`         | Full architecture: services table, Clean Architecture layering, data flow, testing strategy. |
| `../docs/DECISIONS.md`            | Seven ADRs, all accepted 2026-07-15.                                                         |
| `../docs/DATA_MODEL.md`           | Postgres 17 `jobhunter` DB: schemas `core`/`scraper`/`llm`, tables, migrations plan.         |
| `../docs/SOURCES.md`              | Per-site scraping strategy & risk notes (dou.ua, work.ua, job.ua, Upwork, Reddit).           |
| `../docs/LLM_CONFIG.md`           | Provider hub config: ollama/ollama-cloud/openai-compatible/anthropic, hot-switch design.     |
| `../docs/CODING_STANDARDS.md`     | Python (uv, ruff, mypy --strict, docstrings) + TS (strict extras, TSDoc) standards.          |
| `../docs/UI_DESIGN.md`            | Dashboard design spec: tokens, dark/light themes, TanStack table, stage kanban.              |
| `../README.md`                    | Repo intro and setup.                                                                        |
| `../graphify-out/GRAPH_REPORT.md` | Auto-generated code knowledge graph report (Graphify; rebuild: `graphify update .`).         |

## Tooling

- **qmd** — collection `job-hunter-wiki` over this dir: `qmd search "plain terms"` (avoid hyphens/slashes).
- **graphify** — code graph in `../graphify-out/`: `graphify explain "Node"`, `graphify path "A" "B"`, `graphify update .` to refresh.
