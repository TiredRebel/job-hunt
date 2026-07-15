"""FastAPI entrypoint for the LLM service.

Run locally with ``uv run uvicorn llm.main:app --port 8002``.
Route handlers live in :mod:`llm.routes`; this module only wires the app
lifecycle (DB pool, HTTP client, provider resolver, NOTIFY listener).
"""

import asyncio
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from functools import partial

import httpx
from fastapi import FastAPI

from llm.config import get_settings
from llm.db import Db, create_pool
from llm.listener import listen_config_changes
from llm.pipelines.graph import GraphDeps
from llm.registry import build_provider
from llm.resolver import ProviderResolver
from llm.routes import router


@asynccontextmanager
async def _lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Wire pool, HTTP client, resolver and the NOTIFY listener.

    Tests pre-populate ``app.state`` and set ``wired=True`` to skip real I/O.
    """
    if getattr(app.state, "wired", False):
        yield
        return
    settings = get_settings()
    pool = create_pool(settings.database_url)
    await pool.open()
    db = Db(pool)
    client = httpx.AsyncClient(timeout=settings.request_timeout_s)
    resolver = ProviderResolver(
        db.active_provider,
        partial(build_provider, client=client),
        settings.provider_cache_ttl_s,
    )
    listener = asyncio.create_task(
        listen_config_changes(settings.database_url, resolver.invalidate)
    )
    app.state.db = db
    app.state.resolver = resolver
    app.state.graph_deps = GraphDeps(
        resolver=resolver,
        record=db.record_run,
        cover_letter_threshold=settings.cover_letter_threshold,
    )
    app.state.wired = True
    try:
        yield
    finally:
        listener.cancel()
        await client.aclose()
        await pool.close()


app = FastAPI(title="job-hunter llm", version="0.1.0", lifespan=_lifespan)
app.include_router(router)
