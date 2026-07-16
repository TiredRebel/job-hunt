"""Heuristic: does this HTML look like an unrendered JavaScript shell?

Pure function, no I/O — used by :class:`~scraper.fetchers.escalating.EscalatingFetcher`
to decide whether a plain-HTTP response needs a browser render instead.
"""

from __future__ import annotations

from bs4 import BeautifulSoup

_STRIP_TAGS = ("script", "style", "noscript")
#: Minimum text length in a matched content-probe node to trust it as real
#: content (a probe selector present but empty is itself a shell signal).
_PROBE_MIN_TEXT = 20


def is_js_shell(html: str, *, content_probe: str | None = None, text_threshold: int = 200) -> bool:
    """Detect whether ``html`` looks like a client-side-rendered shell.

    Args:
        html: Fetched page HTML.
        content_probe: Optional CSS selector an adapter already uses to find
            its main content block. When it matches non-trivial text, the
            page is confidently treated as real content regardless of
            overall page length.
        text_threshold: Visible-text length below which the page is treated
            as a shell when the probe is absent or inconclusive.

    Returns:
        ``True`` when the page should be escalated to a rendering fetcher.
    """
    soup = BeautifulSoup(html, "html.parser")
    for tag_name in _STRIP_TAGS:
        for tag in soup.find_all(tag_name):
            tag.decompose()

    if content_probe:
        node = soup.select_one(content_probe)
        if node is not None and len(node.get_text(" ", strip=True)) >= _PROBE_MIN_TEXT:
            return False

    visible_text = soup.get_text(" ", strip=True)
    return len(visible_text) < text_threshold
