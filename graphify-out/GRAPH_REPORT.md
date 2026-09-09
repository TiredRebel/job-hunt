# Graph Report - job-hunter (2026-09-09)

## Corpus Check

- 851 files · ~389,218 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary

- 6485 nodes · 11145 edges · 466 communities (394 shown, 72 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 520 edges (avg confidence: 0.59)
- Token cost: 0 input · 0 output

## Graph Freshness

- Built from commit: `da46bc22`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)

- PROGRESS
- dependencies
- Architecture digest
- web-settings/src/components/shell/dashboard-shell.tsx
- compilerOptions
- UI DESIGN — Job Hunter web app
- scripts
- FakeKeywordDictionaryRepository
- settings.service.ts
- shared-ts/package.json
- compilerOptions
- health.controller.ts
- Architecture
- core
- Architecture Decision Records
- LLM Configuration & Hot Switching
- Source Strategies
- Requirements
- TestClient
- scraper/main.py
- Wiki Schema — job-hunter session-context wiki
- cn
- shared-ts/tsconfig.json
- .prettierrc.json
- dependencies
- Log — append-only
- tsconfig.build.json
- schema.sql
- automation.controller.ts
- automation.dto.ts
- test_prompts.py
- board-reorder.spec.ts
- Database
- llm/**init**.py
- scraper/**init**.py
- notification-settings-form.tsx
- ADDED Requirements
- llm
- scraper
- job-detail.tsx
- CompletionRequest
- http-llm-admin.client.ts
- 2026-08-06-fix-jobs-posted-sort-order/design.md
- routes.py
- JobLead
- source-form-dialog.tsx
- web-settings/src/app/[locale]/layout.tsx
- api.ts
- n8n workflows
- 2026-08-06-llm-prompt-injection-guardrails/tasks.md
- dict-editor.tsx
- filter-bar.tsx
- automation.service.spec.ts
- ProfilesController
- scraper-client.port.ts
- LlmAdminService
- cover-letters.service.spec.ts
- jobs.controller.ts
- LLM Wiki — Reference Templates
- filters.py
- Profile
- ScraperClient
- LlmProvider
- SourcesService
- Source
- board-collision.spec.ts
- internal-token.guard.ts
- make_row
- What You Must Do When Invoked
- web-jobs/src/components/shell/topbar.tsx
- exports
- devDependencies
- HttpScraperClient
- sources.controller.ts
- Requirements
- FakeDb
- settings.response.dto.ts
- JobsService
- ADDED Requirements
- 2026-08-06-fix-jobs-posted-sort-order/proposal.md
- LlmAdminController
- Requirement: Filterable jobs table
- 2026-08-06-llm-prompt-injection-guardrails/proposal.md
- fetchers/**init**.py
- test_agent_browser.py
- test_db.py
- HttpLlmAdminClient
- .save
- .claude/skills/openspec-explore/SKILL.md
- .addBulk
- Decisions
- llm-admin.controller.ts
- postgres-job.repository.spec.ts
- explore.md
- Decisions
- Requirement: Jobs list pagination controls
- Data Model (Postgres 17, database `jobhunter`)
- EscalatingFetcher
- web-settings/src/lib/formatters.ts
- Decisions
- README.md
- ADDED Requirements
- 2026-07-23-jobs-bulk-delete/tasks.md
- scraper/tests/test_observability.py
- Requirement: Escalation only for JS shells, never for blocked responses
- 2026-08-06-llm-prompt-injection-guardrails/design.md
- Requirements
- Decisions
- scripts
- Job Hunter
- scripts
- PgDatabase
- app.module.ts
- graphify reference: extra exports and benchmark
- adapters/**init**.py
- web-board/src/components/density-toggle.tsx
- web-board/src/i18n/navigation.ts
- JobReactionEvent
- Requirement: Escalation only for JS shells, never for blocked responses
- web-board/src/components/design-mode-toggle.tsx
- 2026-08-06-fix-jobs-posted-sort-order/tasks.md
- web-board/src/components/shell/topbar.tsx
- ADDED Requirements
- is_js_shell
- Requirements
- Requirement: Provider configuration
- Requirements
- Jobs redesign — verification report
- ADDED Requirements
- ADDED Requirements
- ADDED Requirements
- Requirement: Poison jobs are marked failed after repeated attempts
- Requirements
- Tasks — Phase 5 Web app (NextJS dashboard)
- ADDED Requirements
- ADDED Requirements
- crawl4ai-fetching
- Requirement: Dictionary CRUD
- Requirements
- Implementation sequence
- ADDED Requirements
- Requirement: Dictionary CRUD
- ADDED Requirements
- Tasks: phase-6-n8n-workflows
- agent-browser-fallback
- email-digest
- match-notifications
- Requirements
- Requirement: Workflows exported and versioned
- llm/tests/test_observability.py
- Requirement: Bulk stage actions
- Proposal: phase-2-crawl4ai-fetch-ladder
- ADDED Requirements
- Phase 5 — Web app (NextJS dashboard)
- ADDED Requirements
- Proposal: phase-6-n8n-workflows
- ADDED Requirements
- Requirement: Cover letter viewing and editing
- ADDED Requirements
- ADDED Requirements
- Tasks: phase-2-crawl4ai-fetch-ladder
- looks_like_anti_bot_challenge
- 2026-07-23-jobs-bulk-delete/proposal.md
- KeywordDictionariesController
- Requirement: Provider configuration
- Requirements
- Installation, Configuration & Deployment
- ADDED Requirements
- ADDED Requirements
- Requirement: Provider configuration
- delete-source/proposal.md
- Job
- ReactionsService
- 1. App shell
- Decisions
- Decisions
- Requirement: Delete a source
- graphify reference: query, path, explain
- Decisions
- Decisions
- Requirement: Notification configuration is persisted and editable
- Requirement: Jobs list pagination controls
- web-jobs/src/app/[locale]/layout.tsx
- Decisions
- ADDED Requirements
- Decisions
- BulkReactionsDto
- getServerApiBaseUrl
- Requirement: Cards can be manually ordered within a column
- Tasks — notification settings + board card reordering
- Requirement: Correlation id is propagated end to end
- source-command-opsx-explore
- Requirement: Pointer drops resolve to the target under the pointer
- web-settings/src/components/density-toggle.tsx
- jobs-route-bundle.mjs
- test_provider_retry.py
- 2026-07-22-simplify-static-html-adapters/design.md
- 2026-07-22-sources-jobs-count-discrepancy/tasks.md
- Requirement: Public gateway endpoints are rate limited
- Requirement: Bulk-delete multiple vacancies
- .agents/skills/openspec-explore/SKILL.md
- Requirement: Deleting from the detail view closes it immediately
- Tasks — Phase 7 Hardening
- 2026-07-20-delete-job/design.md
- Requirement: Automation endpoint surface
- test_adapters.py
- Requirement: Transient cross-service calls are retried with backoff
- app.throttling.spec.ts
- find_injection_signals
- Requirement: Correlation id is propagated end to end
- Requirement: Notifications section
- Requirement: Bulk-delete multiple vacancies
- quality-gates
- 2. Jobs dashboard (`/jobs` — primary surface)
- delete-source/tasks.md
- api/package.json
- llm/main.py
- devDependencies
- 2026-07-23-jobs-bulk-delete/design.md
- devDependencies
- graphify reference: add a URL and watch a folder
- Proposal: sources-page-crud
- Proposal: llm-provider-delete-and-model-picker
- Proposal: llm-settings-config
- ADDED Requirements
- Requirement: Transient cross-service calls are retried with backoff
- Requirement: Delete a normalized vacancy
- Notification settings + board card reordering
- Requirement: Fetcher selection driven by source strategy
- Tasks: sources-page-crud
- Tasks: llm-settings-config
- 2026-07-19-phase-7-hardening/proposal.md
- ADDED Requirements
- Requirement: Politeness is enforced identically for every fetcher
- 2026-07-20-delete-job/proposal.md
- 2026-07-20-delete-job/tasks.md
- 2026-07-22-simplify-static-html-adapters/proposal.md
- 2026-07-22-sources-jobs-count-discrepancy/proposal.md
- Requirement: Jobs dashboard reconciliation strip
- Requirement: Sources list with enable toggle
- 2026-07-23-improve-board-dnd-perf/proposal.md
- 3. Board (`/board` — reaction-stage kanban)
- graphify reference: commit hook and native CLAUDE.md integration
- web-settings/src/i18n/navigation.ts
- graphify reference: incremental update and cluster-only
- Tasks: llm-provider-delete-and-model-picker
- Requirement: Poison jobs are marked failed after repeated attempts
- Requirement: Delete a vacancy from the jobs list
- Requirement: Delete a vacancy from the board
- 2026-07-22-simplify-static-html-adapters/tasks.md
- 2026-07-22-fix-board-cross-column-keyboard-drag/design.md
- web-board/src/components/shell/command-palette.tsx
- 2026-07-22-fix-board-cross-column-keyboard-drag/proposal.md
- opencode.json
- 8. Component inventory
- Autoresearch log
- source-command-opsx-apply
- source-command-opsx-archive
- source-command-opsx-propose
- source-command-opsx-sync
- web-board/src/components/shell/sidebar.tsx
- 4. Job detail (drawer + `/jobs/[id]`)
- web-settings/package.json
- web-settings/src/lib/hooks/use-keyboard-nav.ts
- Q: Does this application uses Ollama as a current LLM provider?
- Job Hunter redesign — coding-agent prompt pack
- graphify reference: GitHub clone and cross-repo merge
- graphify reference: transcribe video and audio
- graphify.js
- compilerOptions
- next-themes
- web-settings/src/components/design-mode-toggle.tsx
- KeywordDictionary
- AutomationService
- 2026-07-22-jobs-list-pagination/proposal.md
- AGENTS.md
- 2026-07-22-fix-board-cross-column-keyboard-drag/tasks.md
- 2026-07-22-jobs-list-pagination/tasks.md
- 2026-07-23-improve-board-dnd-perf/design.md
- 2026-07-23-improve-board-dnd-perf/tasks.md
- compilerOptions
- web-settings/src/components/shell/topbar.tsx
- Requirement: Keyboard-accessible drag and drop
- 2026-07-22-jobs-list-pagination/design.md
- nestjs-pino
- @nestjs/platform-express
- pg
- @nestjs/swagger
- rxjs
- CreateKeywordDictionaryDto
- compilerOptions
- compilerOptions
- ProviderRow
- web-board/src/components/score-badge.tsx
- devDependencies
- devDependencies
- clsx
- web-board/src/components/theme-toggle.tsx
- dictionary-filters.ts
- extraction-spec.md
- wiki-ops/SKILL.md
- 0003_llm_settings_notifications.sql
- Jobs redesign — orientation audit
- 0001_sources_and_jobs.sql
- 0002_profiles_matches_letters.sql
- 0004_dictionaries_reactions.sql
- KeywordDictionariesService
- 5. Settings cluster
- core.job_board_position
- all_responses
- @dnd-kit/core
- core.cover_letters
- design-sync notes — job-hunter
- scraper.jobs_raw
- scraper.jobs_raw
- core.llm_providers
- core.llm_providers
- scraper.jobs_raw
- Job Hunter — building with this design system
- 6. States & dialogs
- Table.tsx
- class-validator
- zod
- Developer Handoff: Job Hunter Web App
- web-api/src/index.ts
- dependencies
- core.keyword_dictionaries
- core.job_matches
- core.keyword_dictionaries
- react
- sonner
- dependencies
- web-settings/src/components/theme-toggle.tsx
- UpdateNotificationSettingsDto
- clsx
- .**init**
- Crawl4aiFetcher
- core.profiles
- cmdk
- 6. Board drag-and-drop performance
- exports
- 3. List + detail pane
- Job Hunter — `/en/jobs` Redesign Specification
- 2. Triage speed
- 7. Token system
- 1. Page shell
- 4. Filters
- RawJobRow
- @tanstack/react-table
- reactions.module.ts
- web-board/src/app/[locale]/layout.tsx
- @tanstack/react-table
- ADDED Requirements
- @job-hunter/shared-ts
- Decisions
- compilerOptions
- compilerOptions
- jobs-client.tsx
- devDependencies
- Request
- scripts
- queryKeys
- provider-config-dialog.tsx
- dependencies
- lucide-react
- next-themes
- web-board/src/lib/formatters.ts
- Requirement: Typed API access layer
- radix-ui
- tw-animate-css
- scripts
- zod
- web-settings/postcss.config.mjs
- jobs-rendering.spec.ts
- web-micro-frontends/proposal.md
- web-ui/package.json
- web-board/src/lib/hooks/use-keyboard-nav.ts
- web-jobs/package.json
- web-micro-frontends/tasks.md
- scripts
- web-board/README.md
- web-board/src/lib/cron-hint.ts
- web-jobs/README.md
- web-jobs/src/lib/cron-hint.ts
- web-shell
- web-settings/README.md
- web-board/next-env.d.ts
- @job-hunter/shared-ts
- @job-hunter/web-api
- lucide-react
- web-board/postcss.config.mjs
- web-board/src/lib/slug.ts
- web-jobs/next-env.d.ts
- @job-hunter/shared-ts
- lucide-react
- next-themes
- radix-ui
- tailwind-merge
- tw-animate-css
- zod
- web-jobs/postcss.config.mjs
- web-jobs/src/lib/slug.ts
- web-settings/next-env.d.ts
- web-shell/next-env.d.ts

## God Nodes (most connected - your core abstractions)

1. `cn()` - 144 edges
2. `apiRequest()` - 56 edges
3. `wire()` - 53 edges
4. `ProviderRow` - 48 edges
5. `Profile` - 45 edges
6. `JobLead` - 44 edges
7. `listJobs()` - 40 edges
8. `FakeDb` - 38 edges
9. `queryKeys` - 37 edges
10. `FakeProvider` - 36 edges

## Surprising Connections (you probably didn't know these)

- `ModelCombobox()` --calls--> `cn()` [EXTRACTED]
  apps/web-settings/src/components/llm/provider-config-dialog.tsx → packages/web-ui/src/utils.ts
- `listAllStageJobs()` --calls--> `listJobs()` [EXTRACTED]
  apps/web-board/src/components/board/stage-board.tsx → packages/web-api/src/jobs.ts
- `StageBoard()` --calls--> `deleteJob()` [EXTRACTED]
  apps/web-board/src/components/board/stage-board.tsx → packages/web-api/src/jobs.ts
- `StageBoard()` --calls--> `addReaction()` [EXTRACTED]
  apps/web-board/src/components/board/stage-board.tsx → packages/web-api/src/reactions.ts
- `StageBoard()` --calls--> `setBoardOrder()` [EXTRACTED]
  apps/web-board/src/components/board/stage-board.tsx → packages/web-api/src/reactions.ts

## Import Cycles

- None detected.

## Communities (466 total, 72 thin omitted)

### Community 0 - "PROGRESS"

Cohesion: 0.15
Nodes (13): 2026-07-21, 2026-07-21 (2) — Jobs-count reconciliation surfaced, Architecture review follow-up — 2026-07-20, Log, Phase 0 — Bootstrap ✅, Phase 1 — Data model & migrations ✅, Phase 2 — Scraper service (Python, FastAPI) ✅, Phase 3 — LLM service (Python, FastAPI + LangGraph) ✅ (+5 more)

### Community 1 - "dependencies"

Cohesion: 0.10
Nodes (21): dependencies, class-transformer, nestjs-cls, @nestjs/common, @nestjs/config, @nestjs/core, @nestjs/throttler, pino (+13 more)

### Community 2 - "Architecture digest"

Cohesion: 0.08
Nodes (26): Context pages, Index — job-hunter wiki, Raw sources (canonical project docs — read in place, never edit from wiki), Tooling, Architecture digest, Data flow, Key ports, Microservices + micro-frontends (+18 more)

### Community 3 - "web-settings/src/components/shell/dashboard-shell.tsx"

Cohesion: 0.20
Nodes (11): CommandPaletteContext, CommandPaletteProvider(), CommandPaletteState, useCommandPalette(), DashboardShell(), DashboardShellProps, CommandPalette, isTypingTarget() (+3 more)

### Community 4 - "compilerOptions"

Cohesion: 0.09
Nodes (22): compilerOptions, declaration, esModuleInterop, exactOptionalPropertyTypes, forceConsistentCasingInFileNames, isolatedModules, lib, module (+14 more)

### Community 5 - "UI DESIGN — Job Hunter web app"

Cohesion: 0.10
Nodes (20): 10. Forbidden (anti-generic guard, adapted from skill), 11. Open items, 1. Product posture, 2.1 Color, 2.2 Typography, 2.3 Spacing & density, 2.4 Shape & elevation, 2. Design tokens (+12 more)

### Community 6 - "scripts"

Cohesion: 0.04
Nodes (47): dbmate, husky, lint-staged, description, devDependencies, dbmate, husky, lint-staged (+39 more)

### Community 8 - "settings.service.ts"

Cohesion: 0.14
Nodes (17): NOTIFICATION_SETTINGS_REPOSITORY, NotificationSettingsRepository, FakeNotificationSettingsRepository, NotificationSettings, UpdateNotificationSettingsInput, applyChannelPatch(), applyScalarPatch(), mapRow() (+9 more)

### Community 9 - "shared-ts/package.json"

Cohesion: 0.10
Nodes (19): openapi-typescript, description, devDependencies, eslint, openapi-typescript, typescript, eslint, typescript (+11 more)

### Community 10 - "compilerOptions"

Cohesion: 0.13
Nodes (14): compilerOptions, baseUrl, emitDecoratorMetadata, experimentalDecorators, module, moduleResolution, outDir, paths (+6 more)

### Community 11 - "health.controller.ts"

Cohesion: 0.15
Nodes (11): HealthController, HealthStatus, ApiOkResponse, ApiOperation, ApiTags, Controller, Get, HealthModule (+3 more)

### Community 12 - "Architecture"

Cohesion: 0.15
Nodes (13): 10. Testing strategy, 1. Goals & constraints, 2.1 Multi-zone micro-frontend composition, 2. Services, 3. Layering (every service), 4. Data flow, 5. Source adapters (scraper), 6. LLM provider hub (llm service) (+5 more)

### Community 13 - "core"

Cohesion: 0.13
Nodes (15): core, core.app_settings, core.cover_letters, core.job_board_position (advisory manual card order), core.job_matches, core.job_reactions (event log — application/response tracking per vacancy), core.jobs (normalized, LLM-extracted), core.keyword_dictionaries (editable from dashboard) (+7 more)

### Community 14 - "Architecture Decision Records"

Cohesion: 0.22
Nodes (8): ADR-001: Hybrid orchestration — n8n + LangGraph, ADR-002: Mixed language stack (Python + TypeScript), ADR-003: Single Postgres 17, schema-per-service, ADR-004: Redis as queue/pub-sub, ADR-005: LLM hot-switch via DB registry, ADR-006: Scraping strategy ladder — API → crawl4ai → agent-browser, ADR-007: NestJS for API gateway, Architecture Decision Records

### Community 15 - "LLM Configuration & Hot Switching"

Cohesion: 0.22
Nodes (9): Hot switch flow, LLM Configuration & Hot Switching, Managing providers from the UI, Per-pipeline overrides, Prompt-injection guardrail, Provider model, Secrets policy, Seed providers (migration 0003) (+1 more)

### Community 16 - "Source Strategies"

Cohesion: 0.20
Nodes (9): Adapter contract, dou.ua — `dou` (start here: easiest, richest UA tech jobs), How the ladder works (as implemented), job.ua — `jobua`, Reddit — `reddit`, Source Strategies, Static HTML adapter mechanics, Upwork — `upwork` ⚠️ best-effort (+1 more)

### Community 17 - "Requirements"

Cohesion: 0.13
Nodes (14): llm-prompt-guardrails, Purpose, Requirement: Denial is a distinct client error, not a generic upstream failure, Requirement: Denied attempts are recorded without an upstream call, Requirement: Detect prompt injection before any provider call, Requirement: Untrusted content is structurally isolated in prompts, Requirements, Scenario: A legitimate AI/ML job posting is not blocked (+6 more)

### Community 18 - "TestClient"

Cohesion: 0.11
Nodes (49): FakeDb, FakeProvider, In-memory `LLMProvider` returning canned responses per schema type., Tests for the REST surface (fakes injected via app state, no real I/O)., A row activated between the active-check and the delete itself still 409s., test_cover_letter_endpoint(), test_cover_letter_endpoint_selects_prompt_by_provider_kind(), test_cover_letter_llm_error_502() (+41 more)

### Community 19 - "scraper/main.py"

Cohesion: 0.04
Nodes (78): BackgroundTasks, ge, le, LookupError, get_settings(), BaseSettings, Runtime configuration for the scraper service. Settings come from environment…, Scraper service settings. Attributes: database_url: PostgreSQL DSN… (+70 more)

### Community 20 - "Wiki Schema — job-hunter session-context wiki"

Cohesion: 0.29
Nodes (6): graphify, Layers, Log format (`log.md`, append-only), Page conventions, Search (qmd), Wiki Schema — job-hunter session-context wiki

### Community 21 - "cn"

Cohesion: 0.05
Nodes (47): COLOR_BY_REACTION, STAGE_PICKER_OPTIONS, StageBadge(), StageBadgeProps, StageColor, dynamic, JobRowActions(), JobRowActionsProps (+39 more)

### Community 22 - "shared-ts/tsconfig.json"

Cohesion: 0.29
Nodes (6): compilerOptions, outDir, extends, include, src/**/*, ../../tsconfig.base.json

