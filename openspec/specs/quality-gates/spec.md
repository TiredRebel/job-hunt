# quality-gates

## Purpose

Enforced test-coverage thresholds (TS + Python) on the domain/application
layers, set from measured coverage and ratcheted upward only, plus a
Playwright happy-path job in CI against a provisioned, seeded stack.

## Requirements

### Requirement: Test coverage is measured and gated

Each service with a test suite SHALL measure line/branch coverage as part of
its test command and SHALL fail when coverage of its domain/application code
drops below a configured threshold. Coverage measurement SHALL scope to the
domain/application layers that `CODING_STANDARDS.md` targets (≥ 80%), not the
whole tree, so generated code, framework glue, and thin infrastructure
adapters do not distort the gate. Thresholds SHALL be set from the code's
current measured coverage and only ratcheted upward, so enabling the gate
never wedges CI on pre-existing untested legacy code.

#### Scenario: Coverage below threshold fails the suite

- **WHEN** a change lowers domain/application coverage below the configured
  threshold
- **THEN** the coverage-enabled test command exits non-zero and CI fails

#### Scenario: Coverage at or above threshold passes

- **WHEN** the test suite runs with domain/application coverage at or above
  the configured threshold
- **THEN** the command exits zero

### Requirement: CI enforces coverage and the e2e happy path

CI SHALL run every service's test suite with coverage enforcement enabled,
and SHALL run the Playwright happy-path end-to-end test against a booted,
seeded application stack. The e2e job SHALL provision the stack (database +
services) and seed the minimum data the happy path needs, so it does not
depend on a developer's local environment.

#### Scenario: Coverage gate runs in CI

- **WHEN** CI runs on a pull request
- **THEN** each service's tests run with coverage enforcement and a
  below-threshold result fails the pipeline

#### Scenario: E2e happy path runs in CI

- **WHEN** CI runs on a pull request
- **THEN** a dedicated job boots and seeds the stack and runs the Playwright
  happy-path test to completion, failing the pipeline if it fails
