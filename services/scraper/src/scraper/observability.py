"""Structured JSON logging and request correlation ids.

Shared observability primitives: a contextvar carrying the current request's
correlation id, a logging filter that injects it into every log record, a
JSON logging configuration, and an ASGI middleware that reads or mints the id
and echoes it on the response (see design.md D1/D3 in
openspec/changes/phase-7-hardening).
"""

from __future__ import annotations

import logging
import sys
from contextvars import ContextVar
from uuid import uuid4

from pythonjsonlogger.json import JsonFormatter
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response
from starlette.types import ASGIApp

CORRELATION_ID_HEADER = "X-Correlation-Id"

_correlation_id: ContextVar[str | None] = ContextVar("correlation_id", default=None)


def get_correlation_id() -> str | None:
    """Return the current request's correlation id, if one is bound.

    Returns:
        The bound correlation id, or ``None`` outside a request context.
    """
    return _correlation_id.get()


def set_correlation_id(value: str | None) -> None:
    """Bind ``value`` as the current context's correlation id.

    Args:
        value: The correlation id to bind, or ``None`` to clear it.
    """
    _correlation_id.set(value)


class _CorrelationIdLogFilter(logging.Filter):
    """Injects the bound correlation id onto every log record."""

    def filter(self, record: logging.LogRecord) -> bool:
        """Attach ``correlation_id`` to ``record`` and allow it through.

        Args:
            record: The log record being emitted.

        Returns:
            Always ``True`` — this filter only enriches records.
        """
        record.correlation_id = get_correlation_id()
        return True


def configure_logging(level: str) -> None:
    """Install single-line JSON logging with correlation ids.

    Replaces the root logger's handlers with one JSON-formatted stream
    handler carrying a correlation-id filter, and routes uvicorn's loggers
    through the same handler so every service log shares the format.

    Args:
        level: Log level name (e.g. ``"info"``, ``"debug"``), case-insensitive.
    """
    resolved_level = logging.getLevelNamesMapping().get(level.upper(), logging.INFO)
    handler = logging.StreamHandler(stream=sys.stdout)
    formatter = JsonFormatter("%(asctime)s %(levelname)s %(name)s %(message)s %(correlation_id)s")
    handler.setFormatter(formatter)
    handler.addFilter(_CorrelationIdLogFilter())

    root = logging.getLogger()
    root.handlers = [handler]
    root.setLevel(resolved_level)

    for uvicorn_logger_name in ("uvicorn", "uvicorn.error", "uvicorn.access"):
        uvicorn_logger = logging.getLogger(uvicorn_logger_name)
        uvicorn_logger.handlers = []
        uvicorn_logger.propagate = True


class CorrelationIdMiddleware(BaseHTTPMiddleware):
    """Reads or mints the request correlation id and echoes it on the response."""

    def __init__(self, app: ASGIApp) -> None:
        """Wrap ``app`` with correlation-id handling.

        Args:
            app: The ASGI application to wrap.
        """
        super().__init__(app)

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        """Bind the request's correlation id for the duration of the request.

        The id is set on the context *before* ``call_next`` so the spawned
        request-handling task inherits it (contextvars are copied at task
        creation, not shared live), then echoed on the response header.

        Args:
            request: The incoming request.
            call_next: The next handler in the middleware chain.

        Returns:
            The response, with ``X-Correlation-Id`` set.
        """
        incoming = request.headers.get(CORRELATION_ID_HEADER)
        correlation_id = incoming if incoming else uuid4().hex
        set_correlation_id(correlation_id)
        try:
            response = await call_next(request)
        finally:
            set_correlation_id(None)
        response.headers[CORRELATION_ID_HEADER] = correlation_id
        return response
