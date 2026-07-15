"""PostgreSQL access for the LLM service (registry reads, run bookkeeping).

Tables live in schemas ``core`` and ``llm`` (see DATA_MODEL.md, migration
0003).  Hot-switch signalling uses ``NOTIFY llm_config_changed``.
"""

from typing import Any, Literal

from psycopg.rows import dict_row
from psycopg_pool import AsyncConnectionPool
from pydantic import BaseModel, Field

from llm.errors import UnknownProviderError

CONFIG_CHANNEL = "llm_config_changed"

_PROVIDER_COLUMNS = (
    "slug, kind, base_url, default_model, api_key_env, pipeline_overrides, is_active, params"
)


class ProviderRow(BaseModel):
    """A row of ``core.llm_providers``."""

    slug: str
    kind: str
    base_url: str
    default_model: str
    api_key_env: str | None = None
    pipeline_overrides: dict[str, dict[str, Any]] = Field(default_factory=dict)
    is_active: bool = False
    params: dict[str, Any] = Field(default_factory=dict)


class PipelineRunRecord(BaseModel):
    """A row for ``llm.pipeline_runs`` (observability, cost tracking)."""

    job_id: int | None = None
    pipeline: Literal["normalize", "tag", "match", "cover_letter"]
    provider_slug: str
    model: str
    tokens_in: int | None = None
    tokens_out: int | None = None
    latency_ms: int | None = None
    status: Literal["success", "failed"]
    error: str | None = None


def create_pool(conninfo: str) -> AsyncConnectionPool:
    """Create a lazily-opened async connection pool (call ``pool.open()`` in lifespan)."""
    return AsyncConnectionPool(
        conninfo, open=False, min_size=1, max_size=4, kwargs={"row_factory": dict_row}
    )


class Db:
    """Query layer over the shared connection pool."""

    def __init__(self, pool: AsyncConnectionPool) -> None:
        """Wrap an (opened) ``AsyncConnectionPool``."""
        self._pool = pool

    async def list_providers(self) -> list[ProviderRow]:
        """Return all registry rows ordered by slug."""
        async with self._pool.connection() as conn:
            cursor = await conn.execute(
                f"SELECT {_PROVIDER_COLUMNS} FROM core.llm_providers ORDER BY slug"  # noqa: S608
            )
            rows = await cursor.fetchall()
        return [ProviderRow.model_validate(row) for row in rows]

    async def active_provider(self) -> ProviderRow | None:
        """Return the single active registry row, if any."""
        async with self._pool.connection() as conn:
            cursor = await conn.execute(
                f"SELECT {_PROVIDER_COLUMNS} FROM core.llm_providers WHERE is_active"  # noqa: S608
            )
            row = await cursor.fetchone()
        return ProviderRow.model_validate(row) if row is not None else None

    async def set_active(self, slug: str) -> ProviderRow:
        """Activate ``slug`` and broadcast ``NOTIFY llm_config_changed``.

        Raises:
            UnknownProviderError: If no row exists for ``slug``.
        """
        async with self._pool.connection() as conn:
            await conn.execute("UPDATE core.llm_providers SET is_active = false WHERE is_active")
            cursor = await conn.execute(
                "UPDATE core.llm_providers SET is_active = true WHERE slug = %s "  # noqa: S608
                f"RETURNING {_PROVIDER_COLUMNS}",
                (slug,),
            )
            row = await cursor.fetchone()
            if row is None:
                raise UnknownProviderError(f"no provider with slug {slug!r}")
            await conn.execute(f"NOTIFY {CONFIG_CHANNEL}")
        return ProviderRow.model_validate(row)

    async def record_run(self, run: PipelineRunRecord) -> None:
        """Insert one ``llm.pipeline_runs`` row."""
        async with self._pool.connection() as conn:
            await conn.execute(
                "INSERT INTO llm.pipeline_runs (job_id, pipeline, provider_slug, model,"
                " tokens_in, tokens_out, latency_ms, status, error)"
                " VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)",
                (
                    run.job_id,
                    run.pipeline,
                    run.provider_slug,
                    run.model,
                    run.tokens_in,
                    run.tokens_out,
                    run.latency_ms,
                    run.status,
                    run.error,
                ),
            )
