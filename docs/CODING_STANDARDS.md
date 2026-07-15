# Coding Standards

## Universal
- **Clean Architecture** layering per service (see ARCHITECTURE.md §3); domain layer framework-free.
- Small, single-purpose modules; no god-classes; composition over inheritance.
- All public APIs documented via OpenAPI; DTOs validated at the boundary (zod / pydantic).
- **Conventional Commits** (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`); imperative subject ≤ 72 chars.
- No secrets in code, config files, or DB — env vars only; `.env` is git-ignored, `.env.example` is the contract.
- Errors: never swallow; typed error results at layer boundaries; structured logs with correlation ids.

## TypeScript (`apps/web`, `apps/api`, `packages/*`)
- `strict: true`, `noUncheckedIndexedAccess: true`; no `any` (use `unknown` + narrowing).
- ESLint flat config + `typescript-eslint` (strict-type-checked) + Prettier (no style debates).
- Imports: absolute via path aliases; barrel files avoided in `api` (breaks tree-shaking/DI clarity).
- Tests: **Vitest** for unit (application/domain), **supertest** for controllers, **Playwright** for web e2e.
- NextJS: App Router, Server Components by default, client components only when interactive; data fetching in server layer, never in components via raw fetch to third parties.
- NestJS: one module per bounded context; providers depend on **ports (abstract classes/interfaces)**, bound in module providers.

## Python (`services/scraper`, `services/llm`)
- Python 3.12+, `uv` for dependency management; `pyproject.toml` per service.
- **ruff** — lint + format (line length 100, rules: E,F,I,N,UP,B,ASYNC,S,TID); **mypy --strict** on `domain/` and `application/`.
- Async-first (httpx, asyncpg/SQLAlchemy 2 async, arq); no blocking IO in request handlers.
- Pydantic v2 models at boundaries; `@dataclass(frozen=True)` or plain classes in domain.
- Tests: **pytest** + pytest-asyncio; scraper parsers tested against recorded fixtures (zero live HTTP in CI); coverage gate ≥ 80% on domain/application.

## SQL / migrations
- dbmate; every migration reversible (`-- migrate:up` / `-- migrate:down`); never edit applied migrations.
- snake_case identifiers; timestamps are `timestamptz`; every table has `created_at`.

## Git hygiene
- `main` always green; feature branches `feat/<scope>-<desc>`.
- Pre-commit: lint-staged (eslint+prettier) / pre-commit (ruff, mypy on changed files).
- PR checklist: tests added, docs updated (PROGRESS.md tick), no lint suppressions without comment.

## Definition of Done (per feature)
1. Code + tests pass locally (`npm run check`, `uv run poe check`).
2. OpenAPI/docs updated; TS client regenerated if contracts changed.
3. PROGRESS.md checkbox updated + log entry.
