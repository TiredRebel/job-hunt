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

See the wiki-ops skill for ingest/query/checkpoint/restore/lint procedures.

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

## graphify

- **graphify** (`~/.claude/skills/graphify/SKILL.md`) - any input to knowledge graph. Trigger: `/graphify`
  When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:

- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