### Community 23 - ".prettierrc.json"

Cohesion: 0.40
Nodes (4): printWidth, semi, singleQuote, trailingComma

### Community 24 - "dependencies"

Cohesion: 0.08
Nodes (25): dependencies, class-variance-authority, cmdk, @job-hunter/web-api, @job-hunter/web-ui, next, next-intl, react (+17 more)

### Community 25 - "Log — append-only"

Cohesion: 0.06
Nodes (32): [2026-07-15] checkpoint | Phase 0 complete, Phase 1 (DB & migrations) next, [2026-07-15] checkpoint | Phase 2 scraper service complete (commit 6b24cdc), [2026-07-15] checkpoint | Phase 3 LLM service complete, routes refactored (commit 63b8a59), [2026-07-15] ingest | Graphify code knowledge graph built, [2026-07-15] ingest | Wiki bootstrapped (Karpathy llm-wiki pattern), [2026-07-16] checkpoint | Phase 2 crawl4ai/agent-browser leftover complete (OpenSpec 20/20), [2026-07-16] checkpoint | Phase 4 API gateway skeleton + domain APIs done, [2026-07-16] checkpoint | Phase 4 complete — OpenAPI schema enrichment (commit 21b2f40) (+24 more)

### Community 26 - "tsconfig.build.json"

Cohesion: 0.33
Nodes (5): exclude, extends, vitest.config.ts, src/**/*.spec.ts, ./tsconfig.json

### Community 27 - "schema.sql"

Cohesion: 0.15
Nodes (23): core.app_settings, core.cover_letters, core.job_board_position, core.job_matches, core.job_reaction_current, core.job_reactions, core.jobs, core.keyword_dictionaries (+15 more)

### Community 28 - "automation.controller.ts"

Cohesion: 0.33
Nodes (12): DeadLetterJobResponse, DigestJobSummaryResponse, DigestMatchSummaryResponse, DigestResponse, DigestSentResponse, JobResultAckResponse, LlmProfileInputResponse, NotificationRecordedResponse (+4 more)

### Community 29 - "automation.dto.ts"

Cohesion: 0.19
Nodes (21): CoverLetterDto, DeadLetterJobsQueryDto, JobResultDto, MatchDto, NormalizedJobDto, NOTIFICATION_CHANNEL_VALUES, RecordNotificationDto, ApiProperty (+13 more)

### Community 30 - "test_prompts.py"

Cohesion: 0.10
Nodes (22): cover_letter_prompt(), cover_letter_system(), match_prompt(), normalize_prompt(), Prompt templates for the four pipelines. Prompts embed only caller-supplied…, Pick the cover-letter system prompt formatted for the provider's family. Claude…, Build the user prompt for the `normalize` pipeline., Build the user prompt for the `tag` pipeline. (+14 more)

### Community 31 - "board-reorder.spec.ts"

Cohesion: 0.14
Nodes (6): clearAmbientSavedJobs(), seedSavedColumn(), retryUntilHydrated(), findJobRow(), openJobs(), prepareBoardJob()

### Community 32 - "Database"

Cohesion: 0.05
Nodes (39): Database, Load enabled search dictionaries (re-read on every run). Returns: Rows feeding…, Insert a `running` scrape-run row. Args: source_id: FK into `core.sources`.…, Finalize a scrape-run row. Args: run_id: Id returned by :meth:`create_run`.…, Persist a raw posting, deduplicating on the unique constraint. Duplicate rows…, Thin async facade over the connection pool., Create the (closed) pool. Args: dsn: PostgreSQL connection string., Open the pool and verify connectivity. (+31 more)

### Community 37 - "notification-settings-form.tsx"

Cohesion: 0.11
Nodes (13): JobsLoadingState(), buildPatch(), fromSettings(), NotificationFormState, NotificationSettingsForm(), validate(), ValidationErrors, getNotificationSettings() (+5 more)

### Community 38 - "ADDED Requirements"

Cohesion: 0.14
Nodes (13): ADDED Requirements, Purpose, Requirement: Denial is a distinct client error, not a generic upstream failure, Requirement: Denied attempts are recorded without an upstream call, Requirement: Detect prompt injection before any provider call, Requirement: Untrusted content is structurally isolated in prompts, Scenario: A legitimate AI/ML job posting is not blocked, Scenario: Blocked attempt appears in pipeline run history (+5 more)

### Community 41 - "job-detail.tsx"

Cohesion: 0.05
Nodes (48): dynamic, JobDetailPageProps, DetailPane(), DetailPaneProps, readWidth(), FocusModeProps, JobCard(), JobCardProps (+40 more)

### Community 42 - "CompletionRequest"

Cohesion: 0.04
Nodes (68): AsyncRetrying, BaseException, ProviderRequestError, Domain errors for the LLM service., The upstream provider HTTP call failed., The provider reply did not validate against the pipeline schema., SchemaValidationError, Structured-output execution engine with constrained retries. Per… (+60 more)

### Community 43 - "http-llm-admin.client.ts"

Cohesion: 0.27
Nodes (10): CreateLlmProviderInput, LLM_ADMIN_CLIENT, LlmServiceError, ModelList, ProviderTestResult, TestLlmProviderConnectionInput, UpdateLlmProviderInput, LlmProviderKind (+2 more)

### Community 44 - "2026-08-06-fix-jobs-posted-sort-order/design.md"

Cohesion: 0.22
Nodes (8): Context, D1: Use an effective display date only for Posted sorting, D2: Retain the existing unique ID tie-breaker, D3: Test the generated ordering at the repository boundary, Decisions, Goals / Non-Goals, Migration Plan, Risks / Trade-offs

### Community 45 - "routes.py"

Cohesion: 0.05
Nodes (83): BuildProviderDep, CoverLetter, CredentialCipherDep, DbDep, GraphDepsDep, InternalTokenDep, ModelListResponse, ProviderTestResponse (+75 more)

### Community 46 - "JobLead"

Cohesion: 0.05
Nodes (65): build_posting(), extract_text(), Shared mechanics and helpers for static-HTML source adapters. Source-specific…, Extract normalized text from the first node matching `selector`. Falls back…, Assemble a :class:`RawJobPosting` with a content-based fingerprint.…, Yield parsed leads from one source-specific search request. Args: query: Search…, Fetch, extract, and fingerprint one vacancy detail page. Args: lead: Lead…, parse_list() (+57 more)

### Community 47 - "source-form-dialog.tsx"

Cohesion: 0.05
Nodes (37): BulkActionBar(), BulkActionBarProps, STAGE_OPTIONS, dynamic, ProfilePage(), TagsInput(), TagsInputProps, FormState (+29 more)

### Community 48 - "web-settings/src/app/[locale]/layout.tsx"

Cohesion: 0.17
Nodes (8): geistSans, jetbrainsMono, metadata, createQueryClient(), QueryProvider(), ThemeProvider(), Toaster(), THEME_BOOT_SCRIPT

### Community 49 - "api.ts"

Cohesion: 0.28
Nodes (7): components, $defs, operations, paths, webhooks, Locale, ReactionStage

### Community 50 - "n8n workflows"

Cohesion: 0.22
Nodes (8): Cadences, Import, n8n workflows, Re-export after editing in the UI, Required credentials (create once in the n8n UI, referenced by name only), Required environment variables, Runtime, Verifying end to end

### Community 51 - "2026-08-06-llm-prompt-injection-guardrails/tasks.md"

Cohesion: 0.25
Nodes (7): 1. Injection guard module, 2. Wire the guard into the shared execution path, 3. Route-level error mapping, 4. Prompt hardening (structural isolation), 5. Tests, 6. Docs, 7. Verification

