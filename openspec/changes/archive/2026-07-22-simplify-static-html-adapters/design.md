## Context

The scraper currently implements DOU, Work.ua, and Job.ua as separate classes. Their listing parsers differ, but their lifecycle is identical: resolve a configurable list URL, fetch one search page with one source-specific query parameter, parse leads, fetch detail HTML, extract one CSS-selected content block, fingerprint it, and expose the list URL as a connectivity probe.

The registry also discovers the CSS selector with `getattr(factory, "content_selector", None)`. That selector is not part of `SourceAdapter`; it is metadata needed before adapter construction by the fetcher escalation layer. This implicit class-attribute convention is therefore both easy to miss and incorrectly located.

The review also recommends collapsing several NestJS services. Inspection shows those services perform not-found/conflict mapping, bulk-operation guards, source/scrape orchestration, and remote error translation. Direct controller-to-repository wiring would bypass the documented presentation → application → port boundary. That recommendation is rejected for this change.

Constraints:

- Preserve all source-visible behavior and public service contracts.
- Keep source markup knowledge local and fixture-tested.
- Keep adapters dependent only on the `PageFetcher` port.
- Use Python 3.12 typing, docstrings, Ruff, pytest, and the repository's `uv` workflow.
- Add no dependency and make no live-site request in tests.

## Goals / Non-Goals

**Goals:**

- Remove repeated static-HTML adapter lifecycle code.
- Make content-probe wiring explicit and statically inspectable.
- Keep DOU, Work.ua, and Job.ua parsing independently maintainable.
- Preserve registered slugs, request URLs/parameters, raw text extraction, content hashes, connectivity probes, and politeness propagation.
- Leave a task sequence and acceptance checks precise enough for bounded GPT Luna implementation agents.

**Non-Goals:**

- Changing `SourceAdapter`, `PageFetcher`, HTTP APIs, persistence, scheduling, or fetch-strategy semantics.
- Combining the Reddit or Upwork adapters with HTML adapters; their caching, API/feed, and anti-bot behavior is materially different.
- Removing NestJS application services or moving repositories into controllers.
- Introducing a shared LLM exception mapper before a second consumer exists.
- Generating Next.js resource modules from OpenAPI or changing web code.
- Refactoring LLM provider kinds as part of an unrelated scraper change.

## Decisions

### D1. Share mechanics through one concrete static-HTML adapter

Add a typed, immutable source definition (a frozen, slotted dataclass) and a `StaticHtmlAdapter` in the existing adapters package. The definition carries only stable source mechanics:

- `slug`
- `default_list_url`
- `search_parameter`
- `content_selector`
- a typed `parse_list(html) -> list[JobLead]` callable

`StaticHtmlAdapter` owns list URL override handling, discovery iteration, detail fetching/building, and probing. Its instance exposes `slug` to satisfy `SourceAdapter` and retains a private fetcher. The definition is passed explicitly when its factory is constructed.

Alternative considered: a configurable inheritance base with three empty subclasses. Rejected because subclasses would remain nominal wrappers whose only purpose is constants; composition exposes the real varying data with less code.

Alternative considered: place all parsers and mechanics in one large file. Rejected because source markup changes independently. The shared module should be deep, while `dou.py`, `workua.py`, and `jobua.py` continue to own parsers and their source definitions.

### D2. Register factories and content probes as explicit metadata

Replace `_FACTORIES` with a typed map of immutable `AdapterRegistration` values. Each registration contains:

- `factory: AdapterFactory`
- `content_probe: str | None`

A small registration builder for static definitions derives both the partially bound adapter factory and the probe selector from the same definition. Reddit and Upwork use ordinary registrations with `content_probe=None`. `create_adapter` reads `registration.content_probe` directly; no `getattr`, class inspection, or optional member is added to `SourceAdapter`.

Alternative considered: add `content_selector` to `SourceAdapter`. Rejected because the registry needs the value before construction and non-HTML adapters do not share that concept.

Alternative considered: pass a separate selector map beside the factory map. Rejected because parallel maps can drift. One registration is the atomic wiring unit.

### D3. Preserve source modules as compatibility and repair seams

The three source modules keep their public `parse_list` functions and source-specific constants/definitions. Existing parser imports and fixture tests remain valid. Nominal `DouAdapter`, `WorkUaAdapter`, and `JobUaAdapter` classes are removed unless repository-wide search finds a documented public consumer that cannot migrate to registry construction.

Tests that currently cast to `DouAdapter` solely to reach `_fetcher` will instead exercise the returned `SourceAdapter` through `probe()` or `discover()`. Tests should validate behavior, not a removed concrete type.

### D4. Treat existing outputs as the migration contract

Before deleting wrappers, add/adjust tests that pin:

- all five values returned by `known_slugs()`;
- DOU and Work.ua `search` parameters and Job.ua `q` parameter;
- configured `list_url` override behavior;
- each detail selector and stable fingerprint behavior;
- explicit selector passed to the `FetcherFactory` for all three static sources and `None` for Reddit/Upwork;
- source-level politeness overrides reaching the bound fetcher;
- parser outputs from existing recorded fixtures.

The implementation passes when focused scraper tests, the full scraper test suite, Ruff, and mypy all pass. A source/adapter line-count comparison is informational only; correctness is not traded for a deletion target.

### D5. Document rejected review recommendations

Update the relevant architecture/source documentation with the registration model and the distinction between shared mechanics and source-specific parsing. Do not alter unrelated service code. The proposal and this design are the decision record for rejected recommendations; no speculative abstraction is created merely to mirror the report.

## Risks / Trade-offs

- **[Risk] A shared adapter can accidentally homogenize source-specific behavior.** → Keep query parameter, parser, URLs, and selector in immutable per-source definitions and pin each in tests.
- **[Risk] `functools.partial` can make factory typing opaque.** → Define the factory/registration types explicitly, use a typed builder, and require mypy to pass without broad casts.
- **[Risk] Removing concrete classes breaks internal test imports.** → Search the repository first, migrate internal consumers to registry/public behavior, and retain only parser-level public seams.
- **[Risk] Selector metadata could diverge from detail extraction.** → Derive the registration probe and adapter detail selector from the same source definition.
- **[Trade-off] Registry entries become slightly more verbose.** → The verbosity is intentional: transport-relevant metadata becomes explicit and reviewable.

## Migration Plan

1. Establish regression tests for factory probe arguments, query parameters, URL override, detail extraction, and existing politeness behavior.
2. Add the immutable source definition and shared adapter without removing existing adapters; type-check it in isolation.
3. Convert DOU, Work.ua, and Job.ua definitions one at a time and update registry registrations.
4. Remove the three wrapper classes and duplicated lifecycle code after repository-wide import checks.
5. Run focused tests after each source conversion, then run the full scraper quality suite.
6. Update architecture/source docs and record final verification in `PROGRESS.md`.

Rollback is a normal source revert: no data, API, migration, or deployment compatibility step is involved.

## Open Questions

None. If implementation reveals a concrete external import of a removed class, preserve a temporary alias only when that consumer cannot be migrated within this repository, and document it before proceeding.
