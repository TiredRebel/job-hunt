# Graph Report - job-hunter (2026-07-15)

## Corpus Check

- 67 files · ~11,289 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary

- 372 nodes · 348 edges · 41 communities (31 shown, 10 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness

- Built from commit: `badce609`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)

- [[_COMMUNITY_PROGRESS|PROGRESS]]
- [[_COMMUNITY_devDependencies|devDependencies]]
- [[_COMMUNITY_Architecture digest|Architecture digest]]
- [[_COMMUNITY_devDependencies|devDependencies]]
- [[_COMMUNITY_compilerOptions|compilerOptions]]
- [[_COMMUNITY_UI DESIGN — Job Hunter web app|UI DESIGN — Job Hunter web app]]
- [[_COMMUNITY_tasks|tasks]]
- [[_COMMUNITY_package.json|package.json]]
- [[_COMMUNITY_compilerOptions|compilerOptions]]
- [[_COMMUNITY_package.json|package.json]]
- [[_COMMUNITY_compilerOptions|compilerOptions]]
- [[_COMMUNITY_HealthController|HealthController]]
- [[_COMMUNITY_Architecture|Architecture]]
- [[_COMMUNITY_core|core]]
- [[_COMMUNITY_Architecture Decision Records|Architecture Decision Records]]
- [[_COMMUNITY_LLM Configuration & Hot Switching|LLM Configuration & Hot Switching]]
- [[_COMMUNITY_Source Strategies|Source Strategies]]
- [[_COMMUNITY_Job Hunter|Job Hunter]]
- [[_COMMUNITY_main.py|main.py]]
- [[_COMMUNITY_main.py|main.py]]
- [[_COMMUNITY_Wiki Schema — job-hunter session-context wiki|Wiki Schema — job-hunter session-context wiki]]
- [[_COMMUNITY_layout.tsx|layout.tsx]]
- [[_COMMUNITY_tsconfig.json|tsconfig.json]]
- [[_COMMUNITY_.prettierrc.json|.prettierrc.json]]
- [[_COMMUNITY_README|README.md]]
- [[_COMMUNITY_Log — append-only|Log — append-only]]
- [[_COMMUNITY_tsconfig.build.json|tsconfig.build.json]]
- [[_COMMUNITY_index.ts|index.ts]]
- [[_COMMUNITY_AGENTS|AGENTS.md]]
- [[_COMMUNITY_eslint.config.mjs|eslint.config.mjs]]
- [[_COMMUNITY_next.config.ts|next.config.ts]]
- [[_COMMUNITY_postcss.config.mjs|postcss.config.mjs]]
- [[_COMMUNITY___init__.py|__init__.py]]
- [[_COMMUNITY___init__.py|__init__.py]]
- [[_COMMUNITY_llm|llm]]
- [[_COMMUNITY_scraper|scraper]]

## God Nodes (most connected - your core abstractions)

1. `compilerOptions` - 20 edges
2. `compilerOptions` - 16 edges
3. `UI DESIGN — Job Hunter web app` - 12 edges
4. `Architecture` - 11 edges
5. `core` - 11 edges
6. `PROGRESS` - 10 edges
7. `compilerOptions` - 9 edges
8. `scripts` - 8 edges
9. `Architecture Decision Records` - 8 edges
10. `scripts` - 7 edges

## Surprising Connections (you probably didn't know these)

- `bootstrap()` --indirect_call--> `AppModule` [INFERRED]
  apps/api/src/main.ts → apps/api/src/app.module.ts

## Import Cycles

- None detected.

## Communities (41 total, 10 thin omitted)

### Community 0 - "PROGRESS"

Cohesion: 0.06
Nodes (25): Coding Standards, Definition of Done (per feature), Git hygiene, Python (`services/scraper`, `services/llm`), SQL / migrations, TypeScript (`apps/web`, `apps/api`, `packages/*`), Universal, Data Model (Postgres 17, database `jobhunter`) (+17 more)

### Community 1 - "devDependencies"

Cohesion: 0.07
Nodes (26): dependencies, @nestjs/common, @nestjs/core, @nestjs/platform-express, reflect-metadata, rxjs, description, devDependencies (+18 more)

### Community 2 - "Architecture digest"

Cohesion: 0.11
Nodes (19): Context pages, Index — job-hunter wiki, Raw sources (canonical project docs — read in place, never edit from wiki), Architecture digest, Data flow, Key ports, Non-negotiable rules, Services (+11 more)

### Community 3 - "devDependencies"

Cohesion: 0.09
Nodes (21): dependencies, next, react, react-dom, devDependencies, eslint, eslint-config-next, tailwindcss (+13 more)

### Community 4 - "compilerOptions"

Cohesion: 0.09
Nodes (21): compilerOptions, declaration, esModuleInterop, exactOptionalPropertyTypes, forceConsistentCasingInFileNames, isolatedModules, lib, module (+13 more)

### Community 5 - "UI DESIGN — Job Hunter web app"

Cohesion: 0.10
Nodes (20): 10. Forbidden (anti-generic guard, adapted from skill), 11. Open items, 1. Product posture, 2.1 Color, 2.2 Typography, 2.3 Spacing & density, 2.4 Shape & elevation, 2. Design tokens (+12 more)

### Community 6 - "tasks"