### Community 52 - "dict-editor.tsx"

Cohesion: 0.15
Nodes (17): dynamic, DictionariesPageClient(), DictionaryCard(), DictionaryCardProps, isStringItems(), KIND_ORDER, kindTitle(), dictionary (+9 more)

### Community 53 - "filter-bar.tsx"

Cohesion: 0.07
Nodes (30): DATE_PRESETS, dateInputValue(), FilterBar(), FilterChip, parseDateInput(), presetLabel(), replace, searchParams (+22 more)

### Community 54 - "automation.service.spec.ts"

Cohesion: 0.07
Nodes (27): AUTOMATION_REPOSITORY, AutomationRepository, CoverLetterInput, DigestJobSummary, DigestMatchSummary, DigestPayload, MatchInput, NormalizedJobInput (+19 more)

### Community 55 - "ProfilesController"

Cohesion: 0.14
Nodes (14): ProfilesController, ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags, Body (+6 more)

### Community 56 - "scraper-client.port.ts"

Cohesion: 0.08
Nodes (25): JOBS_RECONCILIATION_REPOSITORY, JobsReconciliationRepository, DeadLetterJob, SCRAPER_CLIENT, ReconciliationAggregate, ReconciliationRow, mapRow(), PostgresJobsReconciliationRepository (+17 more)

### Community 57 - "LlmAdminService"

Cohesion: 0.29
Nodes (3): LlmAdminService, Inject, Injectable

### Community 58 - "cover-letters.service.spec.ts"

Cohesion: 0.08
Nodes (26): COVER_LETTER_REPOSITORY, CoverLetterRepository, CoverLetterJobInput, CoverLetterProfileInput, GenerateCoverLetterInput, GeneratedCoverLetter, LLM_COVER_LETTER_CLIENT, LlmCoverLetterClient (+18 more)

### Community 59 - "jobs.controller.ts"

Cohesion: 0.13
Nodes (27): BulkDeletedResponse, BulkInsertedResponse, DeletedResponse, ApiProperty, PaginatedResponse(), PaginatedShape, JobStatus, RemoteType (+19 more)

### Community 60 - "LLM Wiki — Reference Templates"

Cohesion: 0.08
Nodes (24): Current-State Template (`wiki/pages/current-state.md`), Example Ingest Log Entry, Example Query → File Back, Index Template (`wiki/index.md`), Karpathy's Mental Model, LLM Wiki — Reference Templates, Project Wiki vs Personal Wiki, qmd Collection Setup (+16 more)

### Community 61 - "filters.py"

Cohesion: 0.13
Nodes (28): Load enabled filter dictionaries (re-read on every run). Returns: Rows feeding…, _applies_to(), build_filter_rules(), company_matches(), FilterDictionaryRow, FilterRules, _list_items(), _normalize_term() (+20 more)

### Community 62 - "Profile"

Cohesion: 0.07
Nodes (20): CreateProfileInput, PROFILE_REPOSITORY, ProfileRepository, UpdateProfileInput, FakeProfileRepository, toLlmProfileInput(), FakeProfileRepository, CvLanguage (+12 more)

### Community 63 - "ScraperClient"

Cohesion: 0.18
Nodes (3): ScraperClient, Inject, Inject

### Community 64 - "LlmProvider"

Cohesion: 0.18
Nodes (4): LlmAdminClient, LlmProvider, FakeLlmAdminClient, makeProvider()

### Community 65 - "SourcesService"

Cohesion: 0.11
Nodes (21): ApiConflictResponse, SourcesController, ApiBody, ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam (+13 more)

### Community 66 - "Source"

Cohesion: 0.12
Nodes (14): CreateSourceInput, SOURCE_REPOSITORY, SourceRepository, UpdateSourceInput, ScrapeRun, FetchStrategy, Source, mapRunRow() (+6 more)

### Community 67 - "board-collision.spec.ts"

Cohesion: 0.27
Nodes (9): boardCollisionCacheGeneration(), boardCollisionDetection(), invalidateBoardCollisionCache(), CollisionArgs, container(), DroppableContainer, makeArgs(), RawRect (+1 more)

### Community 68 - "internal-token.guard.ts"

Cohesion: 0.28
Nodes (3): constantTimeEquals(), InternalTokenGuard, Injectable

### Community 69 - "make_row"

Cohesion: 0.09
Nodes (32): FetchActive, ModelResolutionError, Neither a pipeline override nor `default_model` yields a model., LLMProvider, ModelT, Protocol, A chat-completion backend (Ollama, OpenAI-compatible, Anthropic)., Run a completion constrained to `schema`; raise on invalid output. (+24 more)

### Community 70 - "What You Must Do When Invoked"

Cohesion: 0.07
Nodes (26): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+18 more)

### Community 71 - "web-jobs/src/components/shell/topbar.tsx"

Cohesion: 0.07
Nodes (38): DENSITY_OPTIONS, DensityMode, DensityToggle(), getClientSnapshot(), getServerSnapshot(), readDensity(), subscribeToHydration(), DESIGN_OPTIONS (+30 more)

### Community 72 - "exports"

Cohesion: 0.05
Nodes (39): dependencies, @job-hunter/shared-ts, zod, description, devDependencies, @types/node, typescript, vitest (+31 more)

### Community 73 - "devDependencies"

Cohesion: 0.09
Nodes (23): devDependencies, eslint, eslint-config-prettier, eslint-plugin-jsdoc, @swc/core, @swc-node/register, @types/node, @types/pg (+15 more)

### Community 74 - "HttpScraperClient"

Cohesion: 0.07
Nodes (16): RawJob, RawJobOutcome, ScrapeTriggerResponse, SourceTestResult, FakeScraperClient, backoffDelayMs(), delay(), fetchWithRetry() (+8 more)

### Community 75 - "sources.controller.ts"

Cohesion: 0.13
Nodes (26): SourceTestStatus, ScrapeRunStatus, CreateSourceDto, ListRunsQueryDto, SetSourceEnabledDto, ApiProperty, ApiPropertyOptional, IsBoolean (+18 more)

### Community 76 - "Requirements"

Cohesion: 0.10
Nodes (20): Purpose, Requirement: Accessibility and motion baselines, Requirement: Dashboard layout with sidebar and topbar, Requirement: Design tokens and theme switching, Requirement: EN and UA localization, Requirement: Global command palette, Requirement: Typed API access layer, Requirements (+12 more)

### Community 77 - "FakeDb"

Cohesion: 0.12
Nodes (39): _client(), _client_with_fetcher(), _fake_fetchers(), FakeDb, FakeFetcher, Any, Exception, API tests for the scrape/run endpoints (fake DB wired into app state). (+31 more)

### Community 78 - "settings.response.dto.ts"

Cohesion: 0.39
Nodes (5): AutomationSettingsResponse, EmailSettingsResponse, NotificationSettingsResponse, TelegramSettingsResponse, ApiProperty

### Community 79 - "JobsService"

Cohesion: 0.10
Nodes (20): JobsController, ApiBody, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags (+12 more)

### Community 80 - "ADDED Requirements"

Cohesion: 0.10
Nodes (19): ADDED Requirements, Requirement: Accessibility and motion baselines, Requirement: Dashboard layout with sidebar and topbar, Requirement: Design tokens and theme switching, Requirement: EN and UA localization, Requirement: Global command palette, Requirement: Typed API access layer, Scenario: API error surfaces meaningfully (+11 more)

### Community 81 - "2026-08-06-fix-jobs-posted-sort-order/proposal.md"

Cohesion: 0.29
Nodes (6): Capabilities, Impact, Modified Capabilities, New Capabilities, What Changes, Why

### Community 82 - "LlmAdminController"

Cohesion: 0.15
Nodes (16): LlmAdminController, ApiBody, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags, Body (+8 more)

### Community 83 - "Requirement: Filterable jobs table"

Cohesion: 0.29
Nodes (6): MODIFIED Requirements, Requirement: Filterable jobs table, Scenario: Default listing, Scenario: Posted order remains continuous across pages, Scenario: Sorting by Posted uses the displayed fallback date, Scenario: Sorting by score

### Community 84 - "2026-08-06-llm-prompt-injection-guardrails/proposal.md"

Cohesion: 0.29
Nodes (6): Capabilities, Impact, Modified Capabilities, New Capabilities, What Changes, Why

### Community 85 - "fetchers/**init**.py"

Cohesion: 0.04
Nodes (67): AsyncBaseTransport, asyncio, RuntimeError, Fetch the first configured subreddit's listing, for connectivity testing., Fetch the RSS feed once, for connectivity testing. Unlike :meth:`discover`, a…, AgentBrowserFetcher, _extract_text(), agent-browser subprocess fetcher for JS-heavy, non-API sources. Only Upwork is… (+59 more)

### Community 86 - "test_agent_browser.py"

