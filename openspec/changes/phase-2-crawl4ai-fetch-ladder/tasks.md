# Tasks: phase-2-crawl4ai-fetch-ladder

## 1. Refactor — port + politeness gate (behavior-identical)

- [x] 1.1 Extracted `PolitenessGate` (`scraper/fetchers/gate.py`): robots
      cache + per-host lock/delay/jitter, `acquire(url)` raising
      `FetchBlockedError` on robots deny; owns its own small httpx client for
      robots.txt lookups (injectable `transport=` for tests). Deviation from
      the design's exact wording: `PoliteClient` wasn't kept as a separate
      "thin façade" — nothing needed that name once the gate was extracted,
      so it was renamed directly into `HttpxFetcher` (one class, not two);
      `scraper/fetch.py` deleted
- [x] 1.2 New `scraper/fetchers/` package: `base.py` (`FetchResult`,
      `PageFetcher` protocol, `FetchBlockedError`, `FetchUnavailableError`,
      `BLOCKED_STATUS_CODES`), `gate.py`, `httpx_fetcher.py`
      (`HttpxFetcher` — gate-first, same anti-bot status mapping as before),
      `__init__.py` re-exporting the public surface
- [x] 1.3 Re-typed all five adapters (`dou`, `workua`, `jobua`, `reddit`,
      `upwork`) against `PageFetcher`, using `result.text`; `reddit.py`'s
      `response.json()` → `json.loads(result.text)` (only behavioral-shape
      change, semantically identical); `registry.py`'s `AdapterFactory` +
      `create_adapter` re-typed; `main.py` lifespan builds
      `PolitenessGate` + `HttpxFetcher` instead of `PoliteClient`;
      `conftest.py`'s `FakeClient`/`FakeResponse` → `FakeFetcher` producing
      `FetchResult`; all 30 existing tests green, zero behavior change
- [x] 1.4 6 new `PolitenessGate` unit tests (`tests/test_gate.py`): robots
      deny, robots allow, unreachable-robots-defaults-to-allow,
      `respect_robots=False` bypass, per-host delay enforced, different
      hosts don't wait on each other — via `httpx.MockTransport`, no network.
      Full suite 36/36, ruff, ruff format, mypy --strict all green

## 2. Escalation ladder

- [x] 2.1 `scraper/fetchers/js_shell.py`: `is_js_shell()` pure function
      (strip script/style/noscript, visible-text threshold, optional
      content-probe selector overriding a short-page false-positive); 7
      table-driven tests incl. a realistic listing sample (not shell), a
      React-shell fixture (`tests/fixtures/shells/react-shell.html`, shell),
      script/style-content-ignored, probe found/empty/absent, custom
      threshold
- [x] 2.2 `scraper/fetchers/escalating.py`: `EscalatingFetcher(primary,
    secondary)` — escalates on JS shell, propagates `FetchBlockedError`
      without escalation, per-host escalation memo for the fetcher's
      lifetime (one scrape run); 6 unit tests with a `ScriptedFetcher` fake
      covering no-escalation, escalation, per-host memoization, independent
      hosts, blocked-never-escalates, secondary-unavailable-propagates
