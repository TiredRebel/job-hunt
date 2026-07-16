# LLM Wiki — Reference Templates

## Schema Template (`wiki/CLAUDE.md`)

Adapt sections to your domain. Keep under ~80 lines in the skill; expand here.

```markdown
# Wiki Schema — [project name]

LLM-maintained wiki (Karpathy llm-wiki pattern, gist 442a6bf555914893e9891c11519de94f).
Purpose: persist working context so any fresh session can restore full project state.

## Layers

| Layer       | Location                                    | Rules                                         |
| ----------- | ------------------------------------------- | --------------------------------------------- |
| Raw sources | `raw/` + canonical docs (README, docs/*.md) | Immutable — read, never modify from wiki work |
| Wiki pages  | `pages/*.md`                                | LLM-owned synthesis; link to sources          |
| Schema      | this file                                   | Conventions & workflows; co-evolve with human |

## Page conventions

- Filenames: kebab-case.md. One H1 per page.
- Frontmatter: updated, sources
- Cross-reference with relative links
- Every page in index.md with one-line summary
- Cite sources at page bottom

## Operations

- ingest — read source → discuss → update pages → index → log
- query — index first → follow links → cite → file good answers back
- checkpoint — update current-state.md → append log
- restore — index → current-state → linked pages → log tail
- lint — contradictions, stale claims, orphans, missing links

## Log format

## [YYYY-MM-DD] ingest|query|lint|checkpoint | Title

one-paragraph note
```

## Index Template (`wiki/index.md`)

```markdown
# Index — [project] wiki

> Read this first. For session restore: go to [current-state](pages/current-state.md).

## Context pages

| Page                                    | Summary                                               |
| --------------------------------------- | ----------------------------------------------------- |
| [current-state](pages/current-state.md) | Session checkpoint: status, blockers, resume commands |
| [overview](pages/overview.md)           | What this is, goals, layout                           |

## Raw sources (read in place — never edit from wiki)

| Source           | One-liner              |
| ---------------- | ---------------------- |
| `../README.md`   | Repo intro and setup   |
| `../PROGRESS.md` | Living phase checklist |

## Tooling

- qmd collection `[name]-wiki` over this dir (optional)
```

## Current-State Template (`wiki/pages/current-state.md`)

```markdown
---
updated: YYYY-MM-DD
sources: [../../PROGRESS.md]
---

# Current state — session checkpoint

> Restore: read this page → overview → architecture → decisions.
> Verify against PROGRESS.md (canonical checklist wins).

## Where the project stands

- Phase N — status: bullets with concrete facts, commit refs, test counts

## Next up

One paragraph on the immediate next action.

## In-flight / open threads

- Unresolved items

## Resume commands

\`\`\`bash
cd /path/to/project

# exact commands to verify state

\`\`\`
```

## Example Ingest Log Entry

```markdown
## [2026-07-15] ingest | Wiki bootstrapped (Karpathy llm-wiki pattern)

Instantiated schema, index, log. Seed-ingested PROGRESS.md and ARCHITECTURE.md
→ wrote project-overview, architecture pages. Remaining docs catalogued as raw
sources in index.md.
```

## Example Query → File Back

When the human asks "how does auth work?" and the answer synthesizes three pages:

1. Answer in chat with citations
2. If the synthesis is reusable, create/update `pages/auth-flow.md`
3. Add to `index.md`
4. Append `## [date] query | Auth flow synthesis` to `log.md`

## Project Wiki vs Personal Wiki

| Aspect            | Personal/research wiki          | Project session-context wiki         |
| ----------------- | ------------------------------- | ------------------------------------ |
| Primary goal      | Accumulate domain knowledge     | Restore agent working state          |
| Key page          | synthesis.md, entity pages      | current-state.md                     |
| Raw sources       | Articles, papers, notes in raw/ | Canonical repo docs + raw/           |
| Checkpoint        | Optional                        | Core operation                       |
| Lint vs canonical | N/A                             | Compare current-state vs PROGRESS.md |

## qmd Collection Setup

When `index.md` is no longer enough:

1. Install [qmd](https://github.com/tobi/qmd)
2. From repo root: `qmd collection add <name>-wiki ./wiki`
3. Index once (qmd may prompt): `qmd index` / rebuild per its docs
4. Prefer `qmd search "plain terms"` for identifiers; `qmd vsearch` / `qmd query` for natural-language questions
5. Document the collection name in `wiki/CLAUDE.md` and `wiki/index.md`

**Note:** First semantic search may download ~2 GB of local GGUF models — warn teammates before first `vsearch`.

## Karpathy's Mental Model

> Obsidian is the IDE; the LLM is the programmer; the wiki is the codebase.

The maintenance burden (cross-refs, consistency, contradiction tracking) is what kills human wikis. LLMs touch 15 files in one pass without fatigue — that's why compounding works.
