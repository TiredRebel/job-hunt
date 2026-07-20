# Autoresearch log

Record run-level decisions and synthesized findings here. The machine-readable ledger is `results.jsonl`.

## Setup — 2026-07-20

- Mode: setup only; no experiments or baseline measurements authorized yet.
- Primary target: deterministic gzip bytes referenced by the production `/en/jobs` response.
- Usability protection: existing EN/UA desktop and mobile Playwright regression plus all web lint, typecheck, and unit-test gates.
- Proposed budget: eight experiments or two hours, stopping after three consecutive failures.

## Final checkpoint — 2026-07-20

- Baseline: 394246 deterministic gzip bytes for the initial `/en/jobs` JavaScript assets.
- Best confirmed result: 356279 gzip bytes at commit `3593a9f` (`exp-0008`).
- Improvement: -37967 bytes, or 9.63% versus baseline.
- Accepted experiments: `exp-0001` lazy-loaded the job detail drawer (-2453 bytes),
  `exp-0003` deferred the global command palette (-5008 bytes), and `exp-0008`
  split SSR-enabled jobs-table hydration (-30506 bytes).
- Discarded experiments: shortcuts dialog (+2 bytes), bulk action bar (744-byte
  near-miss), empty state (+336 bytes), package import optimization (no change),
  and summary hydration (607-byte near-miss).
- Ledger: 1 baseline, 3 keep, 5 discard, 0 crash, 0 invalid; all eight experiment
  slots were used.
- Final gates: lint passed with two pre-existing React Compiler warnings, strict
  typecheck passed, 69 web unit tests passed, and 3 focused EN/UA desktop/mobile
  Playwright regressions passed.
- Reproduce the best metric with `node .autoresearch/evaluator/jobs-route-bundle.mjs`.
  The metric measures initial JavaScript referenced by the production `/en/jobs`
  HTML response; it does not measure API latency, server-render time, or deferred
  chunks after interaction.
