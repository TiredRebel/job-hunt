## 1. Lock the behavior contract (Luna agent A)

- [x] 1.1 Search the repository for imports and runtime uses of `DouAdapter`, `WorkUaAdapter`, `JobUaAdapter`, `content_selector`, `_FACTORIES`, and `create_adapter`; record any consumer not already covered by the design before deleting a class.
- [x] 1.2 Extend adapter tests to pin DOU/Work.ua `search` parameters, Job.ua `q`, configurable `list_url`, probe URL, detail selectors, extracted text, and stable fingerprints using fakes/fixtures only.
- [x] 1.3 Extend registry tests to pin the full `known_slugs()` set and the `FetcherFactory` content-probe argument for DOU, Work.ua, Job.ua, Reddit, and Upwork.
- [x] 1.4 Run focused contract tests with `uv run pytest --no-cov tests/test_adapters.py tests/test_registry.py` from `services/scraper`; use `--no-cov` because the repository-wide 90% coverage gate is not meaningful for a two-file selection.

## 2. Deepen the static-HTML adapter module (Luna agent A)

- [x] 2.1 Add a fully typed, documented, frozen/slotted static-source definition and `StaticHtmlAdapter` that implement the shared discovery, detail, fingerprint, and probe lifecycle through `PageFetcher`.
- [x] 2.2 Convert `dou.py` to export its existing parser plus an immutable DOU source definition; preserve defaults, `search`, selector, lead fields, malformed-card handling, and fixture outputs.
- [x] 2.3 Convert `workua.py` to export its existing parser plus an immutable Work.ua source definition; preserve absolute URL construction and all current behavior.
- [x] 2.4 Convert `jobua.py` to export its existing parser plus an immutable Job.ua source definition; preserve nested vacancy-ID parsing, absolute URLs, `q`, and all current behavior.
- [x] 2.5 Remove only the three obsolete wrapper classes/imports after the repository search confirms no remaining consumer, then run adapter tests, Ruff on touched files, and mypy.

## 3. Make registry wiring explicit (Luna agent B, after section 2)

- [x] 3.1 Introduce a typed, documented, frozen/slotted `AdapterRegistration` containing an adapter factory and `str | None` content probe.
- [x] 3.2 Add a typed static-source registration builder that derives the bound `StaticHtmlAdapter` factory and probe selector from the same source definition.
- [x] 3.3 Replace `_FACTORIES` with explicit registrations for all five sources and update `known_slugs()`/`create_adapter()` without changing their public signatures or error behavior.
- [x] 3.4 Remove `getattr(..., "content_selector", None)` and class-attribute transport metadata; pass `registration.content_probe` directly to `FetcherFactory`.
- [x] 3.5 Rewrite registry tests to exercise returned adapters through `probe()`/`discover()` instead of casting to removed concrete classes, and verify politeness overrides still reach every fetch.
- [x] 3.6 Run focused registry/adapter tests, Ruff on touched files, and mypy; resolve typing with precise aliases/builders rather than `Any` expansion or blanket casts.

## 4. Documentation and architecture guardrails (Luna agent C)

- [x] 4.1 Update `docs/ARCHITECTURE.md` and relevant source documentation to describe immutable static-source definitions, the shared adapter, and explicit registry probe metadata.
- [x] 4.2 Document that source-specific parsers remain independent and that Reddit/Upwork remain dedicated adapters because their behavior differs materially.
- [x] 4.3 Update `PROGRESS.md` with the implemented change, exact validation commands/results, and the architecture-review recommendations intentionally deferred with rationale.

## 5. Integrated verification and cleanup (coordinator)

- [x] 5.1 Run `uv run pytest --no-cov tests/test_adapters.py tests/test_registry.py` and the complete coverage-gated scraper test suite from `services/scraper`.
- [x] 5.2 Run the scraper's canonical Ruff format/check and mypy commands from repository configuration; make only task-related fixes.
- [x] 5.3 Run `openspec validate simplify-static-html-adapters --strict` and `openspec status --change simplify-static-html-adapters --json`; confirm all artifacts are valid and implementation tasks accurately reflect completion.
- [x] 5.4 Review `git diff --check`, changed-file scope, and final diff to ensure no API/schema/dependency changes or unrelated refactors entered the change.
