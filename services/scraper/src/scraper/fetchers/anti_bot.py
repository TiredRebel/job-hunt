"""Anti-bot interstitial detection — keeps escalation from becoming evasion.

The JS-shell heuristic (:func:`~scraper.fetchers.js_shell.is_js_shell`) alone
cannot tell a legitimate client-side-rendered page apart from an anti-bot
challenge page (e.g. Cloudflare's "Just a moment..." interstitial) — both
present as short visible text with a script-heavy body. Rendering *through*
a challenge with a real browser would be bot-detection evasion, which
project policy forbids outright (ADR-006, docs/SOURCES.md). This check runs
before the JS-shell check in :class:`~scraper.fetchers.escalating.EscalatingFetcher`
so a detected challenge raises :class:`~scraper.fetchers.base.FetchBlockedError`
(never escalated) instead of being treated as a shell to render.
"""

from __future__ import annotations

#: Case-insensitive substrings seen in well-known anti-bot interstitials.
#: Deliberately narrow (known challenge pages only) — a false negative here
#: just means the page falls through to the ordinary JS-shell check, which
#: is the pre-existing behavior this module is added to make safer, not the
#: only line of defense.
_CHALLENGE_MARKERS = (
    "just a moment",
    "checking your browser before accessing",
    "cf-browser-verification",
    "cf_chl_",
    "ddos protection by",
    "attention required! | cloudflare",
    "please verify you are a human",
    "enable javascript and cookies to continue",
)


def looks_like_anti_bot_challenge(html: str) -> bool:
    """Detect a known anti-bot interstitial (Cloudflare-style challenge page).

    Args:
        html: Raw fetched HTML (checked as-is; markers include both
            human-readable phrases and class/script-name fragments that
            don't survive text-only stripping).

    Returns:
        ``True`` when a known challenge-page marker is present.
    """
    lowered = html.lower()
    return any(marker in lowered for marker in _CHALLENGE_MARKERS)