Cohesion: 0.10
Nodes (19): husky.sh script, devDependencies, husky, lint-staged, prettier, turbo, dependsOn, outputs (+11 more)

### Community 7 - "package.json"

Cohesion: 0.10
Nodes (20): description, engines, node, lint-staged, _.{md,json,yml,yaml}, services/llm/\**/_.py, services/scraper/**/*.py, *.{ts,tsx} (+12 more)

### Community 8 - "compilerOptions"

Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 9 - "package.json"

Cohesion: 0.13
Nodes (14): description, devDependencies, eslint, typescript, main, name, private, scripts (+6 more)

### Community 10 - "compilerOptions"

Cohesion: 0.15
Nodes (12): compilerOptions, baseUrl, emitDecoratorMetadata, experimentalDecorators, module, moduleResolution, outDir, paths (+4 more)

### Community 11 - "HealthController"

Cohesion: 0.23
Nodes (7): AppModule, HealthController, HealthStatus, bootstrap(), Controller, Get, Module

### Community 12 - "Architecture"

Cohesion: 0.18
Nodes (11): 10. Testing strategy, 1. Goals & constraints, 2. Services, 3. Layering (every service), 4. Data flow, 5. Source adapters (scraper), 6. LLM provider hub (llm service), 7. Orchestration split (n8n vs LangGraph) (+3 more)

### Community 13 - "core"

Cohesion: 0.18
Nodes (11): core, core.app_settings, core.cover_letters, core.job_matches, core.job_reactions (event log — application/response tracking per vacancy), core.jobs (normalized, LLM-extracted), core.keyword_dictionaries (editable from dashboard), core.llm_providers (+3 more)

### Community 14 - "Architecture Decision Records"

Cohesion: 0.25
Nodes (8): ADR-001: Hybrid orchestration — n8n + LangGraph, ADR-002: Mixed language stack (Python + TypeScript), ADR-003: Single Postgres 17, schema-per-service, ADR-004: Redis as queue/pub-sub, ADR-005: LLM hot-switch via DB registry, ADR-006: Scraping strategy ladder — API → crawl4ai → agent-browser, ADR-007: NestJS for API gateway, Architecture Decision Records

### Community 15 - "LLM Configuration & Hot Switching"

Cohesion: 0.25
Nodes (7): Hot switch flow, LLM Configuration & Hot Switching, Per-pipeline overrides, Provider model, Secrets policy, Seed providers (migration 0003), Structured output discipline

### Community 16 - "Source Strategies"

Cohesion: 0.25
Nodes (7): Adapter contract, dou.ua — `dou` (start here: easiest, richest UA tech jobs), job.ua — `jobua`, Reddit — `reddit`, Source Strategies, Upwork — `upwork` ⚠️ best-effort, work.ua — `workua`

### Community 17 - "Job Hunter"

Cohesion: 0.29
Nodes (7): Architecture at a glance, Job Hunter, Prerequisites, Quality bar, Quick start (target state), Repository layout (monorepo), Status

### Community 18 - "main.py"

Cohesion: 0.29
Nodes (4): health(), FastAPI entrypoint for the LLM service. Run locally with `uv run uvicorn llm.m, Report service liveness.      Returns:         Mapping with a static `status``, Tests for the LLM service health endpoint.

### Community 19 - "main.py"

Cohesion: 0.29
Nodes (4): health(), FastAPI entrypoint for the scraper service. Run locally with `uv run uvicorn s, Report service liveness.      Returns:         Mapping with a static `status``, Tests for the scraper service health endpoint.

### Community 20 - "Wiki Schema — job-hunter session-context wiki"

Cohesion: 0.29
Nodes (6): Layers, Log format (`log.md`, append-only), Operations, Page conventions, Search (qmd), Wiki Schema — job-hunter session-context wiki

### Community 21 - "layout.tsx"

Cohesion: 0.40
Nodes (3): geistMono, geistSans, metadata

### Community 22 - "tsconfig.json"

Cohesion: 0.40
Nodes (4): compilerOptions, outDir, extends, include

### Community 23 - ".prettierrc.json"

Cohesion: 0.40
Nodes (4): printWidth, semi, singleQuote, trailingComma

### Community 24 - "README.md"

Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

### Community 25 - "Log — append-only"

Cohesion: 0.50
Nodes (3): [2026-07-15] checkpoint | Phase 0 complete, Phase 1 (DB & migrations) next, [2026-07-15] ingest | Wiki bootstrapped (Karpathy llm-wiki pattern), Log — append-only

## Knowledge Gaps

- **256 isolated node(s):** `husky.sh script`, `printWidth`, `singleQuote`, `trailingComma`, `semi` (+251 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions

_Questions this graph is uniquely positioned to answer:_

- **Why does `Data Model (Postgres 17, database `jobhunter`)` connect `PROGRESS` to `core`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `Architecture` connect `Architecture` to `PROGRESS`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Why does `core` connect `core` to `PROGRESS`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **What connects `husky.sh script`, `printWidth`, `singleQuote` to the rest of the system?**
  _264 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `PROGRESS` be split into smaller, more focused modules?**
  _Cohesion score 0.06451612903225806 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.07407407407407407 - nodes in this community are weakly interconnected._
- **Should `Architecture digest` be split into smaller, more focused modules?**
  _Cohesion score 0.10507246376811594 - nodes in this community are weakly interconnected._
