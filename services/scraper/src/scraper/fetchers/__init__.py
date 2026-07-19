"""Page-fetching transports implementing the ADR-006 ladder.

Ladder: API/plain HTTP → crawl4ai (rendered HTML) → agent-browser (JS-heavy
fallback). All transports implement :class:`PageFetcher` and share one
:class:`PolitenessGate`, so robots.txt decisions and per-domain pacing are
identical regardless of which transport handles a given request.
"""

from __future__ import annotations

from scraper.fetchers.agent_browser import AgentBrowserFetcher
from scraper.fetchers.anti_bot import looks_like_anti_bot_challenge
from scraper.fetchers.base import (
    BLOCKED_STATUS_CODES,
    DEFAULT_USER_AGENT,
    FetchBlockedError,
    FetchResult,
    FetchUnavailableError,
    PageFetcher,
    PolitenessOverrides,
    SourceBoundFetcher,
    UnsupportedStrategyError,
)
from scraper.fetchers.crawl4ai_fetcher import Crawl4aiFetcher
from scraper.fetchers.escalating import EscalatingFetcher
from scraper.fetchers.gate import PolitenessGate
from scraper.fetchers.httpx_fetcher import HttpxFetcher
from scraper.fetchers.js_shell import is_js_shell

__all__ = [
    "BLOCKED_STATUS_CODES",
    "DEFAULT_USER_AGENT",
    "AgentBrowserFetcher",
    "Crawl4aiFetcher",
    "EscalatingFetcher",
    "FetchBlockedError",
    "FetchResult",
    "FetchUnavailableError",
    "HttpxFetcher",
    "PageFetcher",
    "PolitenessGate",
    "PolitenessOverrides",
    "SourceBoundFetcher",
    "UnsupportedStrategyError",
    "is_js_shell",
    "looks_like_anti_bot_challenge",
]
