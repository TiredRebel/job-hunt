---
updated: 2026-07-16
sources: [../../PROGRESS.md, ../../openspec/changes/phase-2-crawl4ai-fetch-ladder/tasks.md]
---

<!-- checkpoint: Phase 2 crawl4ai/agent-browser leftover complete (20/20), not yet archived -->

# Current state — session checkpoint ⭐

> **Restore procedure for a fresh session:** read this page, then
> [project-overview](project-overview.md) → [architecture](architecture.md) →
> [decisions](decisions.md). Verify against `../../PROGRESS.md` (canonical
> checklist — if it disagrees with this page, PROGRESS.md wins; run a lint).

## Where the project stands (2026-07-16)

- **Phases 0–1, 3–6:** complete (see prior checkpoints / `PROGRESS.md`).
  Phases 5 and 6's OpenSpec changes are archived at
  `openspec/changes/archive/2026-07-16-phase-5-web-dashboard/` and
  `.../2026-07-16-phase-6-n8n-workflows/`.
- **Phase 2 — Scraper service: ✅ fully complete** (the crawl4ai/agent-browser
  leftover is closed). OpenSpec change `phase-2-crawl4ai-fetch-ladder`
  (20/20 tasks) still lives at
  `openspec/changes/phase-2-crawl4ai-fetch-ladder/`; archiving is a next-up
  item.
  - **`core.sources.fetch_strategy` is finally live** — previously seeded
    but ignored; every adapter fetched over plain HTTP regardless. New
    `services/scraper/src/scraper/fetchers/` package:
    - `PageFetcher` port + `PolitenessGate` (robots.txt + per-domain
      delay/jitter shared by **every** transport — a browser render obeys
      the same pacing as the HTTP attempt that preceded it).
    - `HttpxFetcher` — the old `PoliteClient`, renamed/refactored (deviated
      from the design's "keep a thin façade" wording — nothing needed a
      separate name once the gate was extracted).
    - `EscalatingFetcher` — HTTP-first, escalates to a rendering fetcher
      only on a JS-shell heuristic (near-empty visible text); **never**
      escalates a `FetchBlockedError`, and never escalates a detected
      anti-bot interstitial (see safety note below).
    - `Crawl4aiFetcher` — optional dependency (`uv sync --group browser` +
      `playwright install chromium`), lazy `AsyncWebCrawler`, returns raw
      rendered HTML (not markdown) so existing parsers are untouched;
      missing-dependency errors name the install command.
    - `AgentBrowserFetcher` — config-driven subprocess seam
      (`SCRAPER_AGENT_BROWSER_CMD`, default `npx -y agent-browser read`).
      **The real CLI contract is unverified**: agent-browser
      (`vercel-labs/agent-browser`) is real, but its own docs refuse to pin
      flags outside the installed binary, and installing it (global npm +
      a Chrome-for-Testing download) onto the user's machine was judged too
      invasive to do unilaterally for a best-effort fallback on one
      already-degraded source (Upwork). Output parsing is deliberately
      defensive (JSON field-guess, else raw stdout) so the seam absorbs
      whichever contract turns out to be real.
  - **Safety correction found before coding, not in the original plan**:
    the JS-shell heuristic alone can't tell a legitimate SPA from a
    Cloudflare-style anti-bot challenge page — both present as short,
    script-heavy bodies. Escalating a _challenge page_ to a real browser
    would be bot-detection evasion, a hard policy line (ADR-006). Added
    `scraper/fetchers/anti_bot.py` (reuses `upwork.py`'s own existing "Just
    a moment..." signal), checked before the JS-shell check — this is what
    makes wiring `agent-browser` into the shared ladder safe for Upwork.
  - Gates: 71/71 pytest (+1 skipped live-smoke test) + ruff + ruff format +
    mypy --strict, all green; confirmed `import scraper.main` succeeds with
    crawl4ai absent.

## Next up

- Archive OpenSpec changes `phase-2-crawl4ai-fetch-ladder` and
  `phase-6-n8n-workflows` (both complete, neither archived yet).
- Phase 7 — hardening (coverage gates, structured logging/correlation ids,
  CI pipeline).
- Refresh Graphify graph (`graphify update .`) — stale again after this
  much new code.

## In-flight / open threads

- **Live scrape smoke test is still an operator step (WSL/Docker
  runtime)**: `services/scraper` can't start natively on this Windows dev
  machine — a pre-existing, unrelated psycopg/`ProactorEventLoop`
  incompatibility (first hit during Phase 6, hit again here). Blocks
  verifying the fetch ladder against real dou/workua/jobua pages and a real
  crawl4ai render in this environment.
- **agent-browser's CLI contract is unverified** (see above) — before
  relying on `agent-browser`-strategy scraping for real, install it
  locally (`npm i -g agent-browser && agent-browser install`), run
  `agent-browser skills get core --full` to get the authoritative command
  reference, and adjust `SCRAPER_AGENT_BROWSER_CMD` / the output-parsing
  logic in `agent_browser.py` if the real contract differs from the
  `read [url]` guess.
- **Live end-to-end smoke of the n8n workflows is still an operator step**:
  no Telegram bot / SMTP credentials exist yet. See `n8n/README.md`
  "Verifying end to end".
- Redis/arq queue handoff between scraper and llm (ARCHITECTURE.md mentions
  it) was explicitly **not** built for Phase 6 — the processing chain polls
  the gateway instead; revisit under Phase 7 if scale demands it.
- Dictionary enable is **per-dictionary** (API has no per-item enabled flag).
- Sources schedule: cron read from `config.cron` (seeded hourly for
  dou/workua/jobua, every-4-hours for reddit/upwork); the scrape-scheduler
  workflow implements the 4-hourly check as plain hour-modulo arithmetic
  (no cron-parser dependency in n8n).
- LLM connection test API targets **active** provider only; non-active cards
  disable Test.
- Playwright e2e needs live API + seeded jobs for full happy path.
- `core.jobs.remote`/`seniority` are closed enums but the LLM's `normalize`
  output is a boolean/free-text guess — the automation repository and the
  cover-letter regenerate path both map defensively (`hybrid` is never
  produced from the boolean, unknown seniority strings fall back to
  `'unknown'`).

## Resume commands

```powershell
cd E:\job-hunter
npm install
cd services\llm; uv run pytest -q; uv run ruff check .; uv run mypy --strict src; cd ..\..
cd services\scraper; uv run pytest -q; uv run ruff check .; uv run mypy --strict src; cd ..\..
cd apps\api; npm run typecheck; npm run lint; npm run test; npm run build; cd ..\..
cd packages\shared-ts; npm run typecheck; npm run lint; npm run build; cd ..\..
cd apps\web
npm run typecheck; npm run lint; npm run test; npm run build
# e2e (optional — needs API on :4000 + seed):
npm run test:e2e:install
npm run test:e2e
cd ..\..
cat PROGRESS.md
```