Cohesion: 0.27
Nodes (12): _fetcher(), _gate(), Tests for :class:`AgentBrowserFetcher`. Exercises real subprocesses (using this…, Build a fetcher whose "CLI" is this interpreter running `script`., test_empty_output_raises_unavailable(), test_json_field_priority_prefers_html_over_others(), test_json_output_with_html_field_is_extracted(), test_missing_command_raises_unavailable() (+4 more)

### Community 87 - "test_db.py"

Cohesion: 0.14
Nodes (13): FakeConnection, FakeCursor, FakePool, Any, Focused persistence regressions for raw-job date backfills., Minimal async cursor carrying rowcount and one optional row., Return the configured row., Record SQL issued by `Database.insert_raw`. (+5 more)

### Community 88 - "HttpLlmAdminClient"

Cohesion: 0.20
Nodes (3): HttpLlmAdminClient, mapProvider(), Injectable

### Community 89 - ".save"

Cohesion: 0.11
Nodes (20): CoverLettersController, ApiBody, ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags (+12 more)

### Community 90 - ".claude/skills/openspec-explore/SKILL.md"

Cohesion: 0.18
Nodes (10): Check for context, Ending Discovery, Guardrails, Handling Different Entry Points, OpenSpec Awareness, The Stance, What You Don't Have To Do, What You Might Do (+2 more)

### Community 91 - ".addBulk"

Cohesion: 0.14
Nodes (14): ReactionsController, ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags (+6 more)

### Community 92 - "Decisions"

Cohesion: 0.11
Nodes (17): Context, D10. Error/loading states, D1. Data fetching: typed fetch wrapper + TanStack Query on the client, D2. Server vs client component split, D3. Theming: UI_DESIGN tokens as CSS variables + Tailwind v4 `@theme inline`, D4. i18n: next-intl with `[locale]` segment and proxy.ts, D5. Route and component structure, D6. Jobs table: TanStack Table v8, manual server-side everything (+9 more)

### Community 93 - "llm-admin.controller.ts"

Cohesion: 0.22
Nodes (17): CreateLlmProviderDto, PROVIDER_KINDS, SetActiveProviderDto, TestLlmProviderConnectionDto, ApiProperty, ApiPropertyOptional, IsIn, IsNotEmpty (+9 more)

### Community 94 - "postgres-job.repository.spec.ts"

Cohesion: 0.22
Nodes (4): CaptureDatabase, COUNT_METRICS, JobRow, QueryCall

### Community 95 - "explore.md"

Cohesion: 0.20
Nodes (9): Check for context, Ending Discovery, Guardrails, OpenSpec Awareness, The Stance, What You Don't Have To Do, What You Might Do, When a change exists (+1 more)

### Community 96 - "Decisions"

Cohesion: 0.11
Nodes (17): Context, D0 — The gateway calls scraper HTTP endpoints for `jobs_raw`, never SQL, D0b — Fixed a pre-existing scrape-trigger bug (`runId` never returned), D1 — Gateway is the single writer for `core.*`; llm stays compute-only, D2 — Poll-based chain, driven by an unprocessed-jobs feed, D3 — One scheduler workflow, per-source cadence as data, D4 — Notification dedup enforced by the DB, exposed via the gateway, D5 — Digest is a gateway query + app_settings watermark (+9 more)

### Community 97 - "Requirement: Jobs list pagination controls"

Cohesion: 0.05
Nodes (41): jobs-dashboard, Purpose, Requirement: Bulk stage actions, Requirement: Delete a vacancy from the jobs list, Requirement: Filter bar with URL-persisted state, Requirement: Filterable jobs table, Requirement: Jobs dashboard reconciliation strip, Requirement: Jobs list pagination controls (+33 more)

### Community 98 - "Data Model (Postgres 17, database `jobhunter`)"

Cohesion: 0.22
Nodes (8): Data Model (Postgres 17, database `jobhunter`), Filtering contract (API level), Indexes (beyond PKs/uniques), llm, llm.pipeline_runs, scraper, scraper.jobs_raw, scraper.scrape_runs

### Community 99 - "EscalatingFetcher"

Cohesion: 0.21
Nodes (14): EscalatingFetcher, Tries `primary` first; escalates to `secondary` on a JS shell. A host that…, Initialize the escalating fetcher. Args: primary: Cheap fetcher tried first…, Exception, Tests for :class:`EscalatingFetcher` (fake primary/secondary, no network)., Stand-in fetcher returning a canned result or raising a canned error., ScriptedFetcher, test_anti_bot_challenge_page_is_blocked_not_escalated() (+6 more)

### Community 100 - "web-settings/src/lib/formatters.ts"

Cohesion: 0.36
Nodes (7): CALENDAR_DATE_OPTIONS, DATE_OPTIONS, DATE_TIME_OPTIONS, formatDate(), formatNumber(), formatPostedDate(), formatSalary()

### Community 101 - "Decisions"

Cohesion: 0.12
Nodes (16): Context, D1 — `PageFetcher` port; adapters keep their parsers and shape, D2 — `PolitenessGate` extracted from `PoliteClient`, D3 — Strategy resolution in the registry, D4 — HTTP-first with JS-shell escalation; blocked is NEVER escalated, D4b — Anti-bot interstitials are blocked, never treated as a JS shell, D4c — Anti-bot-challenge detection also protects `agent-browser`, D5 — Crawl4aiFetcher: rendered raw HTML, our politeness, lazy import (+8 more)

### Community 102 - "README.md"

Cohesion: 0.18
Nodes (7): Coding Standards, Definition of Done (per feature), Git hygiene, Python (`services/scraper`, `services/llm`), SQL / migrations, TypeScript (`apps/web`, `apps/api`, `packages/*`), Universal

### Community 103 - "ADDED Requirements"

Cohesion: 0.12
Nodes (16): ADDED Requirements, jobs-dashboard, Requirement: Bulk stage actions, Requirement: Filter bar with URL-persisted state, Requirement: Filterable jobs table, Requirement: Keyboard-first row flow, Requirement: Row navigation to detail, Scenario: Bulk action failure (+8 more)

### Community 104 - "2026-07-23-jobs-bulk-delete/tasks.md"

Cohesion: 0.20
Nodes (9): 1. Fix: drawer/full-page closes immediately after single delete, 2. Backend: bulk-delete endpoint, 3. OpenAPI + shared-ts regeneration, 4. Frontend: API client, 5. Frontend: bulk action bar Delete control, 6. Frontend: wire bulk delete into the jobs page, 7. Localization, 8. Tests (+1 more)

### Community 105 - "scraper/tests/test_observability.py"

Cohesion: 0.07
Nodes (29): configure_logging(), _CorrelationIdLogFilter, CorrelationIdMiddleware, get_correlation_id(), ASGIApp, BaseHTTPMiddleware, LogRecord, Request (+21 more)

### Community 106 - "Requirement: Escalation only for JS shells, never for blocked responses"

Cohesion: 0.10
Nodes (20): fetch-strategy-ladder, Purpose, Requirement: Escalation only for JS shells, never for blocked responses, Requirement: Fetcher selection driven by source strategy, Requirement: Politeness is enforced identically for every fetcher, Requirements, Scenario: Anti-bot answer is not escalated, Scenario: Anti-bot challenge page is not escalated (+12 more)

### Community 107 - "2026-08-06-llm-prompt-injection-guardrails/design.md"

Cohesion: 0.33
Nodes (5): Context, Decisions, Goals / Non-Goals, Migration Plan, Risks / Trade-offs

### Community 108 - "Requirements"

Cohesion: 0.10
Nodes (19): job-detail, Purpose, Requirement: Cover letter viewing and editing, Requirement: Deleting from the detail view closes it immediately, Requirement: Job detail in drawer and full page, Requirement: Reaction timeline, Requirement: Stage change from detail, Requirements (+11 more)

### Community 109 - "Decisions"

Cohesion: 0.20
Nodes (9): Context, D1 — `DELETE /v1/sources/{slug}` on the gateway, reusing `DeletedResponse`, D2 — Single guarded `DELETE ... WHERE slug = $1 AND NOT EXISTS(dependents) RETURNING id`; repository returns a three-way result, D3 — `ConflictException` message includes what's blocking it, D4 — UI: per-row destructive icon action, `window.confirm`, no new dialog component, D5 — Cache invalidation on success, Decisions, Goals / Non-Goals (+1 more)

### Community 110 - "scripts"

Cohesion: 0.25
Nodes (8): scripts, build, dev, lint, start, test, test:watch, typecheck

### Community 111 - "Job Hunter"

Cohesion: 0.12
Nodes (16): Architecture at a glance, Dashboard (multi-zone Next.js), Features, Job Hunter, Methodologies, Notifications, Prerequisites, Quality bar (+8 more)

### Community 112 - "scripts"

Cohesion: 0.22
Nodes (9): scripts, build, dev, lint, openapi:emit, start, test, test:watch (+1 more)

### Community 114 - "app.module.ts"

Cohesion: 0.07
Nodes (26): PLACEHOLDER_ENV, AppModule, Module, BigIntSerializerInterceptor, serializeBigInts(), Injectable, API_CONFIG_NAMESPACE, ApiConfig (+18 more)

### Community 115 - "graphify reference: extra exports and benchmark"

Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 117 - "web-board/src/components/density-toggle.tsx"

Cohesion: 0.39
Nodes (7): DENSITY_OPTIONS, DensityMode, DensityToggle(), getClientSnapshot(), getServerSnapshot(), readDensity(), subscribeToHydration()

### Community 118 - "web-board/src/i18n/navigation.ts"

Cohesion: 0.36
Nodes (4): { Link, redirect, usePathname, useRouter, getPathname }, routing, config, proxy

### Community 128 - "JobReactionEvent"

Cohesion: 0.16
Nodes (8): JobReactionRepository, CurrentReaction, JobReactionEvent, mapCurrentRow(), mapEventRow(), PostgresJobReactionRepository, Injectable, FakeJobReactionRepository

### Community 129 - "Requirement: Escalation only for JS shells, never for blocked responses"

Cohesion: 0.13
Nodes (14): ADDED Requirements, fetch-strategy-ladder, Requirement: Escalation only for JS shells, never for blocked responses, Requirement: Fetcher selection driven by source strategy, Requirement: Politeness is enforced identically for every fetcher, Scenario: Anti-bot answer is not escalated, Scenario: Anti-bot challenge page is not escalated, Scenario: API-strategy source keeps plain HTTP (+6 more)

### Community 130 - "web-board/src/components/design-mode-toggle.tsx"

Cohesion: 0.39
Nodes (7): DESIGN_OPTIONS, DesignModeToggle(), DesignTheme, getClientSnapshot(), getServerSnapshot(), readTheme(), subscribeToHydration()

### Community 131 - "2026-08-06-fix-jobs-posted-sort-order/tasks.md"

Cohesion: 0.50
Nodes (3): 1. Correct the server-side Posted ordering, 2. Add regression coverage, 3. Verify and record the change

### Community 132 - "web-board/src/components/shell/topbar.tsx"

Cohesion: 0.32
Nodes (6): LocaleSwitch(), NAV_ITEMS, NavItem, activeLabelKey(), Topbar(), TopbarProps

### Community 133 - "ADDED Requirements"

Cohesion: 0.15
Nodes (12): ADDED Requirements, job-detail, Requirement: Cover letter viewing and editing, Requirement: Job detail in drawer and full page, Requirement: Reaction timeline, Requirement: Stage change from detail, Scenario: Editing a draft, Scenario: Full detail render (+4 more)

### Community 134 - "is_js_shell"

Cohesion: 0.29
Nodes (10): is_js_shell(), Detect whether `html` looks like a client-side-rendered shell. Args: html:…, Tests for the JS-shell detection heuristic (pure function, fixtures only)., test_content_probe_matching_empty_node_falls_through_to_threshold(), test_content_probe_not_found_falls_through_to_threshold(), test_content_probe_overrides_short_page(), test_custom_text_threshold(), test_react_shell_is_detected() (+2 more)

### Community 135 - "Requirements"

Cohesion: 0.12
Nodes (15): automation-api, Purpose, Requirement: Automation endpoint surface, Requirement: Notification ledger enforces once-per-channel, Requirement: Service-token authentication, Requirement: Workflows honor the configured channel state, Requirements, Scenario: Destination comes from settings (+7 more)

### Community 136 - "Requirement: Provider configuration"

Cohesion: 0.05
Nodes (39): llm-admin-ui, Purpose, Requirement: Add a custom provider, Requirement: Configuration hot-reload, Requirement: Connection test, Requirement: One-click active switch with confirm, Requirement: Provider cards, Requirement: Provider configuration (+31 more)

### Community 137 - "Requirements"

Cohesion: 0.06
Nodes (31): Purpose, Requirement: Card re-renders triggered by a drag stay cheap and bounded, Requirement: Cards can be manually ordered within a column, Requirement: Delete a vacancy from the board, Requirement: Drag and drop creates reaction events, Requirement: Kanban over reaction stages, Requirement: Keyboard-accessible drag and drop, Requirement: Pointer drops resolve to the target under the pointer (+23 more)

### Community 138 - "Jobs redesign — verification report"

Cohesion: 0.22
Nodes (8): 1. Hardcoded color / radius / shadow / font-family grep, 2. Screenshots, 3. Keyboard walkthrough, 4. Acceptance criteria checklist (steps 1–8), 5. Automated verification, 6. Closed this pass, 7. Remaining / deferred, Jobs redesign — verification report

### Community 139 - "ADDED Requirements"

Cohesion: 0.18
Nodes (10): ADDED Requirements, llm-admin-ui, Requirement: Connection test, Requirement: One-click active switch with confirm, Requirement: Provider cards, Scenario: Failed test, Scenario: Successful test, Scenario: Switch failure (+2 more)

### Community 140 - "ADDED Requirements"

Cohesion: 0.18
Nodes (10): ADDED Requirements, Requirement: Drag and drop creates reaction events, Requirement: Kanban over reaction stages, Requirement: Keyboard-accessible drag and drop, Scenario: Board reflects current stages, Scenario: Failed move rolls back, Scenario: Keyboard move, Scenario: Rejected collapsed (+2 more)

### Community 141 - "ADDED Requirements"

Cohesion: 0.18
Nodes (10): ADDED Requirements, automation-api, Requirement: Automation endpoint surface, Requirement: Notification ledger enforces once-per-channel, Requirement: Service-token authentication, Scenario: Duplicate record attempt, Scenario: Missing token rejected, Scenario: Results persist transactionally (+2 more)

### Community 142 - "Requirement: Poison jobs are marked failed after repeated attempts"

Cohesion: 0.15
Nodes (12): processing-chain, Purpose, Requirement: Idempotent, capped processing, Requirement: Poison jobs are marked failed after repeated attempts, Requirement: Unprocessed jobs are pushed through the LLM pipeline, Requirements, Scenario: Attempt limit is configurable, Scenario: Dead-lettered jobs are listable (+4 more)

### Community 143 - "Requirements"

Cohesion: 0.18
Nodes (10): Purpose, Requirement: Cron-driven scrape triggering, Requirement: Per-source cadence hint, Requirement: Scheduler failure handling, Requirements, Scenario: Disabled source is skipped, Scenario: Enabled sources are triggered on schedule, Scenario: One source down, others proceed (+2 more)

### Community 144 - "Tasks — Phase 5 Web app (NextJS dashboard)"

Cohesion: 0.20
Nodes (9): 1. API contract prerequisites (apps/api + shared-ts), 2. Web skeleton: deps, tokens, theming, 3. App shell and API client layer, 4. Jobs dashboard (`/jobs`), 5. Job detail (drawer + `/jobs/[id]`), 6. Stage board (`/board`), 7. Admin pages, 8. Quality gates, e2e, wrap-up (+1 more)

### Community 145 - "ADDED Requirements"

Cohesion: 0.20
Nodes (9): ADDED Requirements, processing-chain, Requirement: Idempotent, capped processing, Requirement: Poison jobs are marked failed after repeated attempts, Requirement: Unprocessed jobs are pushed through the LLM pipeline, Scenario: Job fails repeatedly, Scenario: New scraped jobs get processed, Scenario: One failing job does not block the batch (+1 more)

### Community 146 - "ADDED Requirements"

Cohesion: 0.20
Nodes (9): ADDED Requirements, Requirement: Cron-driven scrape triggering, Requirement: Per-source cadence hint, Requirement: Scheduler failure handling, Scenario: Disabled source is skipped, Scenario: Enabled sources are triggered on schedule, Scenario: One source down, others proceed, Scenario: Source with a 4-hour cadence (+1 more)

### Community 147 - "crawl4ai-fetching"

Cohesion: 0.20
Nodes (9): crawl4ai-fetching, Purpose, Requirement: Browser-rendered fetching returns raw HTML, Requirement: crawl4ai is an optional dependency, Requirements, Scenario: JS-rendered listing becomes parseable, Scenario: One browser lifecycle per process, Scenario: Render timeout is bounded (+1 more)

### Community 148 - "Requirement: Dictionary CRUD"

Cohesion: 0.20
Nodes (9): dictionaries-editor, Purpose, Requirement: Dictionaries grouped by kind, Requirement: Dictionary CRUD, Requirements, Scenario: Adding a search term, Scenario: Deleting an item, Scenario: Disabling a stop-word (+1 more)

### Community 149 - "Requirements"

Cohesion: 0.06
Nodes (30): Purpose, Requirement: Adapter registry visibility, Requirement: Create a source, Requirement: Delete a source, Requirement: Edit a source, Requirement: Manual scrape trigger, Requirement: Run history, Requirement: Sources list with enable toggle (+22 more)

### Community 150 - "Implementation sequence"

Cohesion: 0.14
Nodes (13): 1. Shared shell and responsive frame — P0, 2. Jobs dashboard fidelity — P0, 3. Board correctness and fidelity — P0, 4. Detail and states polish — P1, 5. Settings cluster and provider telemetry — P1, 6. Per-item dictionary enablement — P1, separate data slice, 7. Fidelity and accessibility gate — P0 before merge, Current-state assessment (+5 more)

### Community 151 - "ADDED Requirements"

Cohesion: 0.22
Nodes (8): ADDED Requirements, crawl4ai-fetching, Requirement: Browser-rendered fetching returns raw HTML, Requirement: crawl4ai is an optional dependency, Scenario: JS-rendered listing becomes parseable, Scenario: One browser lifecycle per process, Scenario: Render timeout is bounded, Scenario: Service boots without the browser stack

### Community 152 - "Requirement: Dictionary CRUD"

Cohesion: 0.22
Nodes (8): ADDED Requirements, dictionaries-editor, Requirement: Dictionaries grouped by kind, Requirement: Dictionary CRUD, Scenario: Adding a search term, Scenario: Deleting an item, Scenario: Disabling a stop-word, Scenario: Viewing dictionaries

### Community 153 - "ADDED Requirements"

Cohesion: 0.22
Nodes (8): ADDED Requirements, Requirement: Manual scrape trigger, Requirement: Run history, Requirement: Sources list with enable toggle, Scenario: Disabling a source, Scenario: Inspecting recent runs, Scenario: Triggering a scrape, sources-admin

### Community 154 - "Tasks: phase-6-n8n-workflows"

Cohesion: 0.22
Nodes (8): 1. DB migration & config, 2. LLM service — cover-letter endpoint, 3. API gateway — automation module, 4. API gateway — cover-letter regenerate proxy, 5. Shared client & web, 6. n8n workflows, 7. Export, docs & gates, Tasks: phase-6-n8n-workflows

### Community 155 - "agent-browser-fallback"

Cohesion: 0.22
Nodes (8): agent-browser-fallback, Purpose, Requirement: Graceful degradation when the CLI is unavailable, Requirement: Subprocess fetcher behind a thin seam, Requirements, Scenario: CLI hangs, Scenario: CLI not installed, Scenario: Rendered content captured for a public page

### Community 156 - "email-digest"

Cohesion: 0.22
Nodes (8): email-digest, Purpose, Requirement: Daily digest email, Requirement: Failed send preserves the watermark, Requirements, Scenario: Daily digest with new activity, Scenario: Nothing new, Scenario: SMTP outage

### Community 157 - "match-notifications"

Cohesion: 0.22
Nodes (8): match-notifications, Purpose, Requirement: Send failures do not mark matches notified, Requirement: Telegram push for above-threshold matches, Requirements, Scenario: Below-threshold match is not pushed, Scenario: High-scoring match is pushed once, Scenario: Telegram API outage

### Community 158 - "Requirements"

Cohesion: 0.12
Nodes (15): profile-editor, Purpose, Requirement: Notifications section, Requirement: Profile form, Requirement: Secret status is shown without revealing secrets, Requirement: Unsaved changes protection, Requirements, Scenario: Configured secret (+7 more)

### Community 159 - "Requirement: Workflows exported and versioned"

Cohesion: 0.22
Nodes (8): Purpose, Requirement: Import/runbook documentation, Requirement: Workflows exported and versioned, Requirements, Scenario: Fresh n8n import, Scenario: No secrets in exports, Scenario: Operator follows the runbook, workflow-versioning

### Community 160 - "llm/tests/test_observability.py"

Cohesion: 0.07
Nodes (32): RetryCallState, configure_logging(), _CorrelationIdLogFilter, CorrelationIdMiddleware, get_correlation_id(), ASGIApp, BaseHTTPMiddleware, LogRecord (+24 more)

### Community 161 - "Requirement: Bulk stage actions"

Cohesion: 0.22
Nodes (8): MODIFIED Requirements, Requirement: Bulk stage actions, Scenario: Bulk action failure, Scenario: Bulk delete closes the open drawer, Scenario: Bulk delete failure, Scenario: Bulk delete removes selected rows, Scenario: Bulk delete requires arming before it fires, Scenario: Bulk mark applied

### Community 162 - "Proposal: phase-2-crawl4ai-fetch-ladder"

Cohesion: 0.25
Nodes (7): Capabilities, Impact, Modified Capabilities, New Capabilities, Proposal: phase-2-crawl4ai-fetch-ladder, What Changes, Why

### Community 163 - "ADDED Requirements"

Cohesion: 0.25
Nodes (7): ADDED Requirements, agent-browser-fallback, Requirement: Graceful degradation when the CLI is unavailable, Requirement: Subprocess fetcher behind a thin seam, Scenario: CLI hangs, Scenario: CLI not installed, Scenario: Rendered content captured for a public page

### Community 164 - "Phase 5 — Web app (NextJS dashboard)"

Cohesion: 0.25
Nodes (7): Capabilities, Impact, Modified Capabilities, New Capabilities, Phase 5 — Web app (NextJS dashboard), What Changes, Why

### Community 165 - "ADDED Requirements"

Cohesion: 0.25
Nodes (7): ADDED Requirements, profile-editor, Requirement: Profile form, Requirement: Unsaved changes protection, Scenario: Discard prompt, Scenario: Editing skills, Scenario: Invalid salary range

### Community 166 - "Proposal: phase-6-n8n-workflows"

Cohesion: 0.25
Nodes (7): Capabilities, Impact, Modified Capabilities, New Capabilities, Proposal: phase-6-n8n-workflows, What Changes, Why

### Community 167 - "ADDED Requirements"

Cohesion: 0.25
Nodes (7): ADDED Requirements, email-digest, Requirement: Daily digest email, Requirement: Failed send preserves the watermark, Scenario: Daily digest with new activity, Scenario: Nothing new, Scenario: SMTP outage

### Community 168 - "Requirement: Cover letter viewing and editing"

Cohesion: 0.25
Nodes (7): job-detail (delta), MODIFIED Requirements, Requirement: Cover letter viewing and editing, Scenario: Editing a draft, Scenario: Regenerate with unsaved edits, Scenario: Regenerating a draft, Scenario: Unsaved edit protection

### Community 169 - "ADDED Requirements"

Cohesion: 0.25
Nodes (7): ADDED Requirements, match-notifications, Requirement: Send failures do not mark matches notified, Requirement: Telegram push for above-threshold matches, Scenario: Below-threshold match is not pushed, Scenario: High-scoring match is pushed once, Scenario: Telegram API outage

### Community 170 - "ADDED Requirements"

Cohesion: 0.25
Nodes (7): ADDED Requirements, Requirement: Import/runbook documentation, Requirement: Workflows exported and versioned, Scenario: Fresh n8n import, Scenario: No secrets in exports, Scenario: Operator follows the runbook, workflow-versioning

### Community 171 - "Tasks: phase-2-crawl4ai-fetch-ladder"

Cohesion: 0.29
Nodes (6): 1. Refactor — port + politeness gate (behavior-identical), 2. Escalation ladder, 3. crawl4ai fetcher, 4. agent-browser fallback, 5. Verification, docs & close-out, Tasks: phase-2-crawl4ai-fetch-ladder

### Community 172 - "looks_like_anti_bot_challenge"

Cohesion: 0.26
Nodes (10): looks_like_anti_bot_challenge(), Anti-bot interstitial detection — keeps escalation from becoming evasion. The…, Detect a known anti-bot interstitial (Cloudflare-style challenge page). Args:…, Tests for anti-bot interstitial detection., test_cloudflare_browser_verification_marker_is_detected(), test_cloudflare_just_a_moment_is_detected(), test_detection_is_case_insensitive(), test_generic_enable_js_message_is_detected() (+2 more)

### Community 173 - "2026-07-23-jobs-bulk-delete/proposal.md"

Cohesion: 0.29
Nodes (6): Capabilities, Impact, Modified Capabilities, New Capabilities, What Changes, Why

### Community 174 - "KeywordDictionariesController"

Cohesion: 0.14
Nodes (16): KeywordDictionariesController, ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags (+8 more)

### Community 175 - "Requirement: Provider configuration"

Cohesion: 0.08
Nodes (25): ADDED Requirements, llm-admin-ui (delta), MODIFIED Requirements, Requirement: Add a custom provider, Requirement: Configuration hot-reload, Requirement: Connection test, Requirement: Provider configuration, Requirement: Provider model listing (+17 more)

### Community 176 - "Requirements"

Cohesion: 0.09
Nodes (21): jobs-reconciliation, Purpose, Requirement: Cross-source jobs reconciliation aggregate, Requirement: Dead-letter listing route, Requirement: Per-source jobs-health summary, Requirement: Public dead-letter listing, Requirement: Reconciliation data freshness, Requirement: Reconciliation endpoint error handling (+13 more)

### Community 177 - "Installation, Configuration & Deployment"

Cohesion: 0.08
Nodes (26): 10.1 Continuous integration (GitHub Actions), 10. Quality gates (per service), 1. Prerequisites, 2. Clone & install JS/TS dependencies, 3.1 Get a Postgres 17 instance, 3.2 Create the `jobhunter` database, 3.3 Configure `.env` for migrations, 3.4 Run migrations and seed data (+18 more)

### Community 178 - "ADDED Requirements"

Cohesion: 0.10
Nodes (20): ADDED Requirements, ADDED Requirements, Requirement: Cross-source jobs reconciliation aggregate, Requirement: Dead-letter listing route, Requirement: Per-source jobs-health summary, Requirement: Public dead-letter listing, Requirement: Reconciliation data freshness, Requirement: Reconciliation endpoint error handling (+12 more)

### Community 179 - "ADDED Requirements"

Cohesion: 0.10
Nodes (19): ADDED Requirements, MODIFIED Requirements, Requirement: Adapter registry visibility, Requirement: Create a source, Requirement: Edit a source, Requirement: Sources list with enable toggle, Requirement: Test source connectivity, Scenario: Adding a valid source (+11 more)

### Community 180 - "Requirement: Provider configuration"

Cohesion: 0.10
Nodes (19): ADDED Requirements, llm-admin-ui (delta), MODIFIED Requirements, Requirement: Provider configuration, Requirement: Provider deletion, Scenario: Active provider is protected, Scenario: Browsing the list with a value already saved, Scenario: Cancelling at the confirmation (+11 more)

### Community 181 - "delete-source/proposal.md"

Cohesion: 0.29
Nodes (6): Capabilities, Impact, Modified Capabilities, New Capabilities, What Changes, Why

### Community 182 - "Job"

Cohesion: 0.07
Nodes (32): DateField, JOB_REPOSITORY, JobFilter, JobRepository, JobSortBy, PaginatedJobs, SortDir, FakeJobRepository (+24 more)

### Community 183 - "ReactionsService"

Cohesion: 0.12
Nodes (12): BoardController, ApiBody, ApiNoContentResponse, ApiOperation, ApiTags, Body, Controller, HttpCode (+4 more)

### Community 184 - "1. App shell"

Cohesion: 0.18
Nodes (11): 1. App shell, Accessibility notes, Animation / motion, Components, Design tokens used, Edge cases, Implementation status, Layout (+3 more)

### Community 185 - "Decisions"

Cohesion: 0.12
Nodes (15): Context, D1 — Test builds the adapter per-request, without touching the active row, D2 — `list_models()` joins the provider port, D3 — `PATCH /providers/{slug}` with the same NOTIFY discipline as `set_active`, D4 — `POST /providers` creates inactive; no NOTIFY on create, D5 — API key stays an env-var _name_; raw values are never accepted, D6 — Gateway stays a dumb proxy; old test endpoint removed, D7 — Two dialogs, both following the `SourceFormDialog` pattern (+7 more)

### Community 186 - "Decisions"

Cohesion: 0.12
Nodes (15): Context, D1 — Secrets stay in the environment; the DB stores the variable name, D2 — A typed singleton table, not another `app_settings` key, D3 — Integer positions rewritten in full, not fractional indexing, D4 — Ordering surfaces through the existing sort allowlist, D5 — `stage` on the position row is advisory, never authoritative, D6 — Configuration reaches n8n by fetch, not by redeploy, D7 — Env-presence is a computed field, not a test endpoint (+7 more)

### Community 187 - "Requirement: Delete a source"

Cohesion: 0.29
Nodes (6): ADDED Requirements, Requirement: Delete a source, Scenario: Cancelling at the confirmation, Scenario: Deleting an unused source, Scenario: Source with data is protected, Scenario: Unknown slug

### Community 188 - "graphify reference: query, path, explain"

Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 189 - "Decisions"

Cohesion: 0.13
Nodes (14): Context, D1 — Test lives on the scraper, proxied by the gateway, D2 — Slug is immutable after create, D3 — Adapter awareness via `GET /adapters`, fetched separately, D4 — Config edited as raw JSON text, D5 — One dialog component for create and edit, D6 — Test UX is per-row inline state, not a toast, D7 — Repository/port extensions, not a new module (+6 more)

### Community 190 - "Decisions"

Cohesion: 0.13
Nodes (14): Context, D1 — Correlation id: header `X-Correlation-Id`, minted at the edge, adopted downstream, D2 — Gateway propagation via `nestjs-cls`, not request-scoped clients, D3 — Python: stdlib logging + JSON formatter + ASGI middleware + `contextvar`, D4 — Coverage: measure first, scope to domain/application, ratchet, D5 — Rate limiting: `@nestjs/throttler` global guard, internal routes `@SkipThrottle`, D6 — Resilience: hand-rolled `fetchWithRetry` (gateway) + `tenacity` (llm), D7 — Per-source politeness: pass overrides at `acquire`, keep one gate (+6 more)

### Community 191 - "Requirement: Notification configuration is persisted and editable"

Cohesion: 0.13
Nodes (14): notification-settings, Purpose, Requirement: Matching and digest scalars are editable through the same surface, Requirement: Notification configuration is persisted and editable, Requirement: Secrets are referenced by environment variable, never stored, Requirements, Scenario: Invalid port rejected, Scenario: Missing environment variable is visible (+6 more)

### Community 192 - "Requirement: Jobs list pagination controls"

Cohesion: 0.18
Nodes (10): ADDED Requirements, Requirement: Jobs list pagination controls, Scenario: Changing a filter returns to the first page, Scenario: Changing page size resets to the first page, Scenario: Default page size, Scenario: Navigating to the next page, Scenario: Next is disabled on the last page, Scenario: No results hides the controls (+2 more)

### Community 193 - "web-jobs/src/app/[locale]/layout.tsx"

Cohesion: 0.05
Nodes (34): nextConfig, withNextIntl, nextConfig, withNextIntl, geistSans, jetbrainsMono, metadata, createQueryClient() (+26 more)

### Community 194 - "Decisions"

Cohesion: 0.14
Nodes (13): Context, D1 — Rebuild `ModelCombobox` as a canonical shadcn combobox (button trigger + `CommandInput`), D2 — Not-in-list warning, not validation error, D3 — `DELETE /providers/{slug}` on the LLM service; 409 guards the active row, D4 — Gateway: standard proxy + existing `LlmServiceError` mapping, D5 — UI: Delete lives in the Configure dialog, `window.confirm`, disabled for active, D6 — Debris cleanup happens through the shipped feature, not SQL, Decisions (+5 more)

### Community 195 - "ADDED Requirements"

Cohesion: 0.14
Nodes (13): ADDED Requirements, notification-settings, Requirement: Matching and digest scalars are editable through the same surface, Requirement: Notification configuration is persisted and editable, Requirement: Secrets are referenced by environment variable, never stored, Scenario: Invalid port rejected, Scenario: Missing environment variable is visible, Scenario: Only the variable name is writable (+5 more)

### Community 196 - "Decisions"

Cohesion: 0.14
Nodes (13): Context, D1 — Read reconciliation from the gateway, not the scraper, D2 — One new `reconciliation` module, not extensions on `sources` and `jobs`, D3 — One SQL query, two bucket definitions, D4 — Web client: one query per page, keyed independently, D5 — "Failed" bucket links to the existing dead-letter listing, D6 — No new tests for the SQL query itself beyond the repository unit test, D7 — Translations follow the existing namespace structure (+5 more)

### Community 197 - "BulkReactionsDto"

Cohesion: 0.19
Nodes (18): JobReaction, AppendReactionDto, BOARD_STAGE_VALUES, BulkReactionsDto, JOB_REACTION_VALUES, SetBoardOrderDto, ApiProperty, ApiPropertyOptional (+10 more)

### Community 198 - "getServerApiBaseUrl"

Cohesion: 0.08
Nodes (28): DELETE, GET, PATCH, POST, ProxyContext, proxyRequest(), PUT, shouldTrustIncomingProxyHeaders() (+20 more)

### Community 199 - "Requirement: Cards can be manually ordered within a column"

Cohesion: 0.15
Nodes (12): ADDED Requirements, MODIFIED Requirements, Requirement: Cards can be manually ordered within a column, Requirement: Drag and drop creates reaction events, Scenario: Cross-column drop lands at the drop index, Scenario: Failed move rolls back, Scenario: Failed reorder rolls back, Scenario: Reorder persists (+4 more)

### Community 200 - "Tasks — notification settings + board card reordering"

Cohesion: 0.15
Nodes (12): 10. Environment + documentation, 11. Final verification, 1. Database, 2. Gateway — settings module (notification configuration), 3. Gateway — automation settings endpoint (n8n feed), 4. Gateway — board ordering, 5. OpenAPI + generated client, 6. Web — API clients (+4 more)

### Community 201 - "Requirement: Correlation id is propagated end to end"

Cohesion: 0.15
Nodes (12): observability, Purpose, Requirement: Correlation id is propagated end to end, Requirement: Structured JSON logs in every service, Requirements, Scenario: A malformed id is rejected rather than trusted, Scenario: Browser call through the web proxy carries an id, Scenario: Id crosses a service hop (+4 more)

### Community 202 - "source-command-opsx-explore"

Cohesion: 0.17
Nodes (11): Check for context, Command Template, Ending Discovery, Guardrails, OpenSpec Awareness, source-command-opsx-explore, The Stance, What You Don't Have To Do (+3 more)

### Community 203 - "Requirement: Pointer drops resolve to the target under the pointer"

Cohesion: 0.18
Nodes (10): ADDED Requirements, Requirement: Card re-renders triggered by a drag stay cheap and bounded, Requirement: Pointer drops resolve to the target under the pointer, Scenario: Drag-start re-renders of other-column cards stay bounded, Scenario: Drop near a column boundary lands in the pointed-at column, Scenario: Drop on a card lands at that card's index, Scenario: Drop on empty column space lands at the end, Scenario: Keyboard drags are unchanged (+2 more)

### Community 204 - "web-settings/src/components/density-toggle.tsx"

Cohesion: 0.39
Nodes (7): DENSITY_OPTIONS, DensityMode, DensityToggle(), getClientSnapshot(), getServerSnapshot(), readDensity(), subscribeToHydration()

### Community 205 - "jobs-route-bundle.mjs"

Cohesion: 0.26
Nodes (11): buildWebApplication(), controlledEnvironment(), evaluatorDirectory, extractJavaScriptPaths(), main(), measureAssets(), nextBinary, port (+3 more)

### Community 206 - "test_provider_retry.py"

Cohesion: 0.29
Nodes (12): MonkeyPatch, Provider adapters (infrastructure layer) implementing the `LLMProvider` port., _FakeSettings, _patch_settings(), MockTransport, Tests for the provider-adapter retry policy (base.post_json/get_json/probe).…, Serve `statuses` in order, one per request; repeats the last for extras., _sequenced_transport() (+4 more)

### Community 207 - "2026-07-22-simplify-static-html-adapters/design.md"

Cohesion: 0.17
Nodes (11): Context, D1. Share mechanics through one concrete static-HTML adapter, D2. Register factories and content probes as explicit metadata, D3. Preserve source modules as compatibility and repair seams, D4. Treat existing outputs as the migration contract, D5. Document rejected review recommendations, Decisions, Goals / Non-Goals (+3 more)

### Community 208 - "2026-07-22-sources-jobs-count-discrepancy/tasks.md"

Cohesion: 0.17
Nodes (11): 10. Web: gates + Playwright regressions, 11. Live verification + wiki checkpoint, 1. Gateway: reconciliation module scaffold, 2. Gateway: reconciliation repository, 3. Gateway: service + controller + DTOs, 4. Gateway: OpenAPI + shared-ts regeneration, 5. Gateway: unit tests, 6. Web: reconciliation API client (+3 more)

### Community 209 - "Requirement: Public gateway endpoints are rate limited"

Cohesion: 0.17
Nodes (11): api-rate-limiting, Purpose, Requirement: Internal automation routes are exempt from rate limiting, Requirement: Public gateway endpoints are rate limited, Requirements, Scenario: Automation is not throttled, Scenario: Over the limit, Scenario: The web proxy forwards X-Forwarded-For only when its own trust flag is set (+3 more)

### Community 210 - "Requirement: Bulk-delete multiple vacancies"

Cohesion: 0.33
Nodes (5): ADDED Requirements, Requirement: Bulk-delete multiple vacancies, Scenario: Bulk delete with all existing ids, Scenario: Bulk delete with an empty list, Scenario: Bulk delete with some already-missing ids

### Community 211 - ".agents/skills/openspec-explore/SKILL.md"

Cohesion: 0.18
Nodes (10): Check for context, Ending Discovery, Guardrails, Handling Different Entry Points, OpenSpec Awareness, The Stance, What You Don't Have To Do, What You Might Do (+2 more)

### Community 212 - "Requirement: Deleting from the detail view closes it immediately"

Cohesion: 0.33
Nodes (5): ADDED Requirements, Requirement: Deleting from the detail view closes it immediately, Scenario: Delete failure leaves the view open, Scenario: Drawer closes right after a successful delete, Scenario: Full-page detail navigates away right after a successful delete

### Community 213 - "Tasks — Phase 7 Hardening"

Cohesion: 0.18
Nodes (10): 1. Observability — Python services (scraper + llm), 2. Observability — gateway + web propagation, 3. Coverage gates — measure, scope, ratchet, 4. API rate limiting, 5. Per-source politeness, 6. Request resilience — retry with backoff, 7. Dead-letter — configurable limit + inspection endpoint, 8. E2e happy path in CI (+2 more)

### Community 214 - "2026-07-20-delete-job/design.md"

Cohesion: 0.18
Nodes (10): Context, Decisions, Goals / Non-Goals, Invalidate shared job and board queries after success, Migration Plan, Open Questions, Rely on existing foreign-key cascades inside the repository transaction, Risks / Trade-offs (+2 more)

### Community 215 - "Requirement: Automation endpoint surface"

Cohesion: 0.18
Nodes (10): ADDED Requirements, automation-api, MODIFIED Requirements, Requirement: Automation endpoint surface, Requirement: Workflows honor the configured channel state, Scenario: Destination comes from settings, Scenario: Disabled channel sends nothing, Scenario: Results persist transactionally (+2 more)

### Community 216 - "test_adapters.py"

Cohesion: 0.04
Nodes (71): date, parse_ukrainian_calendar_date(), datetime, Calendar-date parsing shared by Ukrainian job-board adapters., Parse a Ukrainian calendar date into UTC midnight. Both a bare DOU date (``5…, parse_detail_posted_at(), parse_list(), parse_posted_at() (+63 more)

### Community 217 - "Requirement: Transient cross-service calls are retried with backoff"

Cohesion: 0.18
Nodes (10): Purpose, request-resilience, Requirement: Retry attempts are observable, Requirement: Transient cross-service calls are retried with backoff, Requirements, Scenario: A large Retry-After is capped, Scenario: A retried call leaves a trail, Scenario: Non-transient failure is not retried (+2 more)

### Community 218 - "app.throttling.spec.ts"

Cohesion: 0.22
Nodes (7): InternalController, PublicController, ThrottlingTestModule, Controller, Get, Module, SkipThrottle

### Community 219 - "find_injection_signals"

Cohesion: 0.19
Nodes (15): find_injection_signals(), Heuristic prompt-injection detection for composed pipeline prompts. Patterns…, Return the labels of every injection pattern matched in `text`. Empty list…, Tests for the prompt-injection detection heuristics. Patterns must fire on…, A bare opening `<user>`/`<system>` tag is ordinary placeholder syntax in…, test_clean_ai_ml_posting_is_not_flagged(), test_dan_jailbreak_detected(), test_disregard_prior_instructions_detected() (+7 more)

### Community 220 - "Requirement: Correlation id is propagated end to end"

Cohesion: 0.20
Nodes (9): ADDED Requirements, Requirement: Correlation id is propagated end to end, Requirement: Structured JSON logs in every service, Scenario: Browser call through the web proxy carries an id, Scenario: Id crosses a service hop, Scenario: Id is adopted from the caller, Scenario: Id originates at the edge and is echoed, Scenario: Log level is configurable (+1 more)

### Community 221 - "Requirement: Notifications section"

Cohesion: 0.20
Nodes (9): ADDED Requirements, profile-editor, Requirement: Notifications section, Requirement: Secret status is shown without revealing secrets, Scenario: Configured secret, Scenario: Editing a chat id, Scenario: Invalid port blocked inline, Scenario: Missing secret (+1 more)

### Community 222 - "Requirement: Bulk-delete multiple vacancies"

Cohesion: 0.14
Nodes (13): job-deletion, Purpose, Requirement: Bulk-delete multiple vacancies, Requirement: Delete a normalized vacancy, Requirement: Preserve deletion semantics across retries, Requirements, Scenario: Bulk delete with all existing ids, Scenario: Bulk delete with an empty list (+5 more)

### Community 223 - "quality-gates"

Cohesion: 0.20
Nodes (9): Purpose, quality-gates, Requirement: CI enforces coverage and the e2e happy path, Requirement: Test coverage is measured and gated, Requirements, Scenario: Coverage at or above threshold passes, Scenario: Coverage below threshold fails the suite, Scenario: Coverage gate runs in CI (+1 more)

### Community 224 - "2. Jobs dashboard (`/jobs` — primary surface)"

Cohesion: 0.18
Nodes (11): 2. Jobs dashboard (`/jobs` — primary surface), Accessibility notes, Animation / motion, Components, Design tokens used, Edge cases, Implementation status, Layout (+3 more)

### Community 225 - "delete-source/tasks.md"

Cohesion: 0.33
Nodes (5): 1. Contract preparation, 2. Gateway source deletion, 3. OpenAPI and shared client, 4. Sources list deletion UX, 5. Final verification and documentation

### Community 226 - "api/package.json"

Cohesion: 0.40
Nodes (4): description, name, private, version

### Community 227 - "llm/main.py"

Cohesion: 0.05
Nodes (54): AsyncConnectionPool, get_settings(), BaseSettings, Runtime configuration for the LLM service. Settings come from environment…, LLM service settings read from the environment., Return the cached settings singleton., Settings, CredentialCipher (+46 more)

### Community 228 - "devDependencies"

Cohesion: 0.07
Nodes (29): devDependencies, eslint, eslint-config-next, eslint-plugin-jsdoc, jsdom, tailwindcss, @tailwindcss/postcss, @testing-library/jest-dom (+21 more)

### Community 229 - "2026-07-23-jobs-bulk-delete/design.md"

Cohesion: 0.40
Nodes (4): Context, Decisions, Goals / Non-Goals, Risks / Trade-offs

### Community 230 - "devDependencies"

Cohesion: 0.05
Nodes (43): dependencies, @job-hunter/shared-ts, @job-hunter/web-api, @job-hunter/web-ui, next, react, react-dom, description (+35 more)

### Community 231 - "graphify reference: add a URL and watch a folder"

Cohesion: 0.50
Nodes (3): For /graphify add, For --watch, graphify reference: add a URL and watch a folder

### Community 232 - "Proposal: sources-page-crud"

Cohesion: 0.25
Nodes (7): Capabilities, Impact, Modified Capabilities, New Capabilities, Proposal: sources-page-crud, What Changes, Why

### Community 233 - "Proposal: llm-provider-delete-and-model-picker"

Cohesion: 0.25
Nodes (7): Capabilities, Impact, Modified Capabilities, New Capabilities, Proposal: llm-provider-delete-and-model-picker, What Changes, Why

### Community 234 - "Proposal: llm-settings-config"

Cohesion: 0.25
Nodes (7): Capabilities, Impact, Modified Capabilities, New Capabilities, Proposal: llm-settings-config, What Changes, Why

### Community 235 - "ADDED Requirements"

Cohesion: 0.25
Nodes (7): ADDED Requirements, Requirement: CI enforces coverage and the e2e happy path, Requirement: Test coverage is measured and gated, Scenario: Coverage at or above threshold passes, Scenario: Coverage below threshold fails the suite, Scenario: Coverage gate runs in CI, Scenario: E2e happy path runs in CI

### Community 236 - "Requirement: Transient cross-service calls are retried with backoff"

Cohesion: 0.25
Nodes (7): ADDED Requirements, Requirement: Retry attempts are observable, Requirement: Transient cross-service calls are retried with backoff, Scenario: A retried call leaves a trail, Scenario: Non-transient failure is not retried, Scenario: Retries are bounded, Scenario: Transient failure then success

### Community 237 - "Requirement: Delete a normalized vacancy"

Cohesion: 0.25
Nodes (7): ADDED Requirements, Requirement: Delete a normalized vacancy, Requirement: Preserve deletion semantics across retries, Scenario: Delete an existing vacancy, Scenario: Delete an unknown vacancy, Scenario: Dependent cleanup is atomic, Scenario: Repeated delete request

### Community 238 - "Notification settings + board card reordering"

Cohesion: 0.25
Nodes (7): Capabilities, Impact, Modified Capabilities, New Capabilities, Notification settings + board card reordering, What Changes, Why

### Community 239 - "Requirement: Fetcher selection driven by source strategy"

Cohesion: 0.25
Nodes (7): MODIFIED Requirements, Requirement: Fetcher selection driven by source strategy, Scenario: API-strategy source keeps plain HTTP, Scenario: Browser-strategy source without browser stack installed, Scenario: Non-static source has no HTML content probe, Scenario: Shared mechanics preserve source-specific searches, Scenario: Static source wires its content probe explicitly

### Community 240 - "Tasks: sources-page-crud"

Cohesion: 0.29
Nodes (6): 1. Scraper service — adapter list + test endpoint, 2. Gateway — CRUD + proxy endpoints, 3. Contract — OpenAPI + generated client, 4. Web — Add / Edit / Test on the sources page, 5. Verification & docs, Tasks: sources-page-crud

### Community 241 - "Tasks: llm-settings-config"

Cohesion: 0.29
Nodes (6): 1. LLM service — model listing, per-provider test, create, config PATCH, 2. Gateway — create + proxy endpoints, old test removed, 3. Contract — OpenAPI + generated client, 4. Web — add provider, real per-provider test, Configure dialog, 5. Verification & docs, Tasks: llm-settings-config

### Community 242 - "2026-07-19-phase-7-hardening/proposal.md"

Cohesion: 0.29
Nodes (6): Capabilities, Impact, Modified Capabilities, New Capabilities, What Changes, Why

### Community 243 - "ADDED Requirements"

Cohesion: 0.29
Nodes (6): ADDED Requirements, Requirement: Internal automation routes are exempt from rate limiting, Requirement: Public gateway endpoints are rate limited, Scenario: Automation is not throttled, Scenario: Over the limit, Scenario: Under the limit

### Community 244 - "Requirement: Politeness is enforced identically for every fetcher"

Cohesion: 0.29
Nodes (6): MODIFIED Requirements, Requirement: Politeness is enforced identically for every fetcher, Scenario: Browser render obeys the per-domain delay, Scenario: Missing per-source politeness falls back to defaults, Scenario: Robots deny blocks all transports, Scenario: Source-specific delay overrides the default

### Community 245 - "2026-07-20-delete-job/proposal.md"

Cohesion: 0.29
Nodes (6): Capabilities, Impact, Modified Capabilities, New Capabilities, What Changes, Why

### Community 246 - "2026-07-20-delete-job/tasks.md"

Cohesion: 0.29
Nodes (6): 1. Data ownership and contract preparation, 2. Gateway job deletion, 3. OpenAPI and shared client, 4. Jobs-list deletion UX, 5. Board deletion UX, 6. Final verification and documentation

### Community 247 - "2026-07-22-simplify-static-html-adapters/proposal.md"

Cohesion: 0.29
Nodes (6): Capabilities, Impact, Modified Capabilities, New Capabilities, What Changes, Why

### Community 248 - "2026-07-22-sources-jobs-count-discrepancy/proposal.md"

Cohesion: 0.29
Nodes (6): Capabilities, Impact, Modified Capabilities, New Capabilities, What Changes, Why

### Community 249 - "Requirement: Jobs dashboard reconciliation strip"

Cohesion: 0.29
Nodes (6): ADDED Requirements, Requirement: Jobs dashboard reconciliation strip, Scenario: Failed bucket is a deep link only when non-zero, Scenario: No scraping has happened yet, Scenario: Reconciliation endpoint failure is non-fatal, Scenario: Reconciliation strip renders below the metrics row

### Community 250 - "Requirement: Sources list with enable toggle"

Cohesion: 0.29
Nodes (6): MODIFIED Requirements, Requirement: Sources list with enable toggle, Scenario: Disabling a source, Scenario: Jobs-health summary distinguishes cumulative from per-run, Scenario: Reconciliation endpoint unavailable degrades gracefully, Scenario: Row actions are present

### Community 251 - "2026-07-23-improve-board-dnd-perf/proposal.md"

Cohesion: 0.25
Nodes (7): Capabilities, Impact, Implementation notes, Modified Capabilities, New Capabilities, What Changes, Why

### Community 252 - "3. Board (`/board` — reaction-stage kanban)"

Cohesion: 0.18
Nodes (11): 3. Board (`/board` — reaction-stage kanban), Accessibility notes, Animation / motion, Components, Design tokens used, Edge cases, Implementation status, Layout (+3 more)

### Community 253 - "graphify reference: commit hook and native CLAUDE.md integration"

Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 254 - "web-settings/src/i18n/navigation.ts"

Cohesion: 0.36
Nodes (4): { Link, redirect, usePathname, useRouter, getPathname }, routing, config, proxy

### Community 255 - "graphify reference: incremental update and cluster-only"

Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

### Community 256 - "Tasks: llm-provider-delete-and-model-picker"

Cohesion: 0.33
Nodes (5): 1. LLM service — delete endpoint (`services/llm`), 2. Gateway — proxy route (`apps/api` + `packages/shared-ts`), 3. Web — model combobox rebuild + warning + Delete (`apps/web`), 4. Live verification against the Docker stack (design D6), Tasks: llm-provider-delete-and-model-picker

### Community 257 - "Requirement: Poison jobs are marked failed after repeated attempts"

Cohesion: 0.33
Nodes (5): MODIFIED Requirements, Requirement: Poison jobs are marked failed after repeated attempts, Scenario: Attempt limit is configurable, Scenario: Dead-lettered jobs are listable, Scenario: Job fails repeatedly

### Community 258 - "Requirement: Delete a vacancy from the jobs list"

Cohesion: 0.33
Nodes (5): ADDED Requirements, Requirement: Delete a vacancy from the jobs list, Scenario: Cancel deletion from the list, Scenario: Confirm deletion from the list, Scenario: List deletion failure

### Community 259 - "Requirement: Delete a vacancy from the board"

Cohesion: 0.33
Nodes (5): ADDED Requirements, Requirement: Delete a vacancy from the board, Scenario: Board deletion failure, Scenario: Cancel deletion from the board, Scenario: Confirm deletion from the board

### Community 260 - "2026-07-22-simplify-static-html-adapters/tasks.md"

Cohesion: 0.33
Nodes (5): 1. Lock the behavior contract (Luna agent A), 2. Deepen the static-HTML adapter module (Luna agent A), 3. Make registry wiring explicit (Luna agent B, after section 2), 4. Documentation and architecture guardrails (Luna agent C), 5. Integrated verification and cleanup (coordinator)

### Community 261 - "2026-07-22-fix-board-cross-column-keyboard-drag/design.md"

Cohesion: 0.29
Nodes (6): Context, Decisions, Goals / Non-Goals, Migration Plan, Open Questions, Risks / Trade-offs

### Community 262 - "web-board/src/components/shell/command-palette.tsx"

Cohesion: 0.17
Nodes (13): CommandPalette(), CommandPaletteContext, CommandPaletteProvider(), CommandPaletteState, useCommandPalette(), useDebouncedValue(), DashboardShell(), DashboardShellProps (+5 more)

### Community 263 - "2026-07-22-fix-board-cross-column-keyboard-drag/proposal.md"

Cohesion: 0.29
Nodes (6): Capabilities, Impact, Modified Capabilities, New Capabilities, What Changes, Why

### Community 264 - "opencode.json"

Cohesion: 0.50
Nodes (3): plugin, $schema, .opencode/plugins/graphify.js

### Community 265 - "8. Component inventory"

Cohesion: 0.14
Nodes (14): 8. Component inventory, BoardCard, BoardColumn, BulkActionBar, DetailPane, FilterChipBar, FocusCard, JobCard (+6 more)

### Community 266 - "Autoresearch log"

Cohesion: 0.50
Nodes (3): Autoresearch log, Final checkpoint — 2026-07-20, Setup — 2026-07-20

### Community 271 - "web-board/src/components/shell/sidebar.tsx"

Cohesion: 0.06
Nodes (36): IN_MOTION_REACTIONS, LatestSourceRun, Sidebar(), SidebarProps, listJobsMock, listSourcesMock, useNavData(), makeJob() (+28 more)

### Community 272 - "4. Job detail (drawer + `/jobs/[id]`)"

Cohesion: 0.18
Nodes (11): 4. Job detail (drawer + `/jobs/[id]`), Accessibility notes, Animation / motion, Components, Design tokens used, Edge cases, Implementation status, Layout (+3 more)

### Community 273 - "web-settings/package.json"

Cohesion: 0.40
Nodes (4): description, name, private, version

### Community 274 - "web-settings/src/lib/hooks/use-keyboard-nav.ts"

Cohesion: 0.50
Nodes (4): isEditableTarget(), StageShortcut, useKeyboardNav(), UseKeyboardNavOptions

### Community 275 - "Q: Does this application uses Ollama as a current LLM provider?"

Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Does this application uses Ollama as a current LLM provider?, Source Nodes

### Community 276 - "Job Hunter redesign — coding-agent prompt pack"

Cohesion: 0.14
Nodes (13): Guardrails to paste into every prompt, Job Hunter redesign — coding-agent prompt pack, Step 0 — Orientation (read-only, run first), Step 1 — Token layer, Step 2 — Token migration sweep, Step 3 — ScoreMeter, StageBadge, JobRow, Step 4 — Detail pane and list/detail split, Step 5 — Keyboard triage, focus mode, bulk actions (+5 more)

### Community 284 - "compilerOptions"

Cohesion: 0.06
Nodes (34): compilerOptions, allowJs, esModuleInterop, exactOptionalPropertyTypes, incremental, isolatedModules, jsx, lib (+26 more)

### Community 286 - "web-settings/src/components/design-mode-toggle.tsx"

Cohesion: 0.39
Nodes (7): DESIGN_OPTIONS, DesignModeToggle(), DesignTheme, getClientSnapshot(), getServerSnapshot(), readTheme(), subscribeToHydration()

### Community 287 - "KeywordDictionary"

Cohesion: 0.14
Nodes (10): KeywordDictionaryRepository, ConflictError, NotFoundError, RepositoryError, FakeKeywordDictionariesService, KeywordDictionary, mapRow(), PostgresKeywordDictionaryRepository (+2 more)

### Community 288 - "AutomationService"

Cohesion: 0.10
Nodes (19): ApiSecurity, AutomationController, ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags (+11 more)

### Community 289 - "2026-07-22-jobs-list-pagination/proposal.md"

Cohesion: 0.29
Nodes (6): Capabilities, Impact, Modified Capabilities, New Capabilities, What Changes, Why

### Community 290 - "AGENTS.md"

Cohesion: 0.50
Nodes (3): graphify, LLM Wiki Approach, OpenSpec Workflow

### Community 291 - "2026-07-22-fix-board-cross-column-keyboard-drag/tasks.md"

Cohesion: 0.33
Nodes (5): 1. Confirm the failure mechanism, 2. Implement the board-specific coordinate getter, 3. Verify, 4. Close out, 5. Within-column test-isolation fix (discovered during 3.4's verification)

### Community 292 - "2026-07-22-jobs-list-pagination/tasks.md"

Cohesion: 0.33
Nodes (5): 1. Pagination component, 2. Wire into the jobs page, 3. Localization, 4. Tests, 5. Gates

### Community 293 - "2026-07-23-improve-board-dnd-perf/design.md"

Cohesion: 0.33
Nodes (5): Context, Decisions, Goals / Non-Goals, Open Questions, Risks / Trade-offs

### Community 294 - "2026-07-23-improve-board-dnd-perf/tasks.md"

Cohesion: 0.33
Nodes (5): 1. Collision detector + precision tests (D1, D3), 2. Render memoization (D2), 3. Render-count harness (D3), 4. Converge via /loop (D4), 5. Verify

### Community 295 - "compilerOptions"

Cohesion: 0.06
Nodes (34): compilerOptions, allowJs, esModuleInterop, exactOptionalPropertyTypes, incremental, isolatedModules, jsx, lib (+26 more)

### Community 296 - "web-settings/src/components/shell/topbar.tsx"

Cohesion: 0.32
Nodes (6): LocaleSwitch(), NAV_ITEMS, NavItem, activeLabelKey(), Topbar(), TopbarProps

### Community 297 - "Requirement: Keyboard-accessible drag and drop"

Cohesion: 0.40
Nodes (4): MODIFIED Requirements, Requirement: Keyboard-accessible drag and drop, Scenario: Keyboard move, Scenario: Keyboard move into an empty column

### Community 298 - "2026-07-22-jobs-list-pagination/design.md"

Cohesion: 0.40
Nodes (4): Context, Decisions, Goals / Non-Goals, Risks / Trade-offs

### Community 304 - "CreateKeywordDictionaryDto"

Cohesion: 0.24
Nodes (11): CreateKeywordDictionaryDto, IsDictionaryItems(), pipe, ApiProperty, ApiPropertyOptional, IsArray, IsBoolean, IsEnum (+3 more)

### Community 305 - "compilerOptions"

Cohesion: 0.06
Nodes (34): compilerOptions, allowJs, esModuleInterop, exactOptionalPropertyTypes, incremental, isolatedModules, jsx, lib (+26 more)

### Community 306 - "compilerOptions"

Cohesion: 0.06
Nodes (34): compilerOptions, allowJs, esModuleInterop, exactOptionalPropertyTypes, incremental, isolatedModules, jsx, lib (+26 more)

### Community 307 - "ProviderRow"

Cohesion: 0.08
Nodes (15): ProviderRow, Any, BaseModel, Return the single active registry row, if any., Return one registry row by slug, or `None` if unknown., Insert a new, inactive registry row. No `NOTIFY` — an inactive row can't be…, Update only the provided fields and broadcast `NOTIFY`.…, Activate `slug` and broadcast `NOTIFY llm_config_changed`. Raises:… (+7 more)

### Community 308 - "web-board/src/components/score-badge.tsx"

Cohesion: 0.40
Nodes (5): ScoreBadge(), ScoreBadgeProps, ScoreTier, TIER_CLASSES, tierFor()

### Community 309 - "devDependencies"

Cohesion: 0.07
Nodes (29): devDependencies, eslint, eslint-config-next, eslint-plugin-jsdoc, jsdom, tailwindcss, @tailwindcss/postcss, @testing-library/jest-dom (+21 more)

### Community 310 - "devDependencies"

Cohesion: 0.07
Nodes (29): devDependencies, eslint, eslint-config-next, eslint-plugin-jsdoc, jsdom, tailwindcss, @tailwindcss/postcss, @testing-library/jest-dom (+21 more)

### Community 312 - "web-board/src/components/theme-toggle.tsx"

Cohesion: 0.53
Nodes (5): getClientSnapshot(), getServerSnapshot(), subscribeToHydration(), THEME_OPTIONS, ThemeToggle()

### Community 313 - "dictionary-filters.ts"

Cohesion: 0.25
Nodes (11): appliesTo(), companyMatches(), CompiledFilterRules, compileFilterRules(), FILTER_DICTIONARY_KINDS, FilterableJob, isStringItems(), listItems() (+3 more)

### Community 316 - "0003_llm_settings_notifications.sql"

Cohesion: 0.22
Nodes (8): core.app_settings, core.llm_providers, core.notifications, llm.pipeline_runs, core.job_matches, core.jobs, core.set_updated_at, trg_llm_providers_updated_at

### Community 317 - "Jobs redesign — orientation audit"

Cohesion: 0.20
Nodes (9): 1. Stack in use, 2. `/en/jobs` render tree, 3. `/en/board` and DnD, 4. Fieldwork / Material theme toggle, 5. Hardcoded literals → semantic tokens (§7.1), 6. Spec vs existing constraints (conflicts — do not resolve here), `globals.css` (token definitions — migrate to §7.2), Jobs / board / shared UI (consume tokens, not hex) (+1 more)

### Community 318 - "0001_sources_and_jobs.sql"

Cohesion: 0.43
Nodes (6): core.jobs, core.sources, scraper.jobs_raw, scraper.scrape_runs, core.set_updated_at, trg_sources_updated_at

### Community 319 - "0002_profiles_matches_letters.sql"

Cohesion: 0.39
Nodes (7): core.cover_letters, core.job_matches, core.profiles, core.jobs, core.set_updated_at, trg_cover_letters_updated_at, trg_profiles_updated_at

### Community 320 - "0004_dictionaries_reactions.sql"

Cohesion: 0.29
Nodes (7): core.job_reaction_current, core.job_reactions, core.keyword_dictionaries, core.jobs, core.profiles, core.set_updated_at, trg_keyword_dictionaries_updated_at

### Community 321 - "KeywordDictionariesService"

Cohesion: 0.29
Nodes (8): KEYWORD_DICTIONARY_REPOSITORY, UpsertDictionaryInput, DictionaryKind, KeywordDictionaryResponse, ApiProperty, assertItemsMatchKind(), KeywordDictionariesService, Injectable

### Community 322 - "5. Settings cluster"

Cohesion: 0.18
Nodes (11): 5. Settings cluster, Accessibility notes, Animation / motion, Components, Design tokens used, Edge cases, Implementation status, Layout (+3 more)

### Community 323 - "core.job_board_position"

Cohesion: 0.40
Nodes (4): core.job_board_position, core.notification_settings, core.jobs, core.profiles

### Community 324 - "all_responses"

Cohesion: 0.08
Nodes (50): RunRecorder, PipelineRunRecord, A row for `llm.pipeline_runs` (observability, cost tracking)., ModelT, PipelineName, Run one pipeline call, record it in `llm.pipeline_runs`, return the model.…, _record(), run_structured() (+42 more)

### Community 327 - "design-sync notes — job-hunter"

Cohesion: 0.25
Nodes (7): design-sync notes — job-hunter, Fonts, Known render warns, Pre-existing repo issues found during this sync (NOT caused by it), Re-sync risks, The build loop — three commands, in this order, What the design system is here

### Community 340 - "Job Hunter — building with this design system"

Cohesion: 0.29
Nodes (6): An idiomatic composition, Job Hunter — building with this design system, Rules that are easy to get wrong, The styling idiom: semantic Tailwind utilities, Where the truth lives, Wrapping

### Community 341 - "6. States & dialogs"

Cohesion: 0.18
Nodes (11): 6. States & dialogs, Accessibility notes, Command palette, Delete confirm, Edge cases, Empty: filters match nothing, Empty: no jobs yet, Implementation status (+3 more)

### Community 364 - "Developer Handoff: Job Hunter Web App"

Cohesion: 0.50
Nodes (3): Design tokens, Developer Handoff: Job Hunter Web App, Shared foundation

### Community 367 - "web-api/src/index.ts"

Cohesion: 0.04
Nodes (82): DeadLetterPage(), CoverLetterEditor(), CoverLetterEditorProps, JobsDashboardSummary(), JobsDashboardSummaryProps, dynamic, ProviderFormBody(), formatDuration() (+74 more)

### Community 368 - "dependencies"

Cohesion: 0.08
Nodes (25): dependencies, class-variance-authority, @dnd-kit/sortable, @dnd-kit/utilities, @job-hunter/web-ui, next, next-intl, radix-ui (+17 more)

### Community 376 - "dependencies"

Cohesion: 0.08
Nodes (25): dependencies, class-variance-authority, clsx, cmdk, @job-hunter/web-api, @job-hunter/web-ui, next, next-intl (+17 more)

### Community 377 - "web-settings/src/components/theme-toggle.tsx"

Cohesion: 0.53
Nodes (5): getClientSnapshot(), getServerSnapshot(), subscribeToHydration(), THEME_OPTIONS, ThemeToggle()

### Community 378 - "UpdateNotificationSettingsDto"

Cohesion: 0.09
Nodes (21): SettingsController, ApiBody, ApiOkResponse, ApiOperation, ApiTags, Body, Controller, Get (+13 more)

### Community 381 - "Crawl4aiFetcher"

Cohesion: 0.16
Nodes (17): AsyncWebCrawler, Crawl4aiFetcher, Browser-rendered fetcher via crawl4ai's `AsyncWebCrawler`. The browser is…, Initialize the fetcher. Args: gate: Shared politeness gate (robots + per-host…, Close the underlying browser, if one was started., Lazily start (once) and return the underlying crawler. Raises:…, _gate(), Tests for :class:`Crawl4aiFetcher`. The crawl4ai call itself is isolated behind… (+9 more)

### Community 385 - "6. Board drag-and-drop performance"

Cohesion: 0.29
Nodes (7): 6.1 Transform-based DnD, 6.2 Cached geometry, 6.3 Virtualization, 6.4 Optimistic moves, 6.5 Keyboard DnD, 6.6 Column presentation, 6. Board drag-and-drop performance

### Community 386 - "exports"

Cohesion: 0.10
Nodes (20): exports, ./badge, ./button, ./checkbox, ./command, ./dialog, ./dropdown-menu, ./input (+12 more)

### Community 387 - "3. List + detail pane"

Cohesion: 0.33
Nodes (6): 3.1 List, 3.2 ScoreMeter, 3.3 Stage badge, 3.4 Detail pane, 3.5 Columns, 3. List + detail pane

### Community 388 - "Job Hunter — `/en/jobs` Redesign Specification"

Cohesion: 0.40
Nodes (4): 10. Out of scope, 5. Adaptivity, 9. Implementation order, Job Hunter — `/en/jobs` Redesign Specification

### Community 389 - "2. Triage speed"

Cohesion: 0.40
Nodes (5): 2.1 Focus mode, 2.2 Key map (shared by list, focus mode, and board), 2.3 Bulk actions, 2.4 Default queue, 2. Triage speed

### Community 390 - "7. Token system"

Cohesion: 0.40
Nodes (5): 7.1 Semantic tokens, 7.2 Values, 7.3 Theme character, 7.4 Migration rule, 7. Token system

### Community 391 - "1. Page shell"

Cohesion: 0.50
Nodes (4): 1.1 Zones, 1.2 Header, 1.3 Stat strip (replaces "Today's Triage"), 1. Page shell

### Community 392 - "4. Filters"

Cohesion: 0.50
Nodes (4): 4.1 Chip model, 4.2 Advanced panel, 4.3 Saved views, 4. Filters

### Community 393 - "RawJobRow"

Cohesion: 0.11
Nodes (13): DeadLetterRow, TypedDict, List raw jobs awaiting LLM processing, oldest first. Args: limit: Maximum rows…, List raw jobs that gave up after repeated processing failures. Args: limit:…, List recent scrape runs, newest first. Args: limit: Maximum number of rows.…, Row of `scraper.scrape_runs` joined with the source slug., Row of `scraper.jobs_raw` awaiting LLM processing., Row of `scraper.jobs_raw` that gave up after repeated processing failures. (+5 more)

### Community 395 - "reactions.module.ts"

Cohesion: 0.20
Nodes (9): BOARD_ORDER_REPOSITORY, BoardOrderRepository, AppendReactionInput, JOB_REACTION_REPOSITORY, PostgresBoardOrderRepository, Injectable, ReactionsModule, Module (+1 more)

### Community 396 - "web-board/src/app/[locale]/layout.tsx"

Cohesion: 0.17
Nodes (8): geistSans, jetbrainsMono, metadata, createQueryClient(), QueryProvider(), ThemeProvider(), Toaster(), THEME_BOOT_SCRIPT

### Community 398 - "ADDED Requirements"

Cohesion: 0.12
Nodes (16): ADDED Requirements, Purpose, Requirement: Application ownership map, Requirement: Locale prefix preserved, Requirement: Monolith cutover, Requirement: Multi-zones composition only, Requirement: Shared packages for UI and API, Scenario: Board path owned by board remote (+8 more)

### Community 400 - "Decisions"

Cohesion: 0.13
Nodes (14): Context, D1 — Composition = Next.js multi-zones / path rewrites (locked), D2 — Four apps (locked), D3 — Shared packages (locked), D4 — Locale preserved (locked), D5 — Nest API unchanged (locked), D6 — Phased delivery (locked task order), D7 — Ports (dev convention; adjust only if occupied) (+6 more)

### Community 401 - "compilerOptions"

Cohesion: 0.13
Nodes (14): compilerOptions, lib, module, moduleResolution, noEmit, types, extends, include (+6 more)

### Community 402 - "compilerOptions"

Cohesion: 0.13
Nodes (14): compilerOptions, jsx, lib, module, moduleResolution, noEmit, verbatimModuleSyntax, extends (+6 more)

### Community 403 - "jobs-client.tsx"

Cohesion: 0.04
Nodes (66): useJobsQuery(), dynamic, JobsPage(), JobsPageProps, { refreshMock }, FilterBarProps, FocusMode(), JobsClient() (+58 more)

### Community 404 - "devDependencies"

Cohesion: 0.15
Nodes (14): devDependencies, react, react-dom, @types/react, @types/react-dom, typescript, react, react-dom (+6 more)

### Community 405 - "Request"

Cohesion: 0.14
Nodes (14): _build_provider(), _credential_cipher(), _db(), _graph_deps(), BuildProvider, Request, Fetch the DB layer from app state., Fetch the provider resolver from app state. (+6 more)

### Community 406 - "scripts"

Cohesion: 0.15
Nodes (12): description, name, private, scripts, build, dev, lint, start (+4 more)

### Community 407 - "queryKeys"

Cohesion: 0.06
Nodes (35): dynamic, BOARD_STAGES, BoardStage, ALL_JOBS, APPLIED_JOB, INTERVIEW_JOB, renderCountsByScore, SAVED_JOB (+27 more)

### Community 408 - "provider-config-dialog.tsx"

Cohesion: 0.05
Nodes (55): SHORTCUT_GROUPS, ShortcutsDialog(), ShortcutsDialogProps, CommandPalette(), useDebouncedValue(), dynamic, LlmSettingsPageClient(), ConnectionTestState (+47 more)

### Community 409 - "dependencies"

Cohesion: 0.15
Nodes (13): dependencies, class-variance-authority, clsx, cmdk, lucide-react, radix-ui, tailwind-merge, class-variance-authority (+5 more)

### Community 413 - "web-board/src/lib/formatters.ts"

Cohesion: 0.31
Nodes (7): CALENDAR_DATE_OPTIONS, DATE_OPTIONS, DATE_TIME_OPTIONS, formatDate(), formatNumber(), formatPostedDate(), formatSalary()

### Community 414 - "Requirement: Typed API access layer"

Cohesion: 0.20
Nodes (9): ADDED Requirements, MODIFIED Requirements, Requirement: Shell hosts multi-zone remotes, Requirement: Typed API access layer, Scenario: API error surfaces meaningfully, Scenario: Loading uses layout-matching skeletons, Scenario: Remotes share query key identities, Scenario: Shell retains chrome across domain navigations (+1 more)

### Community 420 - "scripts"

Cohesion: 0.25
Nodes (8): scripts, build, dev, lint, start, test, test:watch, typecheck

### Community 424 - "web-micro-frontends/proposal.md"

Cohesion: 0.29
Nodes (6): Capabilities, Impact, Modified Capabilities, New Capabilities, What Changes, Why

### Community 427 - "web-ui/package.json"

Cohesion: 0.33
Nodes (5): description, name, private, type, version

### Community 428 - "web-board/src/lib/hooks/use-keyboard-nav.ts"

Cohesion: 0.50
Nodes (4): isEditableTarget(), StageShortcut, useKeyboardNav(), UseKeyboardNavOptions

### Community 429 - "web-jobs/package.json"

Cohesion: 0.40
Nodes (4): description, name, private, version

### Community 430 - "web-micro-frontends/tasks.md"

Cohesion: 0.40
Nodes (4): 1. Extract shared packages (monolith still builds), 2. Scaffold shell + remotes + Turbo multi-zones, 3. Migrate jobs + board remotes, 4. Migrate settings, cutover, docs/wiki, verify

### Community 431 - "scripts"

Cohesion: 0.40
Nodes (5): scripts, build, lint, test, typecheck

### Community 432 - "web-board/README.md"

Cohesion: 0.50
Nodes (3): Dev, Messages, web-board

### Community 434 - "web-jobs/README.md"

Cohesion: 0.50
Nodes (3): Dev, Messages, web-jobs

### Community 436 - "web-shell"

Cohesion: 0.50
Nodes (3): Dev, Rewrite map, web-shell

### Community 437 - "web-settings/README.md"

Cohesion: 0.50
Nodes (3): Dev, Messages, web-settings

## Knowledge Gaps

- **2179 isolated node(s):** `evaluatorDirectory`, `projectRoot`, `webRoot`, `nextBinary`, `port` (+2174 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **72 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions

_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `cn` to `web-board/src/components/design-mode-toggle.tsx`, `web-settings/src/components/shell/dashboard-shell.tsx`, `web-board/src/components/shell/topbar.tsx`, `web-board/src/components/shell/command-palette.tsx`, `web-board/src/components/shell/sidebar.tsx`, `jobs-client.tsx`, `queryKeys`, `provider-config-dialog.tsx`, `web-settings/src/components/design-mode-toggle.tsx`, `notification-settings-form.tsx`, `web-settings/src/components/shell/topbar.tsx`, `job-detail.tsx`, `source-form-dialog.tsx`, `web-board/src/components/score-badge.tsx`, `filter-bar.tsx`, `dict-editor.tsx`, `web-board/src/components/theme-toggle.tsx`, `web-jobs/src/components/shell/topbar.tsx`, `web-settings/src/components/density-toggle.tsx`, `web-api/src/index.ts`, `web-board/src/components/density-toggle.tsx`, `web-board/src/i18n/navigation.ts`, `web-settings/src/components/theme-toggle.tsx`, `web-settings/src/i18n/navigation.ts`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Why does `getServerApiBaseUrl()` connect `getServerApiBaseUrl` to `web-api/src/index.ts`?**
  _High betweenness centrality (0.003) - this node is a cross-community bridge._
- **Why does `JobsController` connect `JobsService` to `jobs.controller.ts`, `Job`?**
  _High betweenness centrality (0.003) - this node is a cross-community bridge._
- **Are the 54 inferred relationships involving `TestClient` (e.g. with `test_cover_letter_endpoint()` and `test_cover_letter_endpoint_selects_prompt_by_provider_kind()`) actually correct?**
  _`TestClient` has 54 INFERRED edges - model-reasoned connections that need verification._
- **Are the 4 inferred relationships involving `wire()` (e.g. with `CredentialCipher` and `ProviderRow`) actually correct?**
  _`wire()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Are the 22 inferred relationships involving `ProviderRow` (e.g. with `ProviderPublic` and `_anthropic()`) actually correct?**
  _`ProviderRow` has 22 INFERRED edges - model-reasoned connections that need verification._
- **What connects `evaluatorDirectory`, `projectRoot`, `webRoot` to the rest of the system?**
  _2179 weakly-connected nodes found - possible documentation gaps or missing edges._
