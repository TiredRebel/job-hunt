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
)
from pydantic import BaseModel

from llm.db import PipelineRunRecord
from llm.pipelines.graph import GraphDeps, ProcessState, run_process_graph
from llm.schemas import MatchResult


def make_deps(
    responses: dict[type[BaseModel], BaseModel], runs: list[PipelineRunRecord]
) -> GraphDeps:
    provider = FakeProvider(responses)

    async def record(run: PipelineRunRecord) -> None:
        runs.append(run)

    return GraphDeps(resolver=make_resolver(provider), record=record, cover_letter_threshold=80)


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
