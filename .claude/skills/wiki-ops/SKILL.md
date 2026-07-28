---
name: wiki-ops
description: Ingest, query, checkpoint, restore, or lint the job-hunter session-context wiki in wiki/.
---

## Operations

- **ingest** — read a new/changed source → discuss takeaways → write/update
  summary + affected pages → update `index.md` → append to `log.md`.
- **query** — read `index.md` first, follow links (or use `qmd`), answer with
  citations; file valuable answers back into pages so explorations compound.
- **checkpoint** ⭐ (the core operation of this wiki) — on request, or after any
  significant milestone/phase change: update `pages/current-state.md`
  (phase status, in-flight work, blockers, next steps, exact resume commands),
  then append a `checkpoint` entry to `log.md`.
- **restore** ⭐ — a fresh session rebuilds context by reading, in order:
  1. `index.md` → 2. `pages/current-state.md` → 3. linked pages as needed
     → 4. tail of `log.md` for recent history.
- **lint** — periodic health check: contradictions vs. raw docs, stale claims
  (esp. current-state drift vs. `../PROGRESS.md`), orphan pages, missing links.
