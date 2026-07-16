---
name: llm-wiki
description: >-
  Build and maintain a persistent LLM-owned markdown wiki (Karpathy llm-wiki
  pattern). Use when bootstrapping a knowledge base, ingesting sources,
  querying the wiki, running lint/checkpoint/restore, or when the user mentions
  llm-wiki, session context wiki, wiki ingest, or compounding agent memory.
---

# LLM Wiki (Karpathy Pattern)

Source gist: https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f

**Core idea:** Don't re-derive knowledge from raw files on every query (RAG). The LLM **compiles once, keeps current** — a structured, interlinked markdown wiki that compounds with every source and every good answer.

**Roles:** Human curates sources, asks questions, steers analysis. LLM writes, cross-references, and maintains everything in the wiki.

## Three Layers

```
raw/              ← immutable sources (articles, PDFs, notes, transcripts)
wiki/             ← LLM-owned markdown pages (synthesis, entities, concepts)
wiki/CLAUDE.md    ← schema: conventions + workflows (or AGENTS.md for Codex)
```

| Layer       | Owner                  | Rule                                              |
| ----------- | ---------------------- | ------------------------------------------------- |
| Raw sources | Human drops, LLM reads | Never modify during wiki work                     |
| Wiki pages  | LLM                    | Synthesize and link — don't duplicate raw sources |
| Schema      | Human + LLM co-evolve  | Defines structure and operations                  |

## Required Wiki Files

| File            | Orientation     | Purpose                                                                           |
| --------------- | --------------- | --------------------------------------------------------------------------------- |
| `wiki/index.md` | Content catalog | Every page: link + one-line summary. Read first on query. Update on every ingest. |
| `wiki/log.md`   | Chronological   | Append-only timeline of ingests, queries, lint, checkpoints                       |

Log entry format (greppable):

```
## [YYYY-MM-DD] ingest|query|lint|checkpoint | Title
one-paragraph note
```

## Operations

### ingest

1. Read the new/changed source in `raw/` (or canonical project docs referenced in place)
2. Discuss key takeaways with the human if non-trivial
3. Write/update wiki pages — one source may touch many pages
4. Update `index.md`
5. Append to `log.md`

Prefer one source at a time with human review unless batching is requested.

### query

1. Read `index.md` first
2. Follow links to relevant pages (or use search — see Optional Tools)
3. Synthesize answer with citations to wiki pages and raw sources
4. **File valuable answers back** into the wiki as new/updated pages so explorations compound

### lint

Periodic health check. Look for:

- Contradictions between pages
- Stale claims superseded by newer sources
- Orphan pages (no inbound links)
- Concepts mentioned but lacking dedicated pages
- Missing cross-references
- Drift between wiki and canonical project docs

Fix issues or report them; append a `lint` entry to `log.md`.

### checkpoint (session-context variant)

For **project wikis** that persist working state across agent sessions:

1. Update `wiki/pages/current-state.md` — phase status, in-flight work, blockers, next steps, exact resume commands
2. Append a `checkpoint` entry to `log.md`

Run on request or after significant milestones.

### restore

Fresh session rebuilds context by reading, in order:

1. `wiki/index.md`
2. `wiki/pages/current-state.md` (if present)
3. Linked pages as needed
4. Tail of `wiki/log.md` for recent history

Verify claims against canonical project docs when they exist (e.g. `PROGRESS.md` wins over wiki if they disagree — run lint).

## Page Conventions

- Filenames: `kebab-case.md`, one H1 per page
- YAML frontmatter: `updated: YYYY-MM-DD`, `sources: [relative paths]`
- Cross-reference with relative markdown links
- Cite raw sources at the bottom of each page
- Every page listed in `index.md`

## Bootstrap a New Wiki

When no wiki exists yet:

1. Create `wiki/`, `raw/` (if needed), `wiki/index.md`, `wiki/log.md`
2. Write `wiki/CLAUDE.md` schema — adapt from [reference.md](reference.md)
3. Catalog existing canonical docs in `index.md` as raw sources (read in place, don't copy)
4. Ingest the most important sources first
5. For code projects: add `pages/current-state.md` and seed from README/PROGRESS

Do not over-scaffold. Start minimal; co-evolve the schema with the human.

## Optional Tools

| Tool         | When                                                                          |
| ------------ | ----------------------------------------------------------------------------- |
| **qmd**      | Wiki outgrows index-only navigation. Hybrid BM25/vector search over markdown. |
| **Obsidian** | Browse graph, wikilinks, Dataview queries on frontmatter                      |
| **git**      | Wiki is just markdown — version history for free                              |

At small scale (~100 sources, hundreds of pages), `index.md` alone is often enough.

### qmd setup (when needed)

```bash
# Install: https://github.com/tobi/qmd (or package manager of choice)
qmd collection add job-hunter-wiki ./wiki
qmd search "term"          # BM25 — exact terms/identifiers
qmd vsearch "question"     # semantic (first use may download local GGUF models)
qmd query "question"       # hybrid
```

Prefer plain search terms (avoid hyphens/slashes in BM25 queries). Collection name and path are project-specific — see this repo's `wiki/CLAUDE.md` / `wiki/index.md`.

## Anti-Patterns

- Duplicating full raw source text into wiki pages
- Modifying immutable raw sources during wiki maintenance
- Letting good query answers die in chat history instead of filing them
- Skipping `index.md` updates after ingests
- Building embedding/RAG infrastructure before the index file becomes insufficient

## Additional Resources

- Schema template and page examples: [reference.md](reference.md)
- This repo's live schema: `wiki/CLAUDE.md`
