# Autoresearch log

Record run-level decisions and synthesized findings here. The machine-readable ledger is `results.jsonl`.

## Setup — 2026-07-20

- Mode: setup only; no experiments or baseline measurements authorized yet.
- Primary target: deterministic gzip bytes referenced by the production `/en/jobs` response.
- Usability protection: existing EN/UA desktop and mobile Playwright regression plus all web lint, typecheck, and unit-test gates.
- Proposed budget: eight experiments or two hours, stopping after three consecutive failures.
