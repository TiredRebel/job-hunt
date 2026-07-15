# Coding Standards

## Universal
- **Clean Architecture** layering per service (see ARCHITECTURE.md §3); domain layer framework-free.
- Small, single-purpose modules; no god-classes; composition over inheritance.
- All public APIs documented via OpenAPI; DTOs validated at the boundary (zod / pydantic).
- **Conventional Commits** (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`); imperative subject ≤ 72 chars.
- No secrets in code, config files, or DB — env vars only; `.env` is git-ignored, `.env.example` is the contract.
- Errors: never swallow; typed error results at layer boundaries; structured logs with correlation ids.

## TypeScript (`apps/web`, `apps/api`, `packages/*`)
- **Strict mode everywhere**: `strict: true`, `noUncheckedIndexedAccess: true`, `noImplicitOverride: true`, `exactOptionalPropertyTypes: true`; no `any` (use `unknown` + narrowing); no non-null `!` assertions without a comment justifying invariant.
- **Comprehensive documentation — TSDoc**:
  - Every exported function/class/type gets a TSDoc block: summary, `@param` for each parameter, `@returns`, `@throws` where applicable, `@example` for non-obvious APIs.
  - Every module starts with a `@module`/`@fileoverview` header block: purpose, responsibilities, key collaborators.
  - Enforced by `eslint-plugin-jsdoc` (`recommended-typescript-error`: require-jsdoc on exports, require-param, require-returns, check-param-names); undocumented exports fail lint.
  - Non-exported helpers: document when intent isn't obvious from name + types; comments explain *why*, not *what*.
- ESLint flat config + `typescript-eslint` (strict-type-checked) + Prettier (no style debates).
- Imports: absolute via path aliases; barrel files avoided in `api` (breaks tree-shaking/DI clarity).
- Tests: **Vitest** for unit (application/domain), **supertest** for controllers, **Playwright** for web e2e.
- NextJS: App Router, Server Components by default, client components only when interactive; data fetching in server layer, never in components via raw fetch to third parties.
- NestJS: one module per bounded context; providers depend on **ports (abstract classes/interfaces)**, bound in module providers.

## Python (`services/scraper`, `services/llm`)
- Python 3.12+, **uv** for dependency management, venvs and task running (`uv run`, `uv sync`); `pyproject.toml` per service; lockfile (`uv.lock`) committed.
- **PEP 8** compliance enforced by **ruff** — lint + format (line length 100, rules: E,F,W,I,N,UP,B,ASYNC,S,TID,**D**,C4,SIM,RUF); ruff-format replaces black.
- **Typings everywhere**: full type hints on all functions, methods and module-level values (params + return, including `-> None`); **mypy --strict** on the whole package, not just domain (`disallow_untyped_defs`, `warn_return_any`); modern syntax (`list[str]`, `X | None`, `Self`, `TypedDict`/`Protocol` for structural contracts).
- **Docstrings mandatory** (ruff `D` / pydocstyle, Google convention): every module, class and public function — summary line, `Args:`, `Returns:`, `Raises:`, `Examples:` for non-obvious APIs. Private helpers documented when intent isn't obvious.
- **Prefer `itertools` / `functools` over hand-rolled loops and state**: `itertools.chain/groupby/islice/batched/pairwise` for iteration pipelines; `functools.lru_cache/cache` for memoization, `functools.partial` over lambdas capturing args, `functools.reduce` only where clearer than a loop; generators over intermediate lists for large scrape batches.
- Async-first (httpx, asyncpg/SQLAlchemy 2 async, arq); no blocking IO in request handlers.
- Pydantic v2 models at boundaries; `@dataclass(frozen=True, slots=True)` or plain classes in domain.
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
