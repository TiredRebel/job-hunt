# job-hunter scraper service — source adapters, scrape runs, dedup.
# Build context: services/scraper (see infra/docker-compose.yml).
#
# INSTALL_BROWSER (default: true) pulls in the "browser" dependency group
# (crawl4ai) plus a Playwright Chromium install. The seeded sources dou/
# workua/jobua all use fetch_strategy=crawl4ai, so the default is a working
# image out of the box. Build with --build-arg INSTALL_BROWSER=false for a
# much smaller image if you only run api-strategy sources (reddit).
FROM python:3.13-slim

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app
ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    PYTHONUNBUFFERED=1

ARG INSTALL_BROWSER=true
# Fixed path so browsers installed as root (needed for --with-deps/apt) are
# still found once the process drops to appuser at runtime.
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# Dependency layer first so code-only changes don't invalidate it.
COPY pyproject.toml uv.lock ./
RUN if [ "$INSTALL_BROWSER" = "true" ]; then \
      uv sync --frozen --no-install-project --no-dev --group browser; \
    else \
      uv sync --frozen --no-install-project --no-dev; \
    fi

COPY src ./src
RUN if [ "$INSTALL_BROWSER" = "true" ]; then \
      uv sync --frozen --no-dev --group browser; \
    else \
      uv sync --frozen --no-dev; \
    fi

# playwright install-deps needs root/apt; run before creating the app user.
RUN if [ "$INSTALL_BROWSER" = "true" ]; then \
      uv run playwright install --with-deps chromium; \
    fi

RUN useradd --create-home --uid 1000 appuser && \
    chown -R appuser /app && \
    mkdir -p "$PLAYWRIGHT_BROWSERS_PATH" && chown -R appuser "$PLAYWRIGHT_BROWSERS_PATH"
USER appuser

# Run the baked venv's uvicorn directly — invoking `uv run` here would
# re-sync (and pull dev deps back in) against the network on every start.
ENV PATH="/app/.venv/bin:$PATH"

EXPOSE 8001
CMD ["uvicorn", "scraper.main:app", "--host", "0.0.0.0", "--port", "8001"]
