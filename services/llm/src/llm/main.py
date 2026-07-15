"""FastAPI entrypoint for the LLM service.

Run locally with ``uv run uvicorn llm.main:app --port 8002``.
Exposes ``/health`` for docker-compose healthchecks and n8n gating.
"""

from datetime import UTC, datetime

from fastapi import FastAPI

app = FastAPI(title="job-hunter llm", version="0.1.0")


@app.get("/health")
async def health() -> dict[str, str]:
    """Report service liveness.

    Returns:
        Mapping with a static ``status`` marker and an ISO-8601 timestamp.
    """
    return {"status": "ok", "timestamp": datetime.now(UTC).isoformat()}
