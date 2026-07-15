"""The job-processing LangGraph: normalize → tag → match? → cover_letter?.

``match`` runs only when a profile is supplied; ``cover_letter`` only when
the match score reaches the configured threshold.
"""

from dataclasses import dataclass
from typing import Any, TypedDict, cast

from langgraph.graph import END, START, StateGraph

from llm.pipelines import prompts
from llm.pipelines.engine import RunRecorder, run_structured
from llm.resolver import ProviderResolver
from llm.schemas import CoverLetter, JobSummary, MatchResult, NormalizedJob, ProfileInput


class ProcessState(TypedDict, total=False):
    """State flowing through the processing graph."""

    job_id: int | None
    title: str
    body: str
    source_url: str | None
    profile: ProfileInput | None
    normalized: NormalizedJob
    summary: JobSummary
    match: MatchResult
    cover_letter: CoverLetter


@dataclass(frozen=True)
class GraphDeps:
    """Dependencies injected into graph nodes."""

    resolver: ProviderResolver
    record: RunRecorder
    cover_letter_threshold: int


def build_process_graph(deps: GraphDeps) -> Any:  # noqa: ANN401
    """Compile the processing graph with ``deps`` bound into the nodes.

    Returns the compiled LangGraph (opaque type; invoke via
    :func:`run_process_graph`).
    """

    async def normalize_node(state: ProcessState) -> ProcessState:
        resolved = await deps.resolver.resolve("normalize")
        normalized = await run_structured(
            resolved,
            "normalize",
            NormalizedJob,
            prompts.NORMALIZE_SYSTEM,
            prompts.normalize_prompt(state["title"], state["body"], state.get("source_url")),
            deps.record,
            state.get("job_id"),
        )
        return {"normalized": normalized}

    async def tag_node(state: ProcessState) -> ProcessState:
        resolved = await deps.resolver.resolve("tag")
        summary = await run_structured(
            resolved,
            "tag",
            JobSummary,
            prompts.TAG_SYSTEM,
            prompts.tag_prompt(state["normalized"]),
            deps.record,
            state.get("job_id"),
        )
        return {"summary": summary}

    async def match_node(state: ProcessState) -> ProcessState:
        profile = state.get("profile")
        if profile is None:  # pragma: no cover - guarded by conditional edge
            return {}
        resolved = await deps.resolver.resolve("match")
        result = await run_structured(
            resolved,
            "match",
            MatchResult,
            prompts.MATCH_SYSTEM,
            prompts.match_prompt(state["normalized"], state.get("summary"), profile),
            deps.record,
            state.get("job_id"),
        )
        return {"match": result}

    async def cover_letter_node(state: ProcessState) -> ProcessState:
        profile = state.get("profile")
        if profile is None:  # pragma: no cover - guarded by conditional edge
            return {}
        resolved = await deps.resolver.resolve("cover_letter")
        letter = await run_structured(
            resolved,
            "cover_letter",
            CoverLetter,
            prompts.COVER_LETTER_SYSTEM,
            prompts.cover_letter_prompt(state["normalized"], profile),
            deps.record,
            state.get("job_id"),
        )
        return {"cover_letter": letter}

    def after_tag(state: ProcessState) -> str:
        return "match" if state.get("profile") is not None else END

    def after_match(state: ProcessState) -> str:
        result = state.get("match")
        if result is not None and result.score >= deps.cover_letter_threshold:
            return "cover_letter"
        return END

    graph = StateGraph(ProcessState)
    graph.add_node("normalize", normalize_node)
    graph.add_node("tag", tag_node)
    graph.add_node("match", match_node)
    graph.add_node("cover_letter", cover_letter_node)
    graph.add_edge(START, "normalize")
    graph.add_edge("normalize", "tag")
    graph.add_conditional_edges("tag", after_tag, ["match", END])
    graph.add_conditional_edges("match", after_match, ["cover_letter", END])
    graph.add_edge("cover_letter", END)
    return graph.compile()


async def run_process_graph(deps: GraphDeps, initial: ProcessState) -> ProcessState:
    """Build and run the graph, returning the final state."""
    compiled = build_process_graph(deps)
    result = await compiled.ainvoke(initial)
    return cast(ProcessState, result)
