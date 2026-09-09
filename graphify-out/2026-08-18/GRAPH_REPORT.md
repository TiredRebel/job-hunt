# Graph Report - job-hunter (2026-08-18)

## Corpus Check

- 574 files · ~314,693 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary

- 5073 nodes · 9002 edges · 327 communities (289 shown, 38 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 378 edges (avg confidence: 0.57)
- Token cost: 0 input · 0 output

## Graph Freshness

- Built from commit: `4f38614b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)

- PROGRESS
- dependencies
- Architecture digest
- devDependencies
- compilerOptions
- UI DESIGN — Job Hunter web app
- scripts
- KeywordDictionary
- compilerOptions
- shared-ts/package.json
- compilerOptions
- health.controller.ts
- Architecture
- core
- Architecture Decision Records
- LLM Configuration & Hot Switching
- README.md
- Requirements
- TestClient
- scraper/main.py
- Wiki Schema — job-hunter session-context wiki
- job-table-columns.tsx
- shared-ts/tsconfig.json
- .prettierrc.json
- web/README.md
- Log — append-only
- tsconfig.build.json
- job-table.tsx
- web/AGENTS.md
- web/eslint.config.mjs
- stage-board.tsx
- postcss.config.mjs
- SearchQuery
- llm/**init**.py
- scraper/**init**.py
- ADDED Requirements
- llm
- scraper
- client.ts
- CompletionRequest
- job-detail.tsx
- 2026-08-06-fix-jobs-posted-sort-order/design.md
- routes.py
- JobLead
- llm.ts
- cn
- api.ts
- n8n workflows
- 2026-08-06-llm-prompt-injection-guardrails/tasks.md
- FakeProvider
- jobs-client.tsx
- automation.service.spec.ts
- ProfilesController
- dou.py
- sources-page.tsx
- cover-letters.service.spec.ts
- profile.model.ts
- LLM Wiki — Reference Templates
- ProviderRow
- Profile
- AutomationController
- LlmProvider
- SourcesService
- Source
- components.json
- dependencies
- llm/main.py
- What You Must Do When Invoked
- dict-editor.tsx
- test_provider_connection
- devDependencies
- ScraperClient
- sources.controller.ts
- Requirements
- FakeDb
- settings.service.ts
- JobsService
- ADDED Requirements
- 2026-08-06-fix-jobs-posted-sort-order/proposal.md
- LlmAdminController
- Requirement: Filterable jobs table
- 2026-08-06-llm-prompt-injection-guardrails/proposal.md
- fetchers/**init**.py
- test_agent_browser.py
- RawJobPosting
- HttpLlmAdminClient
- .save
- .claude/skills/openspec-explore/SKILL.md
- .addBulk
- Decisions
- llm-admin.controller.ts
- scripts
- explore.md
- Decisions
- Requirement: Jobs list pagination controls
- Data Model (Postgres 17, database `jobhunter`)
- EscalatingFetcher
- reactions.module.ts
- Decisions
- Coding Standards
- ADDED Requirements
- 2026-07-23-jobs-bulk-delete/tasks.md
- scraper/observability.py
- Requirement: Escalation only for JS shells, never for blocked responses
- 2026-08-06-llm-prompt-injection-guardrails/design.md
- Requirements
- Decisions
- ProviderResolver
- Job Hunter
- scripts
- global.d.ts
- 3. Database
- graphify reference: extra exports and benchmark
- adapters/**init**.py
- JobReactionEvent
- Requirement: Escalation only for JS shells, never for blocked responses
- scraper-client.port.ts
- 2026-08-06-fix-jobs-posted-sort-order/tasks.md
- create_adapter
- ADDED Requirements
- is_js_shell
- Requirements
- Requirement: Provider configuration
- Requirements
- looks_like_anti_bot_challenge
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
- Request
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
- nestjs-cls
- 2026-07-23-jobs-bulk-delete/proposal.md
- JobReaction
- Requirement: Provider configuration
- Requirements
- Installation, Configuration & Deployment
- ADDED Requirements
- ADDED Requirements
- Requirement: Provider configuration
- delete-source/proposal.md
- Job
- ReactionsService
- test_adapters.py
- Decisions
- Decisions
- Requirement: Delete a source
- graphify reference: query, path, explain
- Decisions
- Decisions
- Requirement: Notification configuration is persisted and editable
- Requirement: Jobs list pagination controls
- [locale]/layout.tsx
- Decisions
- ADDED Requirements
- Decisions
- BulkReactionsDto
- route.ts
- Requirement: Cards can be manually ordered within a column
- Tasks — notification settings + board card reordering
- Requirement: Correlation id is propagated end to end
- source-command-opsx-explore
- Requirement: Pointer drops resolve to the target under the pointer
- PgDatabase
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
- http-llm-admin.client.ts
- Requirement: Transient cross-service calls are retried with backoff
- InternalController
- find_injection_signals
- Requirement: Correlation id is propagated end to end
- Requirement: Notifications section
- Requirement: Bulk-delete multiple vacancies
- quality-gates
- automation.service.ts
- delete-source/tasks.md
- api/package.json
- test_prompts.py
- board-collision.spec.ts
- 2026-07-23-jobs-bulk-delete/design.md
- LlmAdminService
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
- Database
- graphify reference: commit hook and native CLAUDE.md integration
- board-reorder.spec.ts
- graphify reference: incremental update and cluster-only
- Tasks: llm-provider-delete-and-model-picker
- Requirement: Poison jobs are marked failed after repeated attempts
- Requirement: Delete a vacancy from the jobs list
- Requirement: Delete a vacancy from the board
- 2026-07-22-simplify-static-html-adapters/tasks.md
- 2026-07-22-fix-board-cross-column-keyboard-drag/design.md
- UpdateNotificationSettingsDto
- 2026-07-22-fix-board-cross-column-keyboard-drag/proposal.md
- opencode.json
- bigint-serializer.interceptor.ts
- Autoresearch log
- source-command-opsx-apply
- source-command-opsx-archive
- source-command-opsx-propose
- source-command-opsx-sync
- cover-letter-editor.tsx
- jobs-rendering.spec.ts
- Q: Does this application uses Ollama as a current LLM provider?
- automation.dto.ts
- graphify reference: GitHub clone and cross-repo merge
- graphify reference: transcribe video and audio
- graphify.js
- HttpScraperClient
- PolitenessGate
- .**init**
- @dnd-kit/core
- 2026-07-22-jobs-list-pagination/proposal.md
- AGENTS.md
- 2026-07-22-fix-board-cross-column-keyboard-drag/tasks.md
- 2026-07-22-jobs-list-pagination/tasks.md
- 2026-07-23-improve-board-dnd-perf/design.md
- 2026-07-23-improve-board-dnd-perf/tasks.md
- Crawl4aiFetcher
- @nestjs/config
- Requirement: Keyboard-accessible drag and drop
- 2026-07-22-jobs-list-pagination/design.md
- nestjs-pino
- @nestjs/platform-express
- pg
- reflect-metadata
- rxjs
- profiles.ts
- @dnd-kit/sortable
- lucide-react
- next-intl
- react-dom
- sonner
- @tanstack/react-virtual
- tw-animate-css
- @testing-library/jest-dom
- UnknownSourceError
- extraction-spec.md
- wiki-ops/SKILL.md
- upwork.py
- automation.controller.ts
- CorrelationIdMiddleware
- internal-token.guard.ts
- get_correlation_id
- .get
- .filter
- scraper/tests/test_observability.py
- .dispatch
- app.module.ts
- typescript

## God Nodes (most connected - your core abstractions)

1. `cn()` - 79 edges
2. `apiRequest()` - 55 edges
3. `ProviderRow` - 54 edges
4. `wire()` - 53 edges
5. `JobLead` - 46 edges
6. `FakeProvider` - 45 edges
7. `Profile` - 44 edges
8. `FakeDb` - 38 edges
9. `FetchResult` - 36 edges
10. `RawJobPosting` - 34 edges

## Surprising Connections (you probably didn't know these)

- `DropdownMenuItem()` --calls--> `cn()` [EXTRACTED]
  apps/web/src/components/ui/dropdown-menu.tsx → apps/web/src/lib/utils.ts
- `DropdownMenuLabel()` --calls--> `cn()` [EXTRACTED]
  apps/web/src/components/ui/dropdown-menu.tsx → apps/web/src/lib/utils.ts
- `DropdownMenuSeparator()` --calls--> `cn()` [EXTRACTED]
  apps/web/src/components/ui/dropdown-menu.tsx → apps/web/src/lib/utils.ts
- `ProcessJobRequest` --uses--> `ProviderRow` [INFERRED]
  services/llm/src/llm/api.py → services/llm/src/llm/db.py
- `ProcessJobResponse` --uses--> `ProviderRow` [INFERRED]
  services/llm/src/llm/api.py → services/llm/src/llm/db.py

## Import Cycles

- None detected.

## Communities (327 total, 38 thin omitted)

### Community 0 - "PROGRESS"

Cohesion: 0.15
Nodes (13): 2026-07-21, 2026-07-21 (2) — Jobs-count reconciliation surfaced, Architecture review follow-up — 2026-07-20, Log, Phase 0 — Bootstrap ✅, Phase 1 — Data model & migrations ✅, Phase 2 — Scraper service (Python, FastAPI) ✅, Phase 3 — LLM service (Python, FastAPI + LangGraph) ✅ (+5 more)

### Community 1 - "dependencies"

Cohesion: 0.10
Nodes (21): dependencies, class-transformer, class-validator, @nestjs/common, @nestjs/core, @nestjs/swagger, @nestjs/throttler, pino (+13 more)

### Community 2 - "Architecture digest"

Cohesion: 0.09
Nodes (23): Context pages, Index — job-hunter wiki, Raw sources (canonical project docs — read in place, never edit from wiki), Tooling, Architecture digest, Data flow, Key ports, Non-negotiable rules (+15 more)

### Community 3 - "devDependencies"

Cohesion: 0.06
Nodes (31): devDependencies, eslint, eslint-config-next, eslint-plugin-jsdoc, jsdom, playwright, @playwright/test, shadcn (+23 more)

### Community 4 - "compilerOptions"

Cohesion: 0.09
Nodes (22): ES2023, compilerOptions, declaration, esModuleInterop, exactOptionalPropertyTypes, forceConsistentCasingInFileNames, isolatedModules, lib (+14 more)

### Community 5 - "UI DESIGN — Job Hunter web app"

Cohesion: 0.10
Nodes (20): 10. Forbidden (anti-generic guard, adapted from skill), 11. Open items, 1. Product posture, 2.1 Color, 2.2 Typography, 2.3 Spacing & density, 2.4 Shape & elevation, 2. Design tokens (+12 more)

### Community 6 - "scripts"

Cohesion: 0.04
Nodes (45): dbmate, husky, lint-staged, description, devDependencies, dbmate, husky, lint-staged (+37 more)

### Community 7 - "KeywordDictionary"

Cohesion: 0.05
Nodes (46): KEYWORD_DICTIONARY_REPOSITORY, KeywordDictionaryRepository, UpsertDictionaryInput, ConflictError, NotFoundError, RepositoryError, DictionaryKind, KeywordDictionary (+38 more)

### Community 8 - "compilerOptions"

Cohesion: 0.06
Nodes (34): compilerOptions, allowJs, esModuleInterop, exactOptionalPropertyTypes, incremental, isolatedModules, jsx, lib (+26 more)

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

Cohesion: 0.17
Nodes (12): 10. Testing strategy, 1. Goals & constraints, 2. Services, 3. Layering (every service), 4. Data flow, 5. Source adapters (scraper), 6. LLM provider hub (llm service), 7. Orchestration split (n8n vs LangGraph) (+4 more)

### Community 13 - "core"

Cohesion: 0.13
Nodes (15): core, core.app_settings, core.cover_letters, core.job_board_position (advisory manual card order), core.job_matches, core.job_reactions (event log — application/response tracking per vacancy), core.jobs (normalized, LLM-extracted), core.keyword_dictionaries (editable from dashboard) (+7 more)

### Community 14 - "Architecture Decision Records"

Cohesion: 0.22
Nodes (8): ADR-001: Hybrid orchestration — n8n + LangGraph, ADR-002: Mixed language stack (Python + TypeScript), ADR-003: Single Postgres 17, schema-per-service, ADR-004: Redis as queue/pub-sub, ADR-005: LLM hot-switch via DB registry, ADR-006: Scraping strategy ladder — API → crawl4ai → agent-browser, ADR-007: NestJS for API gateway, Architecture Decision Records

### Community 15 - "LLM Configuration & Hot Switching"

Cohesion: 0.22
Nodes (9): Hot switch flow, LLM Configuration & Hot Switching, Managing providers from the UI, Per-pipeline overrides, Prompt-injection guardrail, Provider model, Secrets policy, Seed providers (migration 0003) (+1 more)

### Community 16 - "README.md"

Cohesion: 0.13
Nodes (9): Adapter contract, dou.ua — `dou` (start here: easiest, richest UA tech jobs), How the ladder works (as implemented), job.ua — `jobua`, Reddit — `reddit`, Source Strategies, Static HTML adapter mechanics, Upwork — `upwork` ⚠️ best-effort (+1 more)

### Community 17 - "Requirements"

Cohesion: 0.13
Nodes (14): llm-prompt-guardrails, Purpose, Requirement: Denial is a distinct client error, not a generic upstream failure, Requirement: Denied attempts are recorded without an upstream call, Requirement: Detect prompt injection before any provider call, Requirement: Untrusted content is structurally isolated in prompts, Requirements, Scenario: A legitimate AI/ML job posting is not blocked (+6 more)

### Community 18 - "TestClient"

Cohesion: 0.10
Nodes (51): FakeDb, all_responses(), Canned responses covering every pipeline schema (high match)., Tests for the REST surface (fakes injected via app state, no real I/O)., A row activated between the active-check and the delete itself still 409s., test_cover_letter_endpoint(), test_cover_letter_endpoint_selects_prompt_by_provider_kind(), test_cover_letter_llm_error_502() (+43 more)

### Community 19 - "scraper/main.py"

Cohesion: 0.07
Nodes (43): BackgroundTasks, ge, le, get_settings(), BaseSettings, Runtime configuration for the scraper service. Settings come from environment…, Scraper service settings. Attributes: database_url: PostgreSQL DSN…, Return the process-wide settings singleton. Returns: Cached :class:`Settings`… (+35 more)

### Community 20 - "Wiki Schema — job-hunter session-context wiki"

Cohesion: 0.29
Nodes (6): graphify, Layers, Log format (`log.md`, append-only), Page conventions, Search (qmd), Wiki Schema — job-hunter session-context wiki

### Community 21 - "job-table-columns.tsx"

Cohesion: 0.08
Nodes (28): dynamic, JobDetailPageProps, footerStageLabel(), JobDetailView(), buildJobColumns(), JobColumnsActions, JobColumnsTranslations, JobRow (+20 more)

### Community 22 - "shared-ts/tsconfig.json"

Cohesion: 0.29
Nodes (6): compilerOptions, outDir, extends, include, src/**/*, ../../tsconfig.base.json

### Community 23 - ".prettierrc.json"

Cohesion: 0.40
Nodes (4): printWidth, semi, singleQuote, trailingComma

### Community 24 - "web/README.md"

Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

### Community 25 - "Log — append-only"

Cohesion: 0.06
Nodes (30): [2026-07-15] checkpoint | Phase 0 complete, Phase 1 (DB & migrations) next, [2026-07-15] checkpoint | Phase 2 scraper service complete (commit 6b24cdc), [2026-07-15] checkpoint | Phase 3 LLM service complete, routes refactored (commit 63b8a59), [2026-07-15] ingest | Graphify code knowledge graph built, [2026-07-15] ingest | Wiki bootstrapped (Karpathy llm-wiki pattern), [2026-07-16] checkpoint | Phase 2 crawl4ai/agent-browser leftover complete (OpenSpec 20/20), [2026-07-16] checkpoint | Phase 4 API gateway skeleton + domain APIs done, [2026-07-16] checkpoint | Phase 4 complete — OpenAPI schema enrichment (commit 21b2f40) (+22 more)

### Community 26 - "tsconfig.build.json"

Cohesion: 0.33
Nodes (5): exclude, extends, vitest.config.ts, src/**/*.spec.ts, ./tsconfig.json

### Community 27 - "job-table.tsx"

Cohesion: 0.13
Nodes (21): DeadLetterPage(), dynamic, JobTable(), SORTABLE_COLUMN_IDS, SORTABLE_COLUMN_TO_API, DropdownMenu, DropdownMenuCheckboxItem(), DropdownMenuContent() (+13 more)

### Community 30 - "stage-board.tsx"

Cohesion: 0.05
Nodes (39): dynamic, BOARD_STAGES, BoardStage, ALL_JOBS, APPLIED_JOB, INTERVIEW_JOB, renderCountsByScore, SAVED_JOB (+31 more)

### Community 32 - "SearchQuery"

Cohesion: 0.06
Nodes (61): DeadLetterRow, TypedDict, Persistence layer: PostgreSQL access via psycopg (async pool). Only this module…, Finalize a scrape-run row. Args: run_id: Id returned by :meth:`create_run`.…, Row of `core.sources` used by the runner., Row of `scraper.scrape_runs` joined with the source slug., Row of `scraper.jobs_raw` awaiting LLM processing., Row of `scraper.jobs_raw` that gave up after repeated processing failures. (+53 more)

### Community 38 - "ADDED Requirements"

Cohesion: 0.14
Nodes (13): ADDED Requirements, Purpose, Requirement: Denial is a distinct client error, not a generic upstream failure, Requirement: Denied attempts are recorded without an upstream call, Requirement: Detect prompt injection before any provider call, Requirement: Untrusted content is structurally isolated in prompts, Scenario: A legitimate AI/ML job posting is not blocked, Scenario: Blocked attempt appears in pipeline run history (+5 more)

### Community 41 - "client.ts"

Cohesion: 0.12
Nodes (20): dynamic, buildPatch(), fromSettings(), NotificationFormState, NotificationSettingsForm(), validate(), ValidationErrors, ApiRequestOptions (+12 more)

### Community 42 - "CompletionRequest"

Cohesion: 0.04
Nodes (63): AsyncRetrying, BaseException, RetryCallState, ProviderRequestError, The upstream provider HTTP call failed., Run a free-text completion., AnthropicProvider, AsyncClient (+55 more)

### Community 43 - "job-detail.tsx"

Cohesion: 0.07
Nodes (43): BulkActionBar(), BulkActionBarProps, STAGE_OPTIONS, DATE_PRESETS, FilterChip, STAGE_VALUES, FOOTER_STAGES, JobDetailViewProps (+35 more)

### Community 44 - "2026-08-06-fix-jobs-posted-sort-order/design.md"

Cohesion: 0.22
Nodes (8): Context, D1: Use an effective display date only for Posted sorting, D2: Retain the existing unique ID tie-breaker, D3: Test the generated ordering at the repository boundary, Decisions, Goals / Non-Goals, Migration Plan, Risks / Trade-offs

### Community 45 - "routes.py"

Cohesion: 0.08
Nodes (69): GraphDepsDep, CoverLetterRequest, CreateProviderRequest, MatchRequest, ModelListResponse, PipelineOverride, ProcessJobRequest, ProcessJobResponse (+61 more)

### Community 46 - "JobLead"

Cohesion: 0.06
Nodes (47): build_posting(), extract_text(), Shared mechanics and helpers for static-HTML source adapters. Source-specific…, Extract normalized text from the first node matching `selector`. Falls back…, Assemble a :class:`RawJobPosting` with a content-based fingerprint.…, Immutable source-specific configuration for a static HTML adapter. Attributes:…, Implement the shared discovery and detail lifecycle for static HTML. The…, Initialize a static HTML adapter. Args: source: Immutable source mechanics and… (+39 more)

### Community 47 - "llm.ts"

Cohesion: 0.10
Nodes (28): dynamic, LlmSettingsPageClient(), ConnectionTestState, kindBucket(), ProviderCard(), ProviderCardProps, buildOverridesPayload(), parseTemperature() (+20 more)

### Community 48 - "cn"

Cohesion: 0.07
Nodes (42): MultiSelect(), MultiSelectOption, MultiSelectProps, LABEL_KEY_BY_SHORTCUT, SHORTCUT_KEYS, ShortcutsDialog(), ShortcutsDialogProps, DraftTestState (+34 more)

### Community 49 - "api.ts"

Cohesion: 0.28
Nodes (7): components, $defs, operations, paths, webhooks, Locale, ReactionStage

### Community 50 - "n8n workflows"

Cohesion: 0.25
Nodes (8): Cadences, Import, n8n workflows, Re-export after editing in the UI, Required credentials (create once in the n8n UI, referenced by name only), Required environment variables, Runtime, Verifying end to end

### Community 51 - "2026-08-06-llm-prompt-injection-guardrails/tasks.md"

Cohesion: 0.25
Nodes (7): 1. Injection guard module, 2. Wire the guard into the shared execution path, 3. Route-level error mapping, 4. Prompt hardening (structural isolation), 5. Tests, 6. Docs, 7. Verification

### Community 52 - "FakeProvider"

Cohesion: 0.09
Nodes (29): RunRecorder, PromptInjectionDetectedError, Store the missing environment-variable name., The provider reply did not validate against the pipeline schema., The composed prompt matched a known prompt-injection pattern., Store the matched signal labels (see `pipelines.injection_guard`)., SchemaValidationError, ModelT (+21 more)

### Community 53 - "jobs-client.tsx"

Cohesion: 0.06
Nodes (50): dynamic, JobsPage(), JobsPageProps, { refreshMock }, FilterBar(), FilterBarProps, presetLabel(), JobDrawer (+42 more)

### Community 54 - "automation.service.spec.ts"

Cohesion: 0.11
Nodes (13): AutomationRepository, DigestPayload, NotificationChannel, PersistJobResultInput, PersistJobResultOutput, UnnotifiedMatch, FakeAutomationRepository, Inject (+5 more)

### Community 55 - "ProfilesController"

Cohesion: 0.14
Nodes (14): ProfilesController, ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags, Body (+6 more)

### Community 56 - "dou.py"

Cohesion: 0.10
Nodes (26): date, parse_ukrainian_calendar_date(), datetime, Calendar-date parsing shared by Ukrainian job-board adapters., Parse a Ukrainian calendar date into UTC midnight. Both a bare DOU date (``5…, parse_detail_posted_at(), parse_list(), parse_posted_at() (+18 more)

### Community 57 - "sources-page.tsx"

Cohesion: 0.09
Nodes (39): dynamic, initialState(), SourceFormBody(), SourceFormBodyProps, SourceFormDialog(), SourceFormDialogProps, formatDuration(), okResultMeta() (+31 more)

### Community 58 - "cover-letters.service.spec.ts"

Cohesion: 0.08
Nodes (24): COVER_LETTER_REPOSITORY, CoverLetterRepository, JobRepository, CoverLetterJobInput, CoverLetterProfileInput, GenerateCoverLetterInput, GeneratedCoverLetter, LLM_COVER_LETTER_CLIENT (+16 more)

### Community 59 - "profile.model.ts"

Cohesion: 0.26
Nodes (13): RemoteType, Seniority, ProfilePreferences, CreateProfileDto, ProfilePreferencesDto, ApiProperty, ApiPropertyOptional, IsBoolean (+5 more)

### Community 60 - "LLM Wiki — Reference Templates"

Cohesion: 0.08
Nodes (24): Current-State Template (`wiki/pages/current-state.md`), Example Ingest Log Entry, Example Query → File Back, Index Template (`wiki/index.md`), Karpathy's Mental Model, LLM Wiki — Reference Templates, Project Wiki vs Personal Wiki, qmd Collection Setup (+16 more)

### Community 61 - "ProviderRow"

Cohesion: 0.07
Nodes (23): AsyncConnectionPool, Db, PipelineRunRecord, ProviderRow, Any, BaseModel, Insert a new, inactive registry row. No `NOTIFY` — an inactive row can't be…, Update only the provided fields and broadcast `NOTIFY`.… (+15 more)

### Community 62 - "Profile"

Cohesion: 0.08
Nodes (17): CreateProfileInput, PROFILE_REPOSITORY, ProfileRepository, UpdateProfileInput, FakeProfileRepository, FakeProfileRepository, Profile, mapRow() (+9 more)

### Community 63 - "AutomationController"

Cohesion: 0.12
Nodes (16): ApiSecurity, AutomationController, ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags (+8 more)

### Community 64 - "LlmProvider"

Cohesion: 0.15
Nodes (4): LlmAdminClient, LlmProvider, FakeLlmAdminClient, makeProvider()

### Community 65 - "SourcesService"

Cohesion: 0.11
Nodes (21): ApiConflictResponse, SourcesController, ApiBody, ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam (+13 more)

### Community 66 - "Source"

Cohesion: 0.12
Nodes (14): CreateSourceInput, SOURCE_REPOSITORY, SourceRepository, UpdateSourceInput, ScrapeRun, FetchStrategy, Source, mapRunRow() (+6 more)

### Community 67 - "components.json"

Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 68 - "dependencies"

Cohesion: 0.07
Nodes (27): dependencies, class-variance-authority, clsx, cmdk, @dnd-kit/utilities, @job-hunter/shared-ts, next, next-themes (+19 more)

### Community 69 - "llm/main.py"

Cohesion: 0.05
Nodes (54): get_settings(), BaseSettings, Runtime configuration for the LLM service. Settings come from environment…, LLM service settings read from the environment., Return the cached settings singleton., Settings, CredentialCipher, Encryption for provider API keys stored by the LLM service. (+46 more)

### Community 70 - "What You Must Do When Invoked"

Cohesion: 0.07
Nodes (26): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+18 more)

### Community 71 - "dict-editor.tsx"

Cohesion: 0.19
Nodes (16): dynamic, DictionariesPageClient(), DictionaryCard(), DictionaryCardProps, isStringItems(), KIND_ORDER, kindTitle(), createDictionary() (+8 more)

### Community 72 - "test_provider_connection"

Cohesion: 0.09
Nodes (33): BuildProviderDep, CredentialCipherDep, DbDep, InternalTokenDep, ModelListResponse, ProviderTestResponse, ResolverDep, Project a DB row onto the public shape without its ciphertext. (+25 more)

### Community 73 - "devDependencies"

Cohesion: 0.10
Nodes (21): devDependencies, eslint, eslint-config-prettier, eslint-plugin-jsdoc, tsx, @types/node, @types/pg, typescript (+13 more)

### Community 74 - "ScraperClient"

Cohesion: 0.07
Nodes (9): RawJob, RawJobOutcome, ScraperClient, ScrapeTriggerResponse, SourceTestResult, FakeScraperClient, FakeScraperClient, FakeScraperClient (+1 more)

### Community 75 - "sources.controller.ts"

Cohesion: 0.13
Nodes (26): SourceTestStatus, ScrapeRunStatus, CreateSourceDto, ListRunsQueryDto, SetSourceEnabledDto, ApiProperty, ApiPropertyOptional, IsBoolean (+18 more)

### Community 76 - "Requirements"

Cohesion: 0.10
Nodes (20): Purpose, Requirement: Accessibility and motion baselines, Requirement: Dashboard layout with sidebar and topbar, Requirement: Design tokens and theme switching, Requirement: EN and UA localization, Requirement: Global command palette, Requirement: Typed API access layer, Requirements (+12 more)

### Community 77 - "FakeDb"

Cohesion: 0.09
Nodes (44): _client(), _client_with_fetcher(), _fake_fetchers(), FakeDb, FakeFetcher, Any, Exception, API tests for the scrape/run endpoints (fake DB wired into app state). (+36 more)

### Community 78 - "settings.service.ts"

Cohesion: 0.12
Nodes (21): NOTIFICATION_SETTINGS_REPOSITORY, NotificationSettingsRepository, FakeNotificationSettingsRepository, NotificationSettings, UpdateNotificationSettingsInput, applyChannelPatch(), applyScalarPatch(), mapRow() (+13 more)

### Community 79 - "JobsService"

Cohesion: 0.12
Nodes (18): JobsController, ApiBody, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags, Body (+10 more)

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

Cohesion: 0.06
Nodes (39): asyncio, RuntimeError, Fetch the configured listing URL for a connectivity check. Returns: The…, Fetch the first configured subreddit's listing, for connectivity testing., Fetch the RSS feed once, for connectivity testing. Unlike :meth:`discover`, a…, agent-browser subprocess fetcher for JS-heavy, non-API sources. Only Upwork is…, FetchBlockedError, FetchResult (+31 more)

### Community 86 - "test_agent_browser.py"

Cohesion: 0.27
Nodes (12): _fetcher(), _gate(), Tests for :class:`AgentBrowserFetcher`. Exercises real subprocesses (using this…, Build a fetcher whose "CLI" is this interpreter running `script`., test_empty_output_raises_unavailable(), test_json_field_priority_prefers_html_over_others(), test_json_output_with_html_field_is_extracted(), test_missing_command_raises_unavailable() (+4 more)

### Community 87 - "RawJobPosting"

Cohesion: 0.10
Nodes (19): Fetched vacancy payload ready for persistence into `scraper.jobs_raw`.…, RawJobPosting, Fetch the detail payload for a discovered lead. Args: lead: Lead previously…, FakeConnection, FakeCursor, FakePool, Any, Focused persistence regressions for raw-job date backfills. (+11 more)

### Community 88 - "HttpLlmAdminClient"

Cohesion: 0.23
Nodes (3): HttpLlmAdminClient, mapProvider(), Injectable

### Community 89 - ".save"

Cohesion: 0.12
Nodes (18): CoverLettersController, ApiBody, ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags (+10 more)

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
Nodes (18): LlmProviderKind, CreateLlmProviderDto, PROVIDER_KINDS, SetActiveProviderDto, TestLlmProviderConnectionDto, ApiProperty, ApiPropertyOptional, IsIn (+10 more)

### Community 94 - "scripts"

Cohesion: 0.14
Nodes (13): name, private, scripts, build, dev, lint, start, test (+5 more)

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

Cohesion: 0.24
Nodes (14): EscalatingFetcher, Tries `primary` first; escalates to `secondary` on a JS shell. A host that…, Initialize the escalating fetcher. Args: primary: Cheap fetcher tried first…, Exception, Tests for :class:`EscalatingFetcher` (fake primary/secondary, no network)., Stand-in fetcher returning a canned result or raising a canned error., ScriptedFetcher, test_anti_bot_challenge_page_is_blocked_not_escalated() (+6 more)

### Community 100 - "reactions.module.ts"

Cohesion: 0.30
Nodes (7): BOARD_ORDER_REPOSITORY, BoardOrderRepository, AppendReactionInput, JOB_REACTION_REPOSITORY, PostgresBoardOrderRepository, Injectable, FakeBoardOrderRepository

### Community 101 - "Decisions"

Cohesion: 0.12
Nodes (16): Context, D1 — `PageFetcher` port; adapters keep their parsers and shape, D2 — `PolitenessGate` extracted from `PoliteClient`, D3 — Strategy resolution in the registry, D4 — HTTP-first with JS-shell escalation; blocked is NEVER escalated, D4b — Anti-bot interstitials are blocked, never treated as a JS shell, D4c — Anti-bot-challenge detection also protects `agent-browser`, D5 — Crawl4aiFetcher: rendered raw HTML, our politeness, lazy import (+8 more)

### Community 102 - "Coding Standards"

Cohesion: 0.25
Nodes (7): Coding Standards, Definition of Done (per feature), Git hygiene, Python (`services/scraper`, `services/llm`), SQL / migrations, TypeScript (`apps/web`, `apps/api`, `packages/*`), Universal

### Community 103 - "ADDED Requirements"

Cohesion: 0.12
Nodes (16): ADDED Requirements, jobs-dashboard, Requirement: Bulk stage actions, Requirement: Filter bar with URL-persisted state, Requirement: Filterable jobs table, Requirement: Keyboard-first row flow, Requirement: Row navigation to detail, Scenario: Bulk action failure (+8 more)

### Community 104 - "2026-07-23-jobs-bulk-delete/tasks.md"

Cohesion: 0.20
Nodes (9): 1. Fix: drawer/full-page closes immediately after single delete, 2. Backend: bulk-delete endpoint, 3. OpenAPI + shared-ts regeneration, 4. Frontend: API client, 5. Frontend: bulk action bar Delete control, 6. Frontend: wire bulk delete into the jobs page, 7. Localization, 8. Tests (+1 more)

### Community 105 - "scraper/observability.py"

Cohesion: 0.24
Nodes (10): configure_logging(), _CorrelationIdLogFilter, Structured JSON logging and request correlation ids. Shared observability…, Bind `value` as the current context's correlation id. Args: value: The…, Injects the bound correlation id onto every log record., Install single-line JSON logging with correlation ids. Replaces the root…, set_correlation_id(), CaptureFixture (+2 more)

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

### Community 110 - "ProviderResolver"

Cohesion: 0.09
Nodes (36): FetchActive, PostgreSQL access for the LLM service (registry reads, run bookkeeping). Tables…, LlmError, MissingApiKeyError, ModelResolutionError, NoActiveProviderError, Exception, Domain errors for the LLM service. (+28 more)

### Community 111 - "Job Hunter"

Cohesion: 0.14
Nodes (14): Architecture at a glance, Dashboard (Next.js), Features, Job Hunter, Notifications, Prerequisites, Quality bar, Quick start (+6 more)

### Community 112 - "scripts"

Cohesion: 0.22
Nodes (9): scripts, build, dev, lint, openapi:emit, start, test, test:watch (+1 more)

### Community 114 - "3. Database"

Cohesion: 0.40
Nodes (5): 3.1 Get a Postgres 17 instance, 3.2 Create the `jobhunter` database, 3.3 Configure `.env` for migrations, 3.4 Run migrations and seed data, 3. Database

### Community 115 - "graphify reference: extra exports and benchmark"

Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 128 - "JobReactionEvent"

Cohesion: 0.16
Nodes (8): JobReactionRepository, CurrentReaction, JobReactionEvent, mapCurrentRow(), mapEventRow(), PostgresJobReactionRepository, Injectable, FakeJobReactionRepository

### Community 129 - "Requirement: Escalation only for JS shells, never for blocked responses"

Cohesion: 0.13
Nodes (14): ADDED Requirements, fetch-strategy-ladder, Requirement: Escalation only for JS shells, never for blocked responses, Requirement: Fetcher selection driven by source strategy, Requirement: Politeness is enforced identically for every fetcher, Scenario: Anti-bot answer is not escalated, Scenario: Anti-bot challenge page is not escalated, Scenario: API-strategy source keeps plain HTTP (+6 more)

### Community 130 - "scraper-client.port.ts"

Cohesion: 0.10
Nodes (24): JOBS_RECONCILIATION_REPOSITORY, JobsReconciliationRepository, DeadLetterJob, SCRAPER_CLIENT, ReconciliationAggregate, ReconciliationRow, mapRow(), PostgresJobsReconciliationRepository (+16 more)

### Community 131 - "2026-08-06-fix-jobs-posted-sort-order/tasks.md"

Cohesion: 0.50
Nodes (3): 1. Correct the server-side Posted ordering, 2. Add regression coverage, 3. Verify and record the change

### Community 132 - "create_adapter"

Cohesion: 0.14
Nodes (21): create_adapter(), _politeness_overrides_from_config(), Any, FetcherFactory, Instantiate the adapter registered for `slug`. Args: slug: Source slug from…, Read per-source politeness overrides from `core.sources.config`. Recognizes…, FetcherFactory, parametrize (+13 more)

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

### Community 138 - "looks_like_anti_bot_challenge"

Cohesion: 0.26
Nodes (10): looks_like_anti_bot_challenge(), Anti-bot interstitial detection — keeps escalation from becoming evasion. The…, Detect a known anti-bot interstitial (Cloudflare-style challenge page). Args:…, Tests for anti-bot interstitial detection., test_cloudflare_browser_verification_marker_is_detected(), test_cloudflare_just_a_moment_is_detected(), test_detection_is_case_insensitive(), test_generic_enable_js_message_is_detected() (+2 more)

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

### Community 150 - "Request"

Cohesion: 0.17
Nodes (12): _build_provider(), _credential_cipher(), _db(), BuildProvider, Request, Fetch the DB layer from app state., Fetch the provider resolver from app state., Fetch the provider factory from app state. Unlike the resolver (which only ever… (+4 more)

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

Cohesion: 0.15
Nodes (15): configure_logging(), _CorrelationIdLogFilter, Structured JSON logging and request correlation ids. Shared observability…, Bind `value` as the current context's correlation id. Args: value: The…, Injects the bound correlation id onto every log record., Install single-line JSON logging with correlation ids. Replaces the root…, set_correlation_id(), CaptureFixture (+7 more)

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

### Community 173 - "2026-07-23-jobs-bulk-delete/proposal.md"

Cohesion: 0.29
Nodes (6): Capabilities, Impact, Modified Capabilities, New Capabilities, What Changes, Why

### Community 174 - "JobReaction"

Cohesion: 0.23
Nodes (9): BulkDeletedResponse, BulkInsertedResponse, DeletedResponse, ApiProperty, JobReaction, BOARD_STAGE_VALUES, JOB_REACTION_VALUES, JobReactionEventResponse (+1 more)

### Community 175 - "Requirement: Provider configuration"

Cohesion: 0.08
Nodes (25): ADDED Requirements, llm-admin-ui (delta), MODIFIED Requirements, Requirement: Add a custom provider, Requirement: Configuration hot-reload, Requirement: Connection test, Requirement: Provider configuration, Requirement: Provider model listing (+17 more)

### Community 176 - "Requirements"

Cohesion: 0.09
Nodes (21): jobs-reconciliation, Purpose, Requirement: Cross-source jobs reconciliation aggregate, Requirement: Dead-letter listing route, Requirement: Per-source jobs-health summary, Requirement: Public dead-letter listing, Requirement: Reconciliation data freshness, Requirement: Reconciliation endpoint error handling (+13 more)

### Community 177 - "Installation, Configuration & Deployment"

Cohesion: 0.10
Nodes (21): 10.1 Continuous integration, 10. Quality gates (per service), 1. Prerequisites, 2. Clone & install JS/TS dependencies, 4. Configure and install the Python services, 5.1 Root `.env` (source of truth for services + Docker Compose), 5.2 `apps/web/.env` (Next.js — copy from `apps/web/.env.example`), 5.3 `apps/api/.env` (copy from `apps/api/.env.example`) (+13 more)

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
Nodes (34): DateField, JOB_REPOSITORY, JobFilter, JobSortBy, PaginatedJobs, SortDir, PaginatedResponse(), PaginatedShape (+26 more)

### Community 183 - "ReactionsService"

Cohesion: 0.12
Nodes (12): BoardController, ApiBody, ApiNoContentResponse, ApiOperation, ApiTags, Body, Controller, HttpCode (+4 more)

### Community 184 - "test_adapters.py"

Cohesion: 0.11
Nodes (23): _matches(), parse_listing(), Any, Reddit adapter — public JSON API, no scraping (docs/SOURCES.md). Reads…, Fetch (or reuse) the `new` listing for one subreddit. Args: subreddit:…, Extract post objects from a Reddit listing payload. Args: payload: Decoded…, Check whether a post satisfies the flair and term filters. Args: post: Reddit…, Reddit source adapter (API-first strategy). (+15 more)

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

### Community 193 - "[locale]/layout.tsx"

Cohesion: 0.07
Nodes (27): nextConfig, withNextIntl, geistSans, jetbrainsMono, metadata, createQueryClient(), QueryProvider(), ThemeProvider() (+19 more)

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

Cohesion: 0.31
Nodes (13): AppendReactionDto, BulkReactionsDto, SetBoardOrderDto, ApiProperty, ApiPropertyOptional, IsArray, IsDate, IsEnum (+5 more)

### Community 198 - "route.ts"

Cohesion: 0.18
Nodes (12): DELETE, GET, PATCH, POST, ProxyContext, proxyRequest(), PUT, getApiBaseUrl() (+4 more)

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

### Community 204 - "PgDatabase"

Cohesion: 0.08
Nodes (8): PgDatabase, buildOrderBy(), mapJobRow(), PostgresJobRepository, CaptureDatabase, JobRow, QueryCall, Injectable

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

### Community 216 - "http-llm-admin.client.ts"

Cohesion: 0.38
Nodes (7): CreateLlmProviderInput, LLM_ADMIN_CLIENT, LlmServiceError, ModelList, ProviderTestResult, TestLlmProviderConnectionInput, UpdateLlmProviderInput

### Community 217 - "Requirement: Transient cross-service calls are retried with backoff"

Cohesion: 0.18
Nodes (10): Purpose, request-resilience, Requirement: Retry attempts are observable, Requirement: Transient cross-service calls are retried with backoff, Requirements, Scenario: A large Retry-After is capped, Scenario: A retried call leaves a trail, Scenario: Non-transient failure is not retried (+2 more)

### Community 218 - "InternalController"

Cohesion: 0.24
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

### Community 224 - "automation.service.ts"

Cohesion: 0.11
Nodes (19): AUTOMATION_REPOSITORY, CoverLetterInput, DigestJobSummary, DigestMatchSummary, MatchInput, NormalizedJobInput, AutomationModule, Module (+11 more)

### Community 225 - "delete-source/tasks.md"

Cohesion: 0.33
Nodes (5): 1. Contract preparation, 2. Gateway source deletion, 3. OpenAPI and shared client, 4. Sources list deletion UX, 5. Final verification and documentation

### Community 226 - "api/package.json"

Cohesion: 0.40
Nodes (4): description, name, private, version

### Community 227 - "test_prompts.py"

Cohesion: 0.10
Nodes (22): CoverLetter, cover_letter_prompt(), cover_letter_system(), normalize_prompt(), Prompt templates for the four pipelines. Prompts embed only caller-supplied…, Pick the cover-letter system prompt formatted for the provider's family. Claude…, Build the user prompt for the `normalize` pipeline., Build the user prompt for the `tag` pipeline. (+14 more)

### Community 228 - "board-collision.spec.ts"

Cohesion: 0.31
Nodes (7): boardCollisionDetection(), CollisionArgs, container(), DroppableContainer, makeArgs(), RawRect, rect()

### Community 229 - "2026-07-23-jobs-bulk-delete/design.md"

Cohesion: 0.40
Nodes (4): Context, Decisions, Goals / Non-Goals, Risks / Trade-offs

### Community 230 - "LlmAdminService"

Cohesion: 0.29
Nodes (3): LlmAdminService, Inject, Injectable

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

### Community 252 - "Database"

Cohesion: 0.09
Nodes (12): Database, Load enabled search dictionaries (re-read on every run). Returns: Rows feeding…, Insert a `running` scrape-run row. Args: source_id: FK into `core.sources`.…, Persist a raw posting, deduplicating on the unique constraint. Duplicate rows…, List raw jobs awaiting LLM processing, oldest first. Args: limit: Maximum rows…, List raw jobs that gave up after repeated processing failures. Args: limit:…, Mark a raw job's processing outcome for this attempt. `done` closes the row…, List recent scrape runs, newest first. Args: limit: Maximum number of rows.… (+4 more)

### Community 253 - "graphify reference: commit hook and native CLAUDE.md integration"

Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 254 - "board-reorder.spec.ts"

Cohesion: 0.16
Nodes (6): clearAmbientSavedJobs(), seedSavedColumn(), retryUntilHydrated(), findJobRow(), openJobs(), prepareBoardJob()

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

### Community 262 - "UpdateNotificationSettingsDto"

Cohesion: 0.10
Nodes (19): SettingsController, ApiBody, ApiOkResponse, ApiOperation, ApiTags, Body, Controller, Get (+11 more)

### Community 263 - "2026-07-22-fix-board-cross-column-keyboard-drag/proposal.md"

Cohesion: 0.29
Nodes (6): Capabilities, Impact, Modified Capabilities, New Capabilities, What Changes, Why

### Community 264 - "opencode.json"

Cohesion: 0.50
Nodes (3): plugin, $schema, .opencode/plugins/graphify.js

### Community 265 - "bigint-serializer.interceptor.ts"

Cohesion: 0.47
Nodes (3): BigIntSerializerInterceptor, serializeBigInts(), Injectable

### Community 266 - "Autoresearch log"

Cohesion: 0.50
Nodes (3): Autoresearch log, Final checkpoint — 2026-07-20, Setup — 2026-07-20

### Community 271 - "cover-letter-editor.tsx"

Cohesion: 0.06
Nodes (38): DESIGN_OPTIONS, DesignMode, DesignModeToggle(), getClientSnapshot(), getServerSnapshot(), subscribeToHydration(), CoverLetterEditor(), CoverLetterEditorProps (+30 more)

### Community 275 - "Q: Does this application uses Ollama as a current LLM provider?"

Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Does this application uses Ollama as a current LLM provider?, Source Nodes

### Community 276 - "automation.dto.ts"

Cohesion: 0.21
Nodes (20): CoverLetterDto, DeadLetterJobsQueryDto, JobResultDto, MatchDto, NormalizedJobDto, NOTIFICATION_CHANNEL_VALUES, RecordNotificationDto, ApiProperty (+12 more)

### Community 284 - "HttpScraperClient"

Cohesion: 0.16
Nodes (10): backoffDelayMs(), delay(), fetchWithRetry(), FetchWithRetryOptions, isRetryableStatus(), parseRetryAfterMs(), HttpScraperClient, mapDeadLetterJob() (+2 more)

### Community 286 - "PolitenessGate"

Cohesion: 0.12
Nodes (19): AsyncBaseTransport, PolitenessGate, Check robots.txt for `url`, caching one parser per host., Per-host robots.txt cache and minimum-delay-with-jitter pacing. One instance is…, Initialize the gate. Args: user_agent: Descriptive UA string used both for…, Check robots.txt and pace the request for `url`'s host. Args: url: Absolute…, Release the internal robots.txt HTTP client., Sleep until the per-domain delay (plus jitter) has elapsed. (+11 more)

### Community 289 - "2026-07-22-jobs-list-pagination/proposal.md"

Cohesion: 0.29
Nodes (6): Capabilities, Impact, Modified Capabilities, New Capabilities, What Changes, Why

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

### Community 295 - "Crawl4aiFetcher"

Cohesion: 0.16
Nodes (17): AsyncWebCrawler, Crawl4aiFetcher, Browser-rendered fetcher via crawl4ai's `AsyncWebCrawler`. The browser is…, Initialize the fetcher. Args: gate: Shared politeness gate (robots + per-host…, Close the underlying browser, if one was started., Lazily start (once) and return the underlying crawler. Raises:…, _gate(), Tests for :class:`Crawl4aiFetcher`. The crawl4ai call itself is isolated behind… (+9 more)

### Community 297 - "Requirement: Keyboard-accessible drag and drop"

Cohesion: 0.40
Nodes (4): MODIFIED Requirements, Requirement: Keyboard-accessible drag and drop, Scenario: Keyboard move, Scenario: Keyboard move into an empty column

### Community 298 - "2026-07-22-jobs-list-pagination/design.md"

Cohesion: 0.40
Nodes (4): Context, Decisions, Goals / Non-Goals, Risks / Trade-offs

### Community 304 - "profiles.ts"

Cohesion: 0.18
Nodes (14): fromProfile(), ProfileForm(), createProfile(), CreateProfileBody, deleteProfile(), getActiveProfile(), getProfile(), listProfiles() (+6 more)

### Community 313 - "UnknownSourceError"

Cohesion: 0.16
Nodes (15): LookupError, CorrelationIdMiddleware, ASGIApp, BaseHTTPMiddleware, Reads or mints the request correlation id and echoes it on the response., Wrap `app` with correlation-id handling. Args: app: The ASGI application to…, AdapterListResponse, MarkProcessedRequest (+7 more)

### Community 316 - "upwork.py"

Cohesion: 0.14
Nodes (13): Materialize a posting from the cached listing entry (no re-fetch). Args: lead:…, parse_feed(), TypedDict, Upwork adapter — best-effort RSS, graceful degradation (docs/SOURCES.md).…, Relevant fields of one RSS `<item>`., Parse an RSS 2.0 feed into items. Args: text: Raw XML feed body. Returns: Well-…, RssItem, content_fingerprint() (+5 more)

### Community 317 - "automation.controller.ts"

Cohesion: 0.33
Nodes (12): DeadLetterJobResponse, DigestJobSummaryResponse, DigestMatchSummaryResponse, DigestResponse, DigestSentResponse, JobResultAckResponse, LlmProfileInputResponse, NotificationRecordedResponse (+4 more)

### Community 318 - "CorrelationIdMiddleware"

Cohesion: 0.18
Nodes (9): CorrelationIdMiddleware, ASGIApp, BaseHTTPMiddleware, Request, RequestResponseEndpoint, Response, Bind the request's correlation id for the duration of the request. The id is…, Reads or mints the request correlation id and echoes it on the response. (+1 more)

### Community 319 - "internal-token.guard.ts"

Cohesion: 0.28
Nodes (3): constantTimeEquals(), InternalTokenGuard, Injectable

### Community 320 - "get_correlation_id"

Cohesion: 0.33
Nodes (5): get_correlation_id(), LogRecord, Return the current request's correlation id, if one is bound. Returns: The…, Attach `correlation_id` to `record` and allow it through. Args: record: The…, test_correlation_id_is_cleared_after_the_request()

### Community 321 - ".get"

Cohesion: 0.40
Nodes (4): _extract_text(), Invoke the CLI and map its outcome to fetcher semantics. Isolated as its own…, Pull page content out of the CLI's stdout. Tries structured JSON first (a…, Render `url` via the agent-browser CLI. Args: url: Absolute URL to fetch.…

### Community 322 - ".filter"

Cohesion: 0.33
Nodes (5): get_correlation_id(), LogRecord, Return the current request's correlation id, if one is bound. Returns: The…, Attach `correlation_id` to `record` and allow it through. Args: record: The…, test_correlation_id_is_cleared_after_the_request()

### Community 323 - "scraper/tests/test_observability.py"

Cohesion: 0.33
Nodes (5): Tests for structured logging + correlation-id propagation., test_incoming_correlation_id_is_echoed(), test_malformed_correlation_id_is_rejected_and_a_fresh_one_is_minted(), test_missing_correlation_id_is_minted_and_echoed(), test_overlong_correlation_id_is_rejected_and_a_fresh_one_is_minted()

### Community 324 - ".dispatch"

Cohesion: 0.40
Nodes (4): Request, RequestResponseEndpoint, Response, Bind the request's correlation id for the duration of the request. The id is…

### Community 325 - "app.module.ts"

Cohesion: 0.05
Nodes (34): PLACEHOLDER_ENV, AppModule, Module, API_CONFIG_NAMESPACE, ApiConfig, ApiEnv, apiEnvSchema, CoverLettersModule (+26 more)

## Knowledge Gaps

- **1599 isolated node(s):** `evaluatorDirectory`, `projectRoot`, `webRoot`, `nextBinary`, `port` (+1594 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **38 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions

_Questions this graph is uniquely positioned to answer:_

- **Why does `CorrelationIdMiddleware` connect `UnknownSourceError` to `llm/tests/test_observability.py`, `.dispatch`, `llm/main.py`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Why does `FakeCursor` connect `RawJobPosting` to `JobLead`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **Why does `RawJobPosting` connect `RawJobPosting` to `SearchQuery`, `JobLead`, `Database`, `test_adapters.py`, `upwork.py`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **Are the 54 inferred relationships involving `TestClient` (e.g. with `test_cover_letter_endpoint()` and `test_cover_letter_endpoint_selects_prompt_by_provider_kind()`) actually correct?**
  _`TestClient` has 54 INFERRED edges - model-reasoned connections that need verification._
- **Are the 18 inferred relationships involving `ProviderRow` (e.g. with `CoverLetterRequest` and `CreateProviderRequest`) actually correct?**
  _`ProviderRow` has 18 INFERRED edges - model-reasoned connections that need verification._
- **What connects `evaluatorDirectory`, `projectRoot`, `webRoot` to the rest of the system?**
  _1599 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._
