"""HTTP-first fetcher that escalates to a rendering fetcher on a JS shell.

See design.md D4 in openspec/changes/phase-2-crawl4ai-fetch-ladder: escalation
exists for *rendering*, never for *access* — a blocked/anti-bot response from
the primary fetcher always propagates immediately. This includes anti-bot
*interstitials* detected by content (see
:func:`~scraper.fetchers.anti_bot.looks_like_anti_bot_challenge`), not just
HTTP status: a Cloudflare-style challenge page looks exactly like a JS shell
to the plain heuristic, and rendering through it with a real browser would
be bot-detection evasion (see design.md D4b — a risk found and closed during
implementation, not in the original design).
"""

from __future__ import annotations

from urllib.parse import urlsplit

from scraper.fetchers.anti_bot import looks_like_anti_bot_challenge
from scraper.fetchers.base import FetchBlockedError, FetchResult, PageFetcher, PolitenessOverrides
from scraper.fetchers.js_shell import is_js_shell


class EscalatingFetcher:
    """Tries ``primary`` first; escalates to ``secondary`` on a JS shell.

    A host that has escalated once is remembered for the lifetime of this
    fetcher instance (one scrape run), so a fully client-side-rendered
    source doesn't pay a doomed HTTP round-trip per lead.
    """

    def __init__(
        self,
        primary: PageFetcher,
        secondary: PageFetcher,
        *,
        content_probe: str | None = None,
        text_threshold: int = 200,
    ) -> None:
        """Initialize the escalating fetcher.

        Args:
            primary: Cheap fetcher tried first (plain HTTP).
            secondary: Rendering fetcher used on escalation.
            content_probe: Optional CSS selector sharpening the JS-shell
                heuristic (see :func:`~scraper.fetchers.js_shell.is_js_shell`).
            text_threshold: Visible-text threshold for the heuristic.
        """
        self._primary = primary
        self._secondary = secondary
        self._content_probe = content_probe
        self._text_threshold = text_threshold
        self._escalated_hosts: set[str] = set()

    async def get(
        self,
        url: str,
        *,
        params: dict[str, str] | None = None,
        politeness: PolitenessOverrides | None = None,
    ) -> FetchResult:
        """Fetch ``url``, escalating to the secondary fetcher when needed.

        Args:
            url: Absolute URL to fetch.
            params: Optional query parameters merged into the URL.
            politeness: Optional per-source pacing/robots overrides,
                forwarded to whichever underlying fetcher handles the call.

        Returns:
            The primary result, or the secondary (rendered) result when the
            primary response looked like a JS shell.

        Raises:
            FetchBlockedError: From the primary fetcher, or when its response
                looks like an anti-bot challenge page — neither is ever
                escalated.
            FetchUnavailableError: From the secondary fetcher when it can't
                complete the render.
        """
        host = urlsplit(url).netloc
        if host in self._escalated_hosts:
            return await self._secondary.get(url, params=params, politeness=politeness)

        result = await self._primary.get(url, params=params, politeness=politeness)
        if looks_like_anti_bot_challenge(result.text):
            raise FetchBlockedError(f"{host} served an anti-bot challenge page for {url}")
        if is_js_shell(
            result.text, content_probe=self._content_probe, text_threshold=self._text_threshold
        ):
            self._escalated_hosts.add(host)
            return await self._secondary.get(url, params=params, politeness=politeness)
        return result
