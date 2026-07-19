"""agent-browser subprocess fetcher for JS-heavy, non-API sources.

Only Upwork is currently seeded with this strategy (docs/SOURCES.md,
ADR-006). The exact CLI contract could not be verified against a locally
installed agent-browser during implementation (see design.md D6 in
openspec/changes/phase-2-crawl4ai-fetch-ladder) — installing a global npm
package and downloading a Chrome-for-Testing binary onto the user's machine
was judged too invasive to do unilaterally for a best-effort fallback on one
already-degraded source. The command is therefore fully configurable
(``Settings.agent_browser_cmd``) and output parsing is deliberately
defensive (structured JSON with a recognized content field, or raw stdout
as text) rather than hard-coded to one assumed schema.
"""

from __future__ import annotations

import asyncio
import json
import shlex

import httpx

from scraper.fetchers.base import FetchResult, FetchUnavailableError, PolitenessOverrides
from scraper.fetchers.gate import PolitenessGate

#: Candidate JSON field names holding page content, checked in order.
_CONTENT_FIELDS = ("html", "content", "text", "markdown")


def _extract_text(stdout: str) -> str:
    """Pull page content out of the CLI's stdout.

    Tries structured JSON first (a handful of plausible field names); falls
    back to treating the entire stdout as the content itself, matching a
    plain-text/markdown output mode.

    Args:
        stdout: Raw subprocess stdout.

    Returns:
        The extracted page content.
    """
    stripped = stdout.strip()
    try:
        payload = json.loads(stripped)
    except (json.JSONDecodeError, ValueError):
        return stripped
    if isinstance(payload, dict):
        for field in _CONTENT_FIELDS:
            value = payload.get(field)
            if isinstance(value, str) and value:
                return value
    return stripped


class AgentBrowserFetcher:
    """Best-effort fetcher shelling out to the ``agent-browser`` CLI.

    Never used to bypass a host's refusal —
    :class:`~scraper.fetchers.escalating.EscalatingFetcher` never escalates
    blocked responses or anti-bot interstitials to this fetcher; it only
    renders pages the primary fetcher couldn't render at all.
    """

    def __init__(
        self,
        gate: PolitenessGate,
        *,
        command: str = "npx -y agent-browser read",
        timeout_s: float = 30.0,
    ) -> None:
        """Initialize the fetcher.

        Args:
            gate: Shared politeness gate (robots + per-host pacing).
            command: Space-separated CLI invocation; the target URL is
                appended as the final argument.
            timeout_s: Maximum seconds to wait for the subprocess.
        """
        self._gate = gate
        self._argv = shlex.split(command)
        self._timeout_s = timeout_s

    async def get(
        self,
        url: str,
        *,
        params: dict[str, str] | None = None,
        politeness: PolitenessOverrides | None = None,
    ) -> FetchResult:
        """Render ``url`` via the agent-browser CLI.

        Args:
            url: Absolute URL to fetch.
            params: Optional query parameters merged into the URL.
            politeness: Optional per-source pacing/robots overrides.

        Returns:
            The captured page content as a transport-agnostic result.

        Raises:
            FetchBlockedError: Robots.txt disallows the URL.
            FetchUnavailableError: The CLI is missing, exited non-zero,
                timed out, or produced no output.
        """
        full_url = str(httpx.URL(url, params=params)) if params else url
        await self._gate.acquire(full_url, overrides=politeness)
        return await self._run(full_url)

    async def _run(self, url: str) -> FetchResult:
        """Invoke the CLI and map its outcome to fetcher semantics.

        Isolated as its own coroutine so tests can fake it without a real
        subprocess or the agent-browser CLI installed.
        """
        try:
            process = await asyncio.create_subprocess_exec(
                *self._argv,
                url,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
        except FileNotFoundError as exc:
            raise FetchUnavailableError(f"agent-browser command not found: {exc}") from exc

        try:
            stdout_bytes, stderr_bytes = await asyncio.wait_for(
                process.communicate(), timeout=self._timeout_s
            )
        except TimeoutError as exc:
            process.kill()
            await process.wait()
            raise FetchUnavailableError(f"agent-browser timed out rendering {url}") from exc

        if process.returncode != 0:
            detail = stderr_bytes.decode("utf-8", errors="replace").strip()
            raise FetchUnavailableError(
                f"agent-browser exited {process.returncode} rendering {url}: {detail}"
            )

        text = _extract_text(stdout_bytes.decode("utf-8", errors="replace"))
        if not text:
            raise FetchUnavailableError(f"agent-browser produced no output rendering {url}")
        return FetchResult(text=text, url=url, rendered=True)
