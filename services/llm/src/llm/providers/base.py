"""Shared helpers for provider adapters."""

import os

import httpx

from llm.errors import MissingApiKeyError, ProviderRequestError


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


async def post_json(
    client: httpx.AsyncClient,
    url: str,
    payload: dict[str, object],
    headers: dict[str, str] | None = None,
) -> dict[str, object]:
    """POST ``payload`` as JSON and return the decoded JSON body.

    Raises:
        ProviderRequestError: On transport failures or non-2xx responses.
    """
    try:
        response = await client.post(url, json=payload, headers=headers)
        response.raise_for_status()
    except httpx.HTTPError as exc:
        raise ProviderRequestError(f"POST {url} failed: {exc}") from exc
    body: dict[str, object] = response.json()
    return body


async def probe(
    client: httpx.AsyncClient, url: str, headers: dict[str, str] | None = None
) -> tuple[bool, str | None]:
    """GET ``url`` and report reachability as ``(ok, detail)`` without secrets."""
    try:
        response = await client.get(url, headers=headers)
        response.raise_for_status()
    except httpx.HTTPError as exc:
        return False, type(exc).__name__
    return True, None
