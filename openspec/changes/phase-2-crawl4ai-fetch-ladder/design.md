# Design: phase-2-crawl4ai-fetch-ladder

## Context

- `services/scraper/src/scraper/fetch.py` owns `PoliteClient`: one shared
  `httpx.AsyncClient` with per-host locks, robots.txt cache, min-delay+jitter,
  and `FetchBlockedError` on 401/403/407/429/503. All five adapters take it
  in their constructor; the three HTML adapters call
  `client.get(url, params=...)` and parse `response.text`.
- `core.sources.fetch_strategy` (`'api' | 'crawl4ai' | 'agent-browser'`,
  CHECK-constrained since migration 0001) is seeded but **unused**: the
  registry ignores it and every adapter fetches over plain HTTP.
- ADR-006 defines the ladder (API → crawl4ai → agent-browser) and the hard
  policy line: no CAPTCHA bypassing, no bot-detection evasion, no login
  automation. docs/SOURCES.md applies it per source.
- crawl4ai (PyPI, v0.9.x as of July 2026) is a Playwright-based async
  crawler: `AsyncWebCrawler.arun(url, config)` returns rendered HTML plus
  derived markdown. It brings Playwright + a browser download with it —
  a heavy dependency.
- agent-browser (vercel-labs) is a Rust/Node CLI driving Chrome via CDP,
  installed from npm. Per ADR-002 the Node ecosystem is acceptable for this
  role. Its exact scripting contract is verified at implementation time
  (research task) — the design only fixes the seam it plugs into.
- Constraint carried from Phase 2: adapter tests run on recorded fixtures,
  no live network in CI; ruff + mypy --strict stay green.

## Goals / Non-Goals

**Goals:**

- Make `fetch_strategy` real: the registry picks the fetcher; adapters are
  fetcher-agnostic parsers.
- One politeness implementation gating **all** transports (robots, delay,
  jitter, descriptive UA).
- JS-heavy pages become fetchable (crawl4ai render), with a cheap HTTP-first
  path so today's static boards don't pay browser cost per request.
- Service remains runnable without the browser stack installed.

**Non-Goals:**

- No change to Upwork's best-effort posture (no login automation, no
  challenge bypass — blocked stays blocked).
- No new REST endpoints, DB migrations, or gateway/web work.
- No crawl4ai deep-crawling/markdown/LLM-extraction features — we only want
  rendered HTML for existing parsers.
- No proxy rotation, stealth plugins, or fingerprint spoofing (policy).

## Decisions

### D1 — `PageFetcher` port; adapters keep their parsers and shape

New `scraper/fetchers/` package with a small protocol:

```python
@dataclass(frozen=True, slots=True)
class FetchResult:
    text: str          # response body / rendered HTML
    url: str           # final URL after redirects
    rendered: bool     # True when a browser produced it

class PageFetcher(Protocol):
    async def get(self, url: str, *, params: dict[str, str] | None = None) -> FetchResult: ...
```

Adapters swap `PoliteClient` for `PageFetcher` in their constructors and use
`result.text` where they used `response.text` — a mechanical change; parsing,
fingerprinting (`build_posting`) and `RawJobPosting` are untouched.
Alternative — teach `PoliteClient` to render — rejected: it would couple
transport modes inside one class and make the optional crawl4ai import
mandatory.

### D2 — `PolitenessGate` extracted from `PoliteClient`

