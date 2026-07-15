"""Hot-switchable provider resolution (docs/LLM_CONFIG.md).

The active row is read from the DB and cached with a short TTL; a
``LISTEN llm_config_changed`` loop invalidates the cache so the next task
resolves fresh — no restarts, in-flight tasks finish on the old provider.
"""

import time
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from typing import Literal

from llm.db import ProviderRow
from llm.errors import ModelResolutionError, NoActiveProviderError
from llm.ports import LLMProvider

PipelineName = Literal["normalize", "tag", "match", "cover_letter"]

FetchActive = Callable[[], Awaitable[ProviderRow | None]]
BuildProvider = Callable[[ProviderRow], LLMProvider]


@dataclass(frozen=True)
class ResolvedPipeline:
    """Provider + model + sampling params resolved for one pipeline call."""

    provider: LLMProvider
    row: ProviderRow
    model: str
    temperature: float


class ProviderResolver:
    """Resolve the active provider per pipeline with a TTL cache.

    Resolution order for the model: pipeline override → provider
    ``default_model`` → error (never a silent fallback to another provider).
    """

    def __init__(self, fetch_active: FetchActive, build: BuildProvider, ttl_s: float) -> None:
        """Wire DB fetch + adapter factory; ``ttl_s`` covers missed NOTIFYs."""
        self._fetch_active = fetch_active
        self._build = build
        self._ttl_s = ttl_s
        self._cached: tuple[ProviderRow, LLMProvider] | None = None
        self._expires_at = 0.0

    def invalidate(self) -> None:
        """Drop the cached provider (called on ``llm_config_changed``)."""
        self._cached = None
        self._expires_at = 0.0

    async def _active(self) -> tuple[ProviderRow, LLMProvider]:
        now = time.monotonic()
        if self._cached is not None and now < self._expires_at:
            return self._cached
        row = await self._fetch_active()
        if row is None:
            raise NoActiveProviderError("core.llm_providers has no active row")
        self._cached = (row, self._build(row))
        self._expires_at = now + self._ttl_s
        return self._cached

    async def resolve(self, pipeline: PipelineName) -> ResolvedPipeline:
        """Resolve provider/model/temperature for ``pipeline``.

        Raises:
            NoActiveProviderError: If no registry row is active.
            ModelResolutionError: If neither override nor default names a model.
        """
        row, provider = await self._active()
        override = row.pipeline_overrides.get(pipeline, {})
        model_raw = override.get("model") or row.default_model
        if not isinstance(model_raw, str) or not model_raw:
            raise ModelResolutionError(f"no model resolvable for pipeline {pipeline!r}")
        temperature_raw = override.get("temperature")
        temperature = float(temperature_raw) if isinstance(temperature_raw, int | float) else 0.0
        return ResolvedPipeline(
            provider=provider, row=row, model=model_raw, temperature=temperature
        )
