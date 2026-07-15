# Wiki Schema — job-hunter session-context wiki

This directory is an **LLM-maintained wiki** (Karpathy's llm-wiki pattern,
gist `442a6bf555914893e9891c11519de94f`). Its primary purpose: **persist
working context so any fresh session — or a different model — can restore
full project state.**

The human curates sources and asks questions; the LLM does all writing,
cross-referencing, and bookkeeping here.

## Layers

| Layer       | Location                                                                                                                                                                | Rules                                                                                         |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Raw sources | `../PROGRESS.md`, `../docs/*.md`, `../README.md` (canonical project docs, referenced in place) + `raw/` (dropped-in external material: articles, transcripts, snippets) | **Immutable from the wiki's perspective** — read, never modify as part of wiki work.          |
| Wiki pages  | `pages/*.md`                                                                                                                                                            | Owned entirely by the LLM. Synthesis, not duplication: summarize and **link to** raw sources. |
| Schema      | this file                                                                                                                                                               | Conventions & workflows. Co-evolves with the human.                                           |

## Page conventions

- Filenames: `kebab-case.md`. One H1 title per page.
- YAML frontmatter: `updated: YYYY-MM-DD`, `sources: [relative paths]`.
- Cross-reference with relative markdown links (`[architecture](architecture.md)`).
- Every page must be listed in `index.md` with a one-line summary.
- Cite sources at the bottom of each page.

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

## Log format (`log.md`, append-only)

```
## [YYYY-MM-DD] ingest|query|checkpoint|lint | Title
one-paragraph note
```

Greppable: `grep "^## " log.md`.

## Search (qmd)

Collection `job-hunter-wiki` covers this directory.

- `qmd search "term"` — BM25, instant, exact terms/identifiers.
- `qmd vsearch "question"` / `qmd query "question"` — semantic / full hybrid
  (first use downloads ~2 GB of local GGUF models).