Robots cache + per-host lock/delay/jitter move to a `PolitenessGate` object
(`await gate.acquire(url)` → raises `FetchBlockedError` on robots deny,
otherwise sleeps out the delay). `HttpxFetcher` (the renamed transport core
of today's `PoliteClient`) and both browser fetchers call the same gate
instance, so per-domain pacing is enforced **across** transports — an
escalated browser render counts against the same host budget as the HTTP
attempt that preceded it. The gate owns its own small httpx client
dedicated to robots.txt lookups (injectable transport for tests), decoupled
from whichever client(s) the main-content fetchers use.

**Implementation note:** `PoliteClient` was not kept as a separate "thin
façade" class — once the gate was extracted, nothing remained that needed
that name distinct from `HttpxFetcher`, so it was renamed directly
(`scraper/fetch.py` deleted, `scraper/fetchers/httpx_fetcher.py` added).
`main.py` wiring and the anti-bot status mapping did stay where the design
intended — they just live on `HttpxFetcher` instead of on a separate
`PoliteClient` wrapper.

### D3 — Strategy resolution in the registry

`create_adapter(slug, config, fetchers)` receives a `FetcherFactory` that
maps `core.sources.fetch_strategy` → fetcher:

- `api` → `HttpxFetcher` (Reddit JSON, Upwork RSS keep exact behavior).
- `crawl4ai` → `EscalatingFetcher(HttpxFetcher, Crawl4aiFetcher)` (D4).
- `agent-browser` → `EscalatingFetcher(HttpxFetcher, AgentBrowserFetcher)`.

The scraper's `POST /scrape/{slug}` handler already loads the source row, so
threading `fetch_strategy` into `create_adapter` is a one-line change. An
unknown strategy or an unavailable required fetcher fails the run with a
clear error at trigger time (409/500 with detail), never a silent wrong
transport.

### D4 — HTTP-first with JS-shell escalation; blocked is NEVER escalated

`EscalatingFetcher` tries the cheap HTTP fetch first and escalates to the
browser fetcher only when the HTML looks like a JS shell: the body parses
but the adapter-relevant content is absent. Heuristic (pure function,
unit-tested): after stripping `<script>/<style>/<noscript>`, visible text is
under a threshold (~200 chars) or the `<body>` is dominated by a root div
with no text. Adapters can pass a `content_probe` CSS selector (they already
own one for fingerprinting) to sharpen the check.

Two hard rules:

- `FetchBlockedError` from the HTTP attempt **propagates immediately** — a
  403/429/challenge answer means the host said no; re-trying with a browser
  would be bot-detection evasion (ADR-006 policy). Escalation exists for
  _rendering_, not for _access_.
- Escalation is remembered per host for the rest of the run (small in-memory
  set) so a fully client-side-rendered site doesn't pay a doomed HTTP
  round-trip per lead.

### D4b — Anti-bot interstitials are blocked, never treated as a JS shell

**Risk found during implementation, before writing `AgentBrowserFetcher`:**
the JS-shell heuristic alone cannot tell a legitimate client-side-rendered
page apart from an anti-bot challenge page (Cloudflare's "Just a moment..."
interstitial, "Checking your browser before accessing...", etc.) — both are
script-heavy bodies with almost no visible text. For `crawl4ai`-strategy
sources (dou/workua/jobua — SOURCES.md rates these "low" risk, no known
anti-bot) this was a theoretical gap. For `agent-browser`-strategy sources
(Upwork — SOURCES.md: "aggressive anti-bot (Cloudflare, fingerprinting)")
it is a real one: escalating a Cloudflare challenge page to a real browser
to get past it _is_ bot-detection evasion, which is explicitly and
repeatedly forbidden (ADR-006, docs/SOURCES.md, this change's own
Non-Goals).

**Mitigation:** `scraper/fetchers/anti_bot.py`'s
`looks_like_anti_bot_challenge()` checks the primary response for a short,
deliberately narrow list of known interstitial markers (the same "Just a
moment..." signal `upwork.py`'s own existing challenge detection already
uses, plus a handful of Cloudflare-specific fragments) **before** the
JS-shell check in `EscalatingFetcher.get()`. A match raises
`FetchBlockedError` (never escalated); everything else falls through to the
ordinary JS-shell heuristic unchanged. A false negative here (an
unrecognized challenge page) degrades to pre-existing behavior — the page
still isn't escalated for `crawl4ai` sources today, and for `upwork`,
the adapter's own `self._blocked` degradation is the outer safety net
regardless.

### D5 — Crawl4aiFetcher: rendered raw HTML, our politeness, lazy import

Wraps one `AsyncWebCrawler` (lazy-started on first use, closed on service
shutdown). Per request: `gate.acquire(url)` first, then
`arun(url, CrawlerRunConfig(...))` with cache bypassed (we have our own
dedup), our descriptive User-Agent, `wait_until="domcontentloaded"` plus a
bounded `page_timeout` from settings. Returns `FetchResult(text=result.html,
rendered=True)` — **raw rendered HTML**, not `markdown`/`fit_markdown`, so
BeautifulSoup selectors and `content_fingerprint` behave identically to the
HTTP path. HTTP-level error statuses surfaced by crawl4ai map to the same
`FetchBlockedError`/error semantics as `HttpxFetcher`. The import lives
inside the factory (`scraper.fetchers.crawl4ai`) and `pyproject` puts
`crawl4ai` in an optional `browser` dependency group: without it installed,
`api`-strategy sources work, browser-strategy sources fail their run with an
actionable message ("install with `uv sync --group browser` and
`playwright install chromium`").

### D6 — AgentBrowserFetcher: thin subprocess seam, contract verified later

A config-driven subprocess call (`Settings.agent_browser_cmd`, default
`npx -y agent-browser`) asking the CLI to open the URL and print the
rendered HTML/snapshot to stdout, with a hard timeout. Anything unexpected —
CLI missing, non-zero exit, timeout, empty output — raises
`FetchUnavailableError`, which the adapter layer treats like today's
skip path (lead counted as skipped, run continues, `partial` at worst).
The precise CLI flags are pinned by an implementation task that runs the
tool locally first; the design deliberately keeps the seam this thin so a
different CLI (or a Playwright-direct fallback) can replace it without
touching the ladder. Only Upwork is seeded with this strategy, and its
adapter's existing blocked-degradation stays the outer safety net.

**Task 4.1 research outcome (agent-browser is real, contract stayed
unverified):** confirmed `agent-browser` (`vercel-labs/agent-browser`) is a
real, actively maintained Rust/Node CLI for CDP-driven browser automation,
matching ADR-002's "agent-browser is TS/Node" framing. It documents a
non-interactive `agent-browser read [url]` command, but its own SKILL.md
explicitly refuses to pin exact flags in static docs ("load the actual
workflow content from the CLI... to prevent staleness between releases") —
the authoritative contract only exists inside the installed binary. Actually
installing it (global npm install + a separate Chrome-for-Testing download
step) was judged too invasive to do unilaterally on the user's machine for
a best-effort fallback on one already-degraded, best-effort source, so it
was not installed and the exact contract remains unverified.

**Consequence for the implementation:** `AgentBrowserFetcher` is built to
degrade gracefully regardless of which interpretation turns out to be
right — the command is fully configurable
(`Settings.agent_browser_cmd`, default `"npx -y agent-browser read"`) and
output parsing is deliberately defensive: try JSON and pull the first
present of `html`/`content`/`text`/`markdown`, else treat all of stdout as
the content (covers both a structured `--json` mode and the tool's default
plain-text/markdown output). Missing binary, timeout, non-zero exit, and
empty output all raise `FetchUnavailableError` uniformly. If the real
contract turns out to need different flags or a different subcommand
sequence (e.g. `open` + `get html`), only `Settings.agent_browser_cmd`
needs to change — no code touches the ladder. This is the seam design D6
already called for; task 4.1 confirms _why_ it stayed a seam rather than a
verified integration.

### D4c — Anti-bot-challenge detection also protects `agent-browser`

D4b's `looks_like_anti_bot_challenge()` check lives in `EscalatingFetcher`,
shared by both `crawl4ai` and `agent-browser` strategies — Upwork (the one
`agent-browser`-strategy source, and the one SOURCES.md explicitly flags for
"aggressive anti-bot (Cloudflare, fingerprinting)") gets the same
challenge-page-is-blocked-not-escalated protection without any
Upwork-specific code. This is the primary reason D4b was treated as a
blocking correction rather than a nice-to-have: without it, wiring
`agent-browser` into the escalation ladder at all would have risked
crossing the bot-detection-evasion policy line on exactly the source most
likely to serve a challenge page.

### D7 — Testing strategy

- `PolitenessGate`: unit tests for robots deny, delay accounting, per-host
  isolation (no network — fake transport for robots.txt).
- `EscalatingFetcher`: fake primary/secondary fetchers; cases: static page →
  no escalation; JS shell → escalation + host memoization; blocked → raises,
  never escalates; secondary unavailable → skip semantics.
- JS-shell heuristic: table-driven tests over fixture HTML (real dou page ⇒
  not shell; stripped React-shell fixture ⇒ shell).
- `Crawl4aiFetcher`: the crawl4ai call is isolated behind one private
  `_run(url)` coroutine; tests fake it (no Playwright in CI). One optional,
  skipped-by-default live smoke test for local runs.
- `AgentBrowserFetcher`: real subprocesses using this interpreter
  (`sys.executable -c "..."`) as a portable stand-in CLI — no fake/injected
  runner needed. Covers missing command, timeout, non-zero exit, empty
  output, plain-text stdout, JSON-with-recognized-field stdout, JSON
  field-priority, and params/URL passed as the final argv.
- Anti-bot interstitial detection: table-driven tests over known-marker and
  ordinary-content/shell strings; one `EscalatingFetcher` scenario confirms
  a challenge page raises blocked without escalating.
- Adapters: existing fixture tests keep passing with a `FakeFetcher`
  replacing today's fake client (constructor type change only).

## Risks / Trade-offs

- [crawl4ai is a heavy dependency (Playwright + browser)] → optional
  dependency group; lazy import; service and `api` sources unaffected when
  absent.
- [JS-shell heuristic false positives would double-fetch pages] → threshold
  - content-probe selector keeps it conservative; per-host memoization keeps
    the cost one wasted HTTP GET per host per run, not per lead.
- [JS-shell false _negatives_ leave a JS-heavy source at zero leads] → same
  observable outcome as today (no regression); run stats make it visible;
  threshold tunable per source via config.
- [agent-browser CLI contract unknown until implementation] → isolated
  behind `FetchUnavailableError` seam; verification is an explicit early
  task; worst case the fetcher ships as "unavailable" and Upwork behaves
  exactly as it does today.
- [Browser fetching on Windows dev machines] → the scraper already can't run
  natively on Windows (psycopg Proactor-loop issue, noted in the phase-6
  design); browser fetching targets the same WSL/Docker runtime — no new
  constraint, documented in README.
- [crawl4ai's own politeness/caching features overlapping ours] → explicitly
  disabled (cache bypass, no deep crawl); our gate is the single authority.

## Migration Plan

1. Land the refactor (gate + port + HttpxFetcher) with adapters re-typed —
   behavior identical, all existing tests green. Pure refactor commit.
2. Add `EscalatingFetcher` + heuristic + registry strategy wiring (crawl4ai
   still absent → escalation raises actionable error; `api` sources
   unaffected).
3. Add `Crawl4aiFetcher` + optional dep group + docs; local smoke against
   dou.ua listing.
4. Add `AgentBrowserFetcher` after CLI verification task.
5. Rollback at any step = registry maps every strategy back to
   `HttpxFetcher` (one-line change); no data or API surface to unwind.

## Open Questions

- agent-browser CLI invocation details (flags for "open URL, dump rendered
  HTML, exit") — resolved by the verification task; the seam absorbs the
  answer.
- JS-shell visible-text threshold default (start at 200 chars; revisit after
  the first real crawl4ai-strategy source needs it).
