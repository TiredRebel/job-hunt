# Source Strategies

Ladder (ADR-006): **official API/RSS → crawl4ai (static HTML) → agent-browser (JS-heavy)**.
Politeness everywhere: respect robots.txt, per-domain delay + jitter, incremental scraping via watermarks, descriptive User-Agent. No CAPTCHA bypassing, no bot-detection evasion, no login automation.

## dou.ua — `dou` (start here: easiest, richest UA tech jobs)
- **Strategy:** crawl4ai. `jobs.dou.ua/vacancies/?category=...` is SSR HTML; detail pages are static.
- **Notes:** list pagination via "more" endpoint (XHR returning HTML fragments); categories/cities as adapter config.
- **Risk:** low.

## work.ua — `workua`
- **Strategy:** crawl4ai. SSR HTML, clean structure, sitemap available.
- **Notes:** search URL params (query, city, category) in adapter config; salary often structured in markup.
- **Risk:** low–medium (occasional layout changes; keep parsers fixture-tested).

## job.ua — `jobua`
- **Strategy:** crawl4ai. SSR HTML similar to work.ua.
- **Notes:** smaller volume; overlap with work.ua likely → dedup by content fingerprint matters.
- **Risk:** low–medium.

## Reddit — `reddit`
- **Strategy:** **API, no scraping.** Public JSON (`https://www.reddit.com/r/<sub>/new.json`) or official OAuth API (higher limits) — set `REDDIT_CLIENT_ID/SECRET` in `.env` if needed.
- **Config:** subreddits list (e.g. `forhire`, `hiringcafe`, `remotejs`, `jobbit`), flair/keyword filters (`[Hiring]`).
- **Risk:** low. Respect API rate limits (60 req/min unauthenticated is generous for our cadence).

## Upwork — `upwork` ⚠️ best-effort
- **Reality:** aggressive anti-bot (Cloudflare, fingerprinting) + most value behind login. We will **not** bypass bot detection or automate logins.
- **Strategy:**
  1. Legacy RSS/Atom search feeds if still available for public searches (verify at implementation time).
  2. Public search result pages via agent-browser *if* they render without challenge; otherwise the adapter reports `blocked` gracefully.
  3. Document manual alternative: user-saved searches + email alerts from Upwork itself, optionally ingested from the digest email via n8n IMAP node.
- **Risk:** high; adapter must degrade gracefully and never poison run stats.

## Adapter contract

Every adapter implements `SourceAdapter` (see ARCHITECTURE.md §5) and ships with:
- recorded HTML/JSON fixtures under `services/scraper/tests/fixtures/<slug>/`,
- parser unit tests (no live network in CI),
- a `config` JSON-schema fragment validated at startup.