- [x] 2.3 `registry.py`: `create_adapter` now takes `fetch_strategy` +
      `FetcherFactory`; looks up an adapter's `content_selector` class
      attribute (no duplicated selector strings) and calls
      `fetchers(fetch_strategy, content_probe)`; new `UnsupportedStrategyError`
      (unknown or not-yet-available strategy). `main.py`'s
      `build_fetcher_factory()` resolves `api` → the shared `HttpxFetcher`;
      `crawl4ai`/`agent-browser` raise `UnsupportedStrategyError` until
      groups 3/4 land (matches the design's staged migration — never a
      silent fallback); `trigger_scrape` threads `source["fetch_strategy"]`
      through and maps the new error to HTTP 500. Test fixture note: moved
      `test_api.py`'s generic trigger-scrape tests to `fetch_strategy="api"`
      (that flow isn't about strategy resolution) and added a dedicated
      `test_scrape_unsupported_strategy_is_500` test with a fake factory
      mirroring the real one's shape
- [x] 2.4 Adapter `content_selector` class attributes added to
      `DouAdapter`/`WorkUaAdapter`/`JobUaAdapter`, reusing each module's
      existing `_CONTENT_SELECTOR` constant (single source of truth, no
      duplication); `RedditAdapter`/`UpworkAdapter` have none (default
      `None` via `getattr`). Full suite 50/50, ruff, ruff format, mypy
      --strict all green

## 3. crawl4ai fetcher

- [x] 3.1 Optional `browser` dependency group (`crawl4ai>=0.9,<0.10`) added
      to pyproject with an inline comment documenting
      `uv sync --group browser` + `uv run playwright install chromium`;
      `[[tool.mypy.overrides]]` for `crawl4ai.*` (`ignore_missing_imports`)
      since it's not installed by default. Verified crawl4ai's real Python
      API (`AsyncWebCrawler`/`BrowserConfig`/`CrawlerRunConfig`/`CacheMode`,
      explicit `start()`/`close()` lifecycle methods, `result.html`/
      `.success`/`.status_code`/`.error_message`) against current docs/source
      rather than guessing
- [x] 3.2 `Crawl4aiFetcher` (`scraper/fetchers/crawl4ai_fetcher.py`): lazy
      `AsyncWebCrawler.start()` on first use (asyncio.Lock-guarded), `aclose()`
      calls `.close()`; gate-first (`gate.acquire`), `httpx.URL` for
      params-merging (reuses the same query-merge semantics as `HttpxFetcher`),
      `CacheMode.BYPASS`, `wait_until="domcontentloaded"`, `page_timeout` from
      settings, returns `FetchResult(rendered=True)` with raw `result.html`
      (never markdown); `result.status_code` in `BLOCKED_STATUS_CODES` →
      `FetchBlockedError`, any other failure/exception → `FetchUnavailableError`;
      missing-dependency `ImportError` caught and re-raised with the exact
      install command (satisfies the spec's "names the missing dependency
      and the install command" scenario) rather than a bare import traceback;
      crawl4ai call isolated behind one `_run(url)` seam
- [x] 3.3 6 unit tests with `_run` faked (get-returns-result, params merged
      into URL, `FetchBlockedError` propagates, `FetchUnavailableError`
      propagates, `aclose()` before start is a no-op) + 1 test that
      deliberately does **not** fake `_run` and exercises the real
      (unfaked) import path against this dev environment — crawl4ai
      genuinely isn't installed here, so it's an authentic assertion of the
      actionable-error message, not a mock. 1 skipped-by-default live smoke
      test (`test_live_render_smoke`) documented for local verification once
      the `browser` group is installed. Added shared `ALLOW_ALL_TRANSPORT`
      to `conftest.py` (robots.txt always-404 mock) for gate construction
      in fetcher tests
- [x] 3.4 Settings additions: `crawl4ai_page_timeout_seconds` (30.0),
      `js_shell_text_threshold` (200) — plus, pulled forward from group 4
      since it's the same `Settings` class edit, `agent_browser_cmd`
      (`"npx -y agent-browser"`) and `agent_browser_timeout_seconds` (30.0).
      `.env.example` untouched — these are scraper-internal tuning knobs,
      not secrets or cross-service config. `main.py`'s
      `build_fetcher_factory()` now wires `crawl4ai` strategy to a fresh
      `EscalatingFetcher(base, crawl4ai_fetcher, ...)` per adapter (per run);
      confirmed `import scraper.main` succeeds with crawl4ai absent. Full
      suite 56/56 (+1 skipped), ruff, ruff format, mypy --strict all green

## 4. agent-browser fallback

- [x] 4.1 Researched (web, not local install) agent-browser
      (`vercel-labs/agent-browser`): confirmed real, Rust/Node CLI,
      documents `agent-browser read [url]` as its closest non-interactive
      "URL → content" command. Its own docs explicitly refuse to pin exact
      flags outside the installed binary, and actually installing it
      (global npm package + a separate Chrome-for-Testing download) was
      judged too invasive to do unilaterally for a best-effort fallback on
      one already-degraded source — so it was **not** installed, and the
      exact contract is documented as unverified in design.md D6, with the
      substitute being a maximally configurable, defensively-parsed
      implementation rather than a Playwright-direct rewrite (the seam
      absorbs the uncertainty either way)
- [x] 4.2 `AgentBrowserFetcher` (`scraper/fetchers/agent_browser.py`):
      configurable command (`Settings.agent_browser_cmd`, default
      `"npx -y agent-browser read"`), `asyncio.create_subprocess_exec` with
      a hard timeout; missing binary/timeout/non-zero exit/empty output all
      → `FetchUnavailableError`; output parsing tries JSON
      (`html`/`content`/`text`/`markdown` fields, checked in that priority
      order) then falls back to raw stdout, so it degrades gracefully
      regardless of which output mode the real CLI turns out to use
- [x] **Safety correction found before coding this group** (not in the
      original task list): the JS-shell heuristic alone can't tell a
      legitimate SPA from a Cloudflare-style anti-bot interstitial — both
      present as short, script-heavy bodies. Escalating a _challenge page_
      to a real browser is bot-detection evasion, a hard policy line
      (ADR-006). Added `scraper/fetchers/anti_bot.py`
      (`looks_like_anti_bot_challenge()`, reusing upwork.py's own existing
      "Just a moment..." signal plus a few Cloudflare-specific markers),
      checked in `EscalatingFetcher.get()` **before** the JS-shell check —
      a match raises `FetchBlockedError` (never escalated). Documented as
      design.md D4b/D4c; `fetch-strategy-ladder`'s existing
      "Escalation only for JS shells" requirement (still `## ADDED
    Requirements` — this capability has no prior main spec to modify)
      gained an extra sentence + scenario for it (still passes
      `openspec validate`). This is what makes wiring `agent-browser` into
      the shared escalation ladder safe for Upwork specifically
- [x] 4.3 8 unit tests using real subprocesses (`sys.executable -c "..."` as
      a portable stand-in CLI, not a fake) — missing command, timeout,
      non-zero exit, empty output, plain-text stdout, JSON-field
      extraction, JSON field-priority, URL+params passed as the final argv.
      Plus 6 new anti-bot tests (`test_anti_bot.py`) and 1 new
      `EscalatingFetcher` scenario confirming a challenge page blocks
      without escalating
- [x] 4.4 `FetchUnavailableError` → `stats.skipped` was already wired into
      `runner.py`'s `_scrape_query` in Group 1 (added alongside the
      `FetchBlockedError` import touch, ahead of schedule since it was a
      one-line, zero-risk addition in a file already being edited); no
      further change needed here. `main.py`'s `build_fetcher_factory()` now
      wires `agent-browser` strategy to `EscalatingFetcher(base,
    agent_browser_fetcher, ...)`, same shape as `crawl4ai`. Full suite
      71/71 (+1 skipped), ruff, ruff format, mypy --strict all green

## 5. Verification, docs & close-out

- [x] 5.1 Attempted; blocked. `services/scraper` can't start natively on
      this Windows dev machine — the same pre-existing psycopg/
      `ProactorEventLoop` incompatibility discovered in Phase 6 (unrelated
      to this change). Verified everything short of a live network fetch
      instead: `import scraper.main` succeeds, `known_slugs()` returns all
      five adapters, the FastAPI app constructs cleanly with crawl4ai
      absent. The HTTP-first/escalation/crawl4ai/agent-browser code paths
      are covered by the 20 new unit tests across groups 1–4 (gate,
      escalating, js_shell, anti_bot, crawl4ai_fetcher, agent_browser) using
      fixtures, mocked transports, and real subprocesses — not a substitute
      for a live scrape, but real behavioral coverage of every branch.
      Live verification against real dou/workua/jobua pages (and a forced
      crawl4ai escalation) is left as an operator step under the project's
      normal WSL/Docker dev runtime
- [x] 5.2 `docs/SOURCES.md` gained a "How the ladder works (as implemented)"
      section: strategy column now live, HTTP-first + escalation semantics,
      blocked-and-anti-bot-interstitial-are-never-escalated policy line,
      optional crawl4ai install command, agent-browser subprocess config +
      unverified-contract caveat with a pointer to design.md D6
- [x] 5.3 Full scraper gates green: 71/71 pytest (30 original + 41 new: 6
      gate + 6 escalating + 7 js_shell + 6 anti_bot + 7 crawl4ai_fetcher + 9
      agent_browser, +1 skipped live-smoke) + ruff + ruff format + mypy
      --strict; confirmed service boots and constructs its FastAPI app with
      crawl4ai not installed. No other service touched (repo-wide
      `git status` confirms changes scoped to `services/scraper` +
      `docs/SOURCES.md` + this change's own openspec files)
- [x] 5.4 PROGRESS.md Phase 2 header flipped to ✅ with a log entry; wiki
      `current-state.md` + `log.md` checkpointed. Commit still pending —
      left for the parent session per this repo's established convention
      (commits happen only when explicitly requested)
