## Why

The architecture review identified real duplication across the DOU, Work.ua, and Job.ua static-HTML adapters and an implicit `getattr`-based content-probe contract in the adapter registry. Consolidating those mechanics will reduce maintenance cost and make fetcher escalation wiring explicit without changing scraping behavior or weakening the service's Clean Architecture boundaries.

## What Changes

- Replace the three structurally identical static-HTML adapter classes with one typed, shared implementation that is configured by source-specific URL construction, list parsing, and detail selectors.
- Keep DOU, Work.ua, and Job.ua parsing functions source-specific and fixture-tested so site-specific markup remains isolated and easy to repair.
- Replace registry duck typing of `content_selector` with an explicit, immutable registration record containing the adapter factory and optional content-probe selector.
- Preserve the `SourceAdapter` and `PageFetcher` ports, registered slugs, query semantics, detail extraction, content fingerprints, politeness overrides, and HTTP-first escalation behavior.
- Update architecture/source documentation and regression tests for the deeper module and explicit wiring.
- Explicitly defer the review's NestJS service collapse, shared `LlmAdminService` mapper, and generated web-resource proposals: current services contain orchestration or boundary translation, while the proposed shared/generated abstractions lack a demonstrated second consumer. LLM provider-kind cleanup is also outside this cohesive scraper change.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `fetch-strategy-ladder`: Make adapter-relevant content probes explicit registry metadata and require behavior-preserving shared mechanics for static-HTML sources.

## Impact

- Affected code: `services/scraper/src/scraper/adapters/`, `services/scraper/src/scraper/registry.py`, and scraper adapter/registry tests.
- Affected documentation: scraper architecture and source-adapter guidance.
- Public HTTP APIs, database schemas, dependencies, source slugs, and deployment topology remain unchanged.
- The change is internal and non-breaking; recorded HTML fixtures remain the acceptance oracle and no live-site calls are added to CI.
