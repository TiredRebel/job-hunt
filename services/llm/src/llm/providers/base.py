"""Shared helpers for provider adapters."""

import logging
import os
import re
from collections.abc import Callable

import httpx
import tenacity
from pydantic import BaseModel

from llm.config import get_settings
from llm.errors import MissingApiKeyError, ProviderRequestError
from llm.observability import get_correlation_id

logger = logging.getLogger(__name__)


def parse_structured_output[ModelT: BaseModel](schema: type[ModelT], text: str) -> ModelT:
    """Validate model JSON, accepting one outer Markdown JSON code fence.

    Some otherwise schema-compliant models wrap JSON in `````json`` fences
    despite a structured-output request.  Strip only a complete outer fence,
    preserving all JSON content and rejecting any other malformed response.
    """
    candidate = text.strip()
    lines = candidate.splitlines()
    if (
        len(lines) >= 2
        and re.fullmatch(r"```(?:json)?\s*", lines[0], flags=re.IGNORECASE)
        and re.fullmatch(r"```\s*", lines[-1])
    ):
        candidate = "\n".join(lines[1:-1]).strip()
    return schema.model_validate_json(candidate)


def resolve_api_key(env_name: str | None) -> str | None:
    """Resolve an API key from the environment variable named by the registry row.

    The DB stores only the env-var *name* (secrets policy); values live in
    ``.env``.  Returns ``None`` when the row needs no key.

    Raises:
        MissingApiKeyError: If ``env_name`` is set but the variable is empty.
    """
    if env_name is None:
        return None
    value = os.environ.get(env_name)
    if not value:
        raise MissingApiKeyError(env_name)
    return value


def _is_transient_httpx_error(exc: BaseException) -> bool:
    """Whether ``exc`` is a transient httpx failure worth retrying.

    Network-level errors (connect refused, timeout, DNS, ...) and HTTP 429
    or 5xx responses are transient; any other status is not (see design.md
    D6 in openspec/changes/phase-7-hardening).

    Args:
        exc: The exception raised by the attempted request.

    Returns:
        Whether the request should be retried.
    """
    if isinstance(exc, httpx.HTTPStatusError):
        return exc.response.status_code == 429 or exc.response.status_code >= 500
    return isinstance(exc, httpx.RequestError)


def _log_retry(target: str) -> Callable[[tenacity.RetryCallState], None]:
    """Build a ``before_sleep`` callback logging a retry under the correlation id.

    Args:
        target: Human-readable description of the request being retried.

    Returns:
        A callback suitable for ``tenacity.AsyncRetrying(before_sleep=...)``.
    """

    def _callback(retry_state: tenacity.RetryCallState) -> None:
        outcome = retry_state.outcome
        reason = str(outcome.exception()) if outcome is not None else "unknown"
        logger.warning(
            "retrying %s (attempt %d): %s",
            target,
            retry_state.attempt_number,
            reason,
            extra={"correlation_id": get_correlation_id()},
        )

    return _callback


def _retrying(target: str) -> tenacity.AsyncRetrying:
    """Build the retry policy shared by every provider HTTP call.

    Args:
        target: Human-readable description used in retry log lines.

    Returns:
        A configured :class:`tenacity.AsyncRetrying` instance.
    """
    return tenacity.AsyncRetrying(
        stop=tenacity.stop_after_attempt(get_settings().provider_retry_attempts),
        wait=tenacity.wait_exponential_jitter(initial=0.2, max=5.0),
        retry=tenacity.retry_if_exception(_is_transient_httpx_error),
        before_sleep=_log_retry(target),
        reraise=True,
    )


async def post_json(
    client: httpx.AsyncClient,
    url: str,
    payload: dict[str, object],
    headers: dict[str, str] | None = None,
) -> dict[str, object]:
    """POST ``payload`` as JSON and return the decoded JSON body.

    Retries transient failures (network errors, HTTP 429/5xx) with bounded
    exponential backoff (see :func:`_retrying`).

    Raises:
        ProviderRequestError: On transport failures or non-2xx responses
            that persist across every retry attempt.
    """
    response: httpx.Response | None = None
    try:
        async for attempt in _retrying(f"POST {url}"):
            with attempt:
                response = await client.post(url, json=payload, headers=headers)
                response.raise_for_status()
    except httpx.HTTPError as exc:
        raise ProviderRequestError(f"POST {url} failed: {exc}") from exc
    assert response is not None  # noqa: S101 — reraise=True guarantees this line is unreachable otherwise.
    body: dict[str, object] = response.json()
    return body


async def probe(
    client: httpx.AsyncClient, url: str, headers: dict[str, str] | None = None
) -> tuple[bool, str | None]:
    """GET ``url`` and report reachability as ``(ok, detail)`` without secrets.

    Retries transient failures the same way as :func:`get_json`; only the
    final attempt's outcome is reported.
    """
    try:
        async for attempt in _retrying(f"GET {url}"):
            with attempt:
                response = await client.get(url, headers=headers)
                response.raise_for_status()
    except httpx.HTTPError as exc:
        return False, type(exc).__name__
    return True, None


async def get_json(
    client: httpx.AsyncClient,
    url: str,
    headers: dict[str, str] | None = None,
) -> dict[str, object]:
    """GET ``url`` and return the decoded JSON body.

    Retries transient failures (network errors, HTTP 429/5xx) with bounded
    exponential backoff (see :func:`_retrying`).

    Raises:
        ProviderRequestError: On transport failures or non-2xx responses
            that persist across every retry attempt.
    """
    response: httpx.Response | None = None
    try:
        async for attempt in _retrying(f"GET {url}"):
            with attempt:
                response = await client.get(url, headers=headers)
                response.raise_for_status()
    except httpx.HTTPError as exc:
        raise ProviderRequestError(f"GET {url} failed: {exc}") from exc
    assert response is not None  # noqa: S101 — reraise=True guarantees this line is unreachable otherwise.
    body: dict[str, object] = response.json()
    return body
