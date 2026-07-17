"""Tests for the processing graph (conditional match / cover-letter stages)."""

from conftest import (
    LETTER,
    MATCH_HIGH,
    MATCH_LOW,
    NORMALIZED,
    PROFILE,
    SUMMARY,
    FakeProvider,
    all_responses,
    make_resolver,
    make_row,
)
from pydantic import BaseModel

from llm.db import PipelineRunRecord, ProviderRow
from llm.pipelines.graph import GraphDeps, ProcessState, run_process_graph
from llm.schemas import MatchResult


def make_deps(
    responses: dict[type[BaseModel], BaseModel],
    runs: list[PipelineRunRecord],
    provider: FakeProvider | None = None,
    row: ProviderRow | None = None,
) -> GraphDeps:
    provider = provider or FakeProvider(responses)

    async def record(run: PipelineRunRecord) -> None:
        runs.append(run)

    return GraphDeps(
        resolver=make_resolver(provider, row=row), record=record, cover_letter_threshold=80
    )


def initial_state(with_profile: bool) -> ProcessState:
    return {
        "job_id": 1,
        "title": "Senior Python Developer",
        "body": "We need a Python backend developer.",
        "source_url": "https://jobs.dou.ua/companies/acme/vacancies/1/",
        "profile": PROFILE if with_profile else None,
    }


async def test_without_profile_stops_after_tag() -> None:
    runs: list[PipelineRunRecord] = []
    deps = make_deps(all_responses(), runs)

    final = await run_process_graph(deps, initial_state(with_profile=False))

    assert final["normalized"] == NORMALIZED
    assert final["summary"] == SUMMARY
    assert "match" not in final
    assert "cover_letter" not in final
    assert [r.pipeline for r in runs] == ["normalize", "tag"]


async def test_high_score_produces_cover_letter() -> None:
    runs: list[PipelineRunRecord] = []
    deps = make_deps(all_responses(), runs)

    final = await run_process_graph(deps, initial_state(with_profile=True))

    assert final["match"] == MATCH_HIGH
    assert final["cover_letter"] == LETTER
    assert [r.pipeline for r in runs] == ["normalize", "tag", "match", "cover_letter"]
    assert all(r.status == "success" for r in runs)
    assert all(r.job_id == 1 for r in runs)


async def test_low_score_skips_cover_letter() -> None:
    responses = all_responses()
    responses[MatchResult] = MATCH_LOW
    runs: list[PipelineRunRecord] = []
    deps = make_deps(responses, runs)

    final = await run_process_graph(deps, initial_state(with_profile=True))

    assert final["match"] == MATCH_LOW
    assert "cover_letter" not in final
    assert [r.pipeline for r in runs] == ["normalize", "tag", "match"]


async def test_cover_letter_uses_the_xml_prompt_for_an_anthropic_provider() -> None:
    runs: list[PipelineRunRecord] = []
    provider = FakeProvider(all_responses())
    deps = make_deps(all_responses(), runs, provider=provider, row=make_row(kind="anthropic"))

    await run_process_graph(deps, initial_state(with_profile=True))

    cover_letter_call = next(call for call in provider.calls if call.system.startswith("<role>"))
    assert "<grounding_rules>" in cover_letter_call.system


async def test_cover_letter_uses_the_plain_prompt_for_a_non_anthropic_provider() -> None:
    runs: list[PipelineRunRecord] = []
    provider = FakeProvider(all_responses())
    deps = make_deps(all_responses(), runs, provider=provider, row=make_row(kind="ollama"))

    await run_process_graph(deps, initial_state(with_profile=True))

    cover_letter_call = next(
        call for call in provider.calls if "Grounding rules (strict):" in call.system
    )
    assert "<role>" not in cover_letter_call.system
