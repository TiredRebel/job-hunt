# job-hunter LLM service — provider hub + LangGraph pipelines.
# Build context: services/llm (see infra/docker-compose.yml).
FROM python:3.13-slim

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app
ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    PYTHONUNBUFFERED=1

# Dependency layer first so code-only changes don't invalidate it.
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-install-project --no-dev

COPY src ./src
RUN uv sync --frozen --no-dev

RUN useradd --create-home --uid 1000 appuser && chown -R appuser /app
USER appuser

# Run the baked venv's uvicorn directly — invoking `uv run` here would
# re-sync (and pull dev deps back in) against the network on every start.
ENV PATH="/app/.venv/bin:$PATH"

EXPOSE 8002
CMD ["uvicorn", "llm.main:app", "--host", "0.0.0.0", "--port", "8002"]
