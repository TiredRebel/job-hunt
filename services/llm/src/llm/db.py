"""PostgreSQL access for the LLM service (registry reads, run bookkeeping).

Tables live in schemas ``core`` and ``llm`` (see DATA_MODEL.md, migration
0003).  Hot-switch signalling uses ``NOTIFY llm_config_changed``.
"""

from typing import Any, Literal

from psycopg.rows import dict_row
from psycopg.types.json import Json
from psycopg_pool import AsyncConnectionPool
from pydantic import BaseModel, Field

from llm.errors import UnknownProviderError

CONFIG_CHANNEL = "llm_config_changed"

_PROVIDER_COLUMNS = (
    "slug, kind, base_url, default_model, api_key_env, pipeline_overrides, is_active, params"
)

#: Sentinel distinguishing "field omitted" (leave column untouched) from an
#: explicit ``None`` (clear the column) in :meth:`Db.update_provider`.
UNSET: Any = object()


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

    async def get_provider(self, slug: str) -> ProviderRow | None:
        """Return one registry row by slug, or ``None`` if unknown."""
        async with self._pool.connection() as conn:
            cursor = await conn.execute(
                f"SELECT {_PROVIDER_COLUMNS} FROM core.llm_providers WHERE slug = %s",  # noqa: S608
                (slug,),
            )
            row = await cursor.fetchone()
        return ProviderRow.model_validate(row) if row is not None else None

    async def create_provider(
        self,
        slug: str,
        kind: str,
        base_url: str,
        default_model: str,
        api_key_env: str | None = None,
    ) -> ProviderRow | None:
        """Insert a new, inactive registry row.

        No ``NOTIFY`` — an inactive row can't be resolved by any pipeline,
        so there is nothing for a running worker to reload yet.

        Returns:
            The created row, or ``None`` if ``slug`` already exists (caller
            maps this to 409).
        """
        async with self._pool.connection() as conn:
            cursor = await conn.execute(
                "INSERT INTO core.llm_providers (slug, kind, base_url, default_model, api_key_env)"  # noqa: S608
                " VALUES (%s, %s, %s, %s, %s)"
                " ON CONFLICT (slug) DO NOTHING"
                f" RETURNING {_PROVIDER_COLUMNS}",
                (slug, kind, base_url, default_model, api_key_env),
            )
            row = await cursor.fetchone()
        return ProviderRow.model_validate(row) if row is not None else None

    async def update_provider(
        self,
        slug: str,
        *,
        default_model: str | None = None,
        pipeline_overrides: dict[str, dict[str, Any]] | None = None,
        base_url: str | None = None,
        api_key_env: str | None = UNSET,
    ) -> ProviderRow | None:
        """Update only the provided fields and broadcast ``NOTIFY``.

        ``api_key_env`` uses the :data:`UNSET` sentinel as its default so an
        explicit ``None`` (clear the key requirement) is distinguishable
        from the field being omitted (leave the column untouched).

        Returns:
            The updated row, or ``None`` if ``slug`` is unknown.
        """
        set_clauses: list[str] = []
        values: list[Any] = []
        if default_model is not None:
            set_clauses.append("default_model = %s")
            values.append(default_model)
        if pipeline_overrides is not None:
            set_clauses.append("pipeline_overrides = %s")
            values.append(Json(pipeline_overrides))
        if base_url is not None:
            set_clauses.append("base_url = %s")
            values.append(base_url)
        if api_key_env is not UNSET:
            set_clauses.append("api_key_env = %s")
            values.append(api_key_env)

        if not set_clauses:
            return await self.get_provider(slug)

        values.append(slug)
        async with self._pool.connection() as conn:
            cursor = await conn.execute(
                f"UPDATE core.llm_providers SET {', '.join(set_clauses)}"  # noqa: S608
                " WHERE slug = %s"
                f" RETURNING {_PROVIDER_COLUMNS}",
                values,
            )
            row = await cursor.fetchone()
            if row is None:
                return None
            await conn.execute(f"NOTIFY {CONFIG_CHANNEL}")
        return ProviderRow.model_validate(row)

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
