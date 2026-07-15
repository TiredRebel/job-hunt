"""Tests for the REST surface (fakes injected via app state, no real I/O)."""

from conftest import FakeDb, FakeProvider, all_responses, make_resolver, make_row
from fastapi.testclient import TestClient

from llm.db import ProviderRow
from llm.main import app
from llm.pipelines.graph import GraphDeps


def wire(rows: list[ProviderRow] | None = None, active: bool = True) -> FakeDb:
    rows = (
        rows
        if rows is not None
        else [
            make_row(),
            make_row(slug="openrouter", kind="openai-compatible", active=False),
        ]
    )
    db = FakeDb(rows)
    provider = FakeProvider(all_responses())

    if active:
        resolver = make_resolver(provider)
    else:

        async def fetch_none() -> ProviderRow | None:
            return None

        from llm.resolver import ProviderResolver

        resolver = ProviderResolver(fetch_none, lambda _row: provider, ttl_s=30.0)

    app.state.db = db
    app.state.resolver = resolver
    app.state.graph_deps = GraphDeps(
        resolver=resolver, record=db.record_run, cover_letter_threshold=80
    )
    app.state.wired = True
    return db


def test_list_providers() -> None:
    wire()
    client = TestClient(app)

    response = client.get("/providers")

    assert response.status_code == 200
    body = response.json()
    assert [p["slug"] for p in body] == ["ollama-local", "openrouter"]
    assert all("params" not in p for p in body)


def test_set_active_provider_switches_and_notifies() -> None:
    db = wire()
    client = TestClient(app)

    response = client.put("/providers/active", json={"slug": "openrouter"})

    assert response.status_code == 200
    assert response.json()["is_active"] is True
    assert db.notified == 1
    assert [r.slug for r in db.rows if r.is_active] == ["openrouter"]


def test_set_active_unknown_slug_404() -> None:
    wire()
    client = TestClient(app)

    response = client.put("/providers/active", json={"slug": "nope"})

    assert response.status_code == 404


def test_match_endpoint() -> None:
    db = wire()
    client = TestClient(app)

    response = client.post(
        "/match",
        json={
            "job_id": 5,
            "job": {"title": "Dev", "description_md": "Python."},
            "profile": {"summary": "Backend dev.", "skills": ["python"]},
        },
    )

    assert response.status_code == 200
    assert response.json()["score"] == 91
    assert [r.pipeline for r in db.runs] == ["match"]


def test_process_job_full_flow() -> None:
    db = wire()
    client = TestClient(app)

    response = client.post(
        "/process/job",
        json={
            "job_id": 1,
            "title": "Senior Python Developer",
            "body": "We need a Python backend developer.",
            "profile": {"summary": "Backend dev.", "skills": ["python"]},
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["normalized"]["title"] == "Senior Python Developer"
    assert body["match"]["score"] == 91
    assert body["cover_letter"] is not None
    assert len(db.runs) == 4


def test_process_job_no_active_provider_503() -> None:
    wire(active=False)
    client = TestClient(app)

    response = client.post("/process/job", json={"title": "Dev", "body": "Python."})

    assert response.status_code == 503
