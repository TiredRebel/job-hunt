---
updated: 2026-07-16
sources: [../../PROGRESS.md, ../../openspec/changes/phase-5-web-dashboard/tasks.md]
---

<!-- checkpoint: Phase 5 archived + specs synced; next phase open (6 n8n or 2 crawl4ai) -->

# Current state — session checkpoint ⭐

> **Restore procedure for a fresh session:** read this page, then
> [project-overview](project-overview.md) → [architecture](architecture.md) →
> [decisions](decisions.md). Verify against `../../PROGRESS.md` (canonical
> checklist — if it disagrees with this page, PROGRESS.md wins; run a lint).

## Where the project stands (2026-07-16)

- **Phases 0–4:** complete (see prior checkpoints / `PROGRESS.md`).
- **Phase 5 — Web app (NextJS): ✅ complete & archived.** OpenSpec change
  `phase-5-web-dashboard` (38/38) archived to
  `openspec/changes/archive/2026-07-16-phase-5-web-dashboard/`; its 8 delta
  specs synced to main `openspec/specs/` (28 requirements,
  `openspec validate --all` 9/9). `apps/web` on **Next.js 16.2** +
  React 19, Tailwind v4 tokens, next-themes, next-intl (`en`/`uk`), shadcn/ui.
  Surfaces shipped:
  - `/jobs` — TanStack Table (manual server filters via URL), virtualization
    > 200, FilterBar chips, bulk reactions, keyboard nav (`j/k/x/Enter/a/r//`)
  - Job detail — Sheet drawer `?job=` + `/jobs/[id]`; timeline; cover letter
    view/edit (`PUT`); **regenerate deferred to Phase 6** (disabled + tooltip)
  - `/board` — five-column dnd-kit kanban, optimistic moves + undo toast,
    keyboard sensor, `aria-live`, virtualize >50
  - Admin: `/sources`, `/dictionaries`, `/profile`, `/settings/llm`
  - Playwright happy-path e2e wired (`npm run test:e2e`); **skips** when API
    health is down — run against seeded `apps/api` + DB for a real pass
  - API prerequisites already in tree: jobs OpenAPI query params, cover-letter
    GET/PUT, `matchExplanation` on detail; shared-ts regenerated
- **Gates (web):** `typecheck` / `lint` / `test` (31 vitest) / `next build` green.
  Known lint warnings only: TanStack Table/Virtual React Compiler skip.

## Next up

- Phase 6 — n8n workflows (scrape cron, LLM chain, Telegram, email digest).
- Phase 2 leftover: crawl4ai + agent-browser for JS-heavy sources.

## In-flight / open threads

- Cover-letter regenerate: no gateway proxy; Phase 6 owns regeneration.
- Dictionary enable is **per-dictionary** (API has no per-item enabled flag).
- Sources schedule: cron read from `config.cron` / `config.schedule` (n8n-managed hint when absent).
- LLM connection test API targets **active** provider only; non-active cards disable Test.
- Playwright e2e needs live API + seeded jobs for full happy path.

## Resume commands

```powershell
cd E:\job-hunter
npm install
cd apps\web
npm run typecheck; npm run lint; npm run test; npm run build
# e2e (optional — needs API on :4000 + seed):
npm run test:e2e:install
npm run test:e2e
cat ..\..\PROGRESS.md
```
