"""``LISTEN llm_config_changed`` loop for hot-switch cache invalidation."""

import asyncio
import logging
from collections.abc import Callable

from psycopg import AsyncConnection

from llm.db import CONFIG_CHANNEL

logger = logging.getLogger(__name__)

_RECONNECT_DELAY_S = 5.0


async def listen_config_changes(conninfo: str, on_notify: Callable[[], None]) -> None:
    """Run forever: invalidate on every NOTIFY, reconnect with a delay on failure.

    Intended as a background task started from the FastAPI lifespan; it exits
    only via cancellation.
    """
    while True:
        try:
            conn = await AsyncConnection.connect(conninfo, autocommit=True)
            async with conn:
                await conn.execute(f"LISTEN {CONFIG_CHANNEL}")
                logger.info("listening on %s", CONFIG_CHANNEL)
                async for _ in conn.notifies():
                    on_notify()
        except Exception:  # noqa: BLE001 - resilience loop, never crash the app
            logger.exception("config listener failed; reconnecting in %ss", _RECONNECT_DELAY_S)
            await asyncio.sleep(_RECONNECT_DELAY_S)
