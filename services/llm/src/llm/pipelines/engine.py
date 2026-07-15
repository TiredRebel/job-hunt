"""Structured-output execution engine with constrained retries.

Per docs/LLM_CONFIG.md: schema-invalid replies are retried ×2 with a
corrective suffix; on exhaustion the run is recorded as ``failed`` and the
error is raised — garbage is never persisted.
"""

import time
from collections.abc import Awaitable, Callable

from pydantic import BaseModel

from llm.db import PipelineRunRecord
from llm.errors import SchemaValidationError
from llm.resolver import PipelineName, ResolvedPipeline
from llm.schemas import CompletionRequest

MAX_SCHEMA_RETRIES = 2

RunRecorder = Callable[[PipelineRunRecord], Awaitable[None]]

_RETRY_SUFFIX = (
    "\n\nYour previous reply was not valid for the required JSON schema ({error}). "
    "Return ONLY valid JSON matching the schema."
)


async def run_structured[ModelT: BaseModel](
    resolved: ResolvedPipeline,
    pipeline: PipelineName,
    schema: type[ModelT],
    system: str,
    prompt: str,
    record: RunRecorder,
    job_id: int | None = None,
) -> ModelT:
    """Run one pipeline call, record it in ``llm.pipeline_runs``, return the model.

    Raises:
        SchemaValidationError: After the constrained retries are exhausted.
        ProviderRequestError: On transport failure (recorded as ``failed``).
    """
    started = time.monotonic()
    attempt_prompt = prompt
    error: Exception | None = None
    for _attempt in range(MAX_SCHEMA_RETRIES + 1):
        request = CompletionRequest(
            model=resolved.model,
            prompt=attempt_prompt,
            system=system,
            temperature=resolved.temperature,
        )
        try:
            result = await resolved.provider.complete_structured(request, schema)
        except SchemaValidationError as exc:
            error = exc
            attempt_prompt = prompt + _RETRY_SUFFIX.format(error=exc)
            continue
        except Exception as exc:
            error = exc
            break
        await record(_record(resolved, pipeline, job_id, started, "success", None))
        return result
    await record(_record(resolved, pipeline, job_id, started, "failed", str(error)))
    raise error if error is not None else SchemaValidationError("unreachable")


def _record(
    resolved: ResolvedPipeline,
    pipeline: PipelineName,
    job_id: int | None,
    started: float,
    status: str,
    error: str | None,
) -> PipelineRunRecord:
    latency_ms = int((time.monotonic() - started) * 1000)
    return PipelineRunRecord.model_validate(
        {
            "job_id": job_id,
            "pipeline": pipeline,
            "provider_slug": resolved.provider.slug,
            "model": resolved.model,
            "latency_ms": latency_ms,
            "status": status,
            "error": error,
        }
    )
