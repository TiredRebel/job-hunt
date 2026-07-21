"""Tests for the REST surface (fakes injected via app state, no real I/O)."""

from conftest import FakeDb, FakeProvider, all_responses, make_resolver, make_row
from fastapi.testclient import TestClient

from llm.db import ProviderRow
from llm.errors import MissingApiKeyError, ProviderRequestError, UnknownProviderKindError
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
    app.state.build_provider = lambda _row: provider
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


def test_cover_letter_endpoint() -> None:
    db = wire()
    client = TestClient(app)

    response = client.post(
        "/cover-letter",
        json={
            "job_id": 5,
            "job": {"title": "Dev", "description_md": "Python."},
            "profile": {"summary": "Backend dev.", "skills": ["python"]},
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["subject"]
    assert [r.pipeline for r in db.runs] == ["cover_letter"]


def test_cover_letter_endpoint_selects_prompt_by_provider_kind() -> None:
    db = wire(rows=[make_row(kind="anthropic")])
    client = TestClient(app)
    provider = FakeProvider(all_responses())
    from llm.resolver import ProviderResolver

    async def fetch() -> ProviderRow:
        return db.rows[0]

    app.state.resolver = ProviderResolver(fetch, lambda _row: provider, ttl_s=30.0)
    app.state.graph_deps = GraphDeps(
        resolver=app.state.resolver, record=db.record_run, cover_letter_threshold=80
    )

    response = client.post(
        "/cover-letter",
        json={
            "job": {"title": "Dev", "description_md": "Python."},
            "profile": {"summary": "Backend dev.", "skills": ["python"]},
        },
    )

    assert response.status_code == 200
    assert provider.calls[0].system.startswith("<role>")


def test_cover_letter_no_active_provider_503() -> None:
    wire(active=False)
    client = TestClient(app)

    response = client.post(
        "/cover-letter",
        json={
            "job": {"title": "Dev", "description_md": "Python."},
            "profile": {"summary": "Backend dev.", "skills": ["python"]},
        },
    )

    assert response.status_code == 503


def test_cover_letter_llm_error_502() -> None:
    db = wire()
    client = TestClient(app)
    provider = FakeProvider(all_responses(), fail_times=999)
    from llm.resolver import ProviderResolver

    async def fetch() -> ProviderRow:
        return db.rows[0]

    app.state.resolver = ProviderResolver(fetch, lambda _row: provider, ttl_s=30.0)
    app.state.graph_deps = GraphDeps(
        resolver=app.state.resolver, record=db.record_run, cover_letter_threshold=80
    )

    response = client.post(
        "/cover-letter",
        json={
            "job": {"title": "Dev", "description_md": "Python."},
            "profile": {"summary": "Backend dev.", "skills": ["python"]},
        },
    )

    assert response.status_code == 502


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


def test_create_provider() -> None:
    db = wire()
    client = TestClient(app)

    response = client.post(
        "/providers",
        json={
            "slug": "new-provider",
            "kind": "openai-compatible",
            "base_url": "https://api.example.com",
            "default_model": "gpt-4o-mini",
            "api_key_env": "EXAMPLE_API_KEY",
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["slug"] == "new-provider"
    assert body["is_active"] is False
    assert any(r.slug == "new-provider" for r in db.rows)


def test_create_provider_duplicate_slug_409() -> None:
    wire()
    client = TestClient(app)

    response = client.post(
        "/providers",
        json={
            "slug": "ollama-local",
            "kind": "ollama",
            "base_url": "http://localhost:11434",
            "default_model": "qwen3:14b",
        },
    )

    assert response.status_code == 409


def test_create_provider_defaults_kind_to_openai_compatible() -> None:
    wire()
    client = TestClient(app)

    response = client.post(
        "/providers",
        json={
            "slug": "another-provider",
            "base_url": "https://api.example.com",
            "default_model": "gpt-4o-mini",
        },
    )

    assert response.status_code == 201
    assert response.json()["kind"] == "openai-compatible"


def test_test_provider_unknown_slug_404() -> None:
    wire()
    client = TestClient(app)

    response = client.post("/providers/nope/test")

    assert response.status_code == 404


def test_test_provider_ok() -> None:
    wire()
    client = TestClient(app)

    response = client.post("/providers/ollama-local/test")

    assert response.status_code == 200
    body = response.json()
    assert body["ok"] is True
    assert body["elapsed_ms"] is not None


def test_test_provider_runs_a_minimal_completion_with_default_model() -> None:
    wire()
    client = TestClient(app)
    provider = FakeProvider(all_responses())
    app.state.build_provider = lambda _row: provider

    response = client.post("/providers/ollama-local/test")

    assert response.status_code == 200
    assert len(provider.calls) == 1
    request = provider.calls[0]
    assert request.model == "qwen3:14b"
    assert request.max_tokens == 1


def test_test_provider_connection_uses_draft_values_without_saving() -> None:
    db = wire()
    client = TestClient(app)
    provider = FakeProvider(all_responses())
    seen_rows: list[ProviderRow] = []

    def build(row: ProviderRow) -> FakeProvider:
        seen_rows.append(row)
        return provider

    app.state.build_provider = build

    response = client.post(
        "/providers/test",
        json={
            "kind": "ollama",
            "base_url": "https://ollama.com/api",
            "default_model": "glm-5.2",
            "api_key_env": "OLLAMA_API_KEY",
        },
    )

    assert response.json()["ok"] is True
    assert seen_rows[0].base_url == "https://ollama.com/api"
    assert seen_rows[0].default_model == "glm-5.2"
    assert seen_rows[0].api_key_env == "OLLAMA_API_KEY"
    assert db.rows[0].base_url == "http://localhost:11434"


def test_test_provider_connection_rejects_a_raw_api_key() -> None:
    wire()
    client = TestClient(app)

    response = client.post(
        "/providers/test",
        json={
            "kind": "ollama",
            "base_url": "https://ollama.com/api",
            "default_model": "glm-5.2",
            "api_key_env": "not-an-environment-variable",
        },
    )

    assert response.status_code == 422


def test_update_provider_name() -> None:
    db = wire()
    client = TestClient(app)

    response = client.patch("/providers/ollama-local", json={"name": "Ollama Cloud"})

    assert response.status_code == 200
    assert response.json()["name"] == "Ollama Cloud"
    assert db.rows[0].name == "Ollama Cloud"


def test_test_provider_never_disturbs_active_row_or_notifies() -> None:
    db = wire()
    client = TestClient(app)

    response = client.post("/providers/openrouter/test")

    assert response.status_code == 200
    assert [r.slug for r in db.rows if r.is_active] == ["ollama-local"]
    assert db.notified == 0


def test_test_provider_reports_unreachable_without_500() -> None:
    wire()
    client = TestClient(app)
    app.state.build_provider = lambda _row: FakeProvider(
        complete_error=ProviderRequestError("ConnectError")
    )

    response = client.post("/providers/ollama-local/test")

    assert response.status_code == 200
    body = response.json()
    assert body["ok"] is False
    assert body["detail"] == "ConnectError"


def test_test_provider_missing_api_key_reports_ok_false() -> None:
    wire()
    client = TestClient(app)

    def raise_missing_key(_row: ProviderRow) -> FakeProvider:
        raise MissingApiKeyError("OPENROUTER_API_KEY")

    app.state.build_provider = raise_missing_key

    response = client.post("/providers/ollama-local/test")

    assert response.status_code == 200
    body = response.json()
    assert body["ok"] is False
    assert "OPENROUTER_API_KEY" in body["detail"]


def test_test_provider_unknown_kind_reports_ok_false() -> None:
    wire()
    client = TestClient(app)

    def raise_unknown_kind(_row: ProviderRow) -> FakeProvider:
        raise UnknownProviderKindError("no provider factory for kind 'bogus'")

    app.state.build_provider = raise_unknown_kind

    response = client.post("/providers/ollama-local/test")

    assert response.status_code == 200
    assert response.json()["ok"] is False


def test_list_provider_models() -> None:
    wire()
    client = TestClient(app)
    app.state.build_provider = lambda _row: FakeProvider(models=["llama3", "qwen3:14b"])

    response = client.get("/providers/ollama-local/models")

    assert response.status_code == 200
    body = response.json()
    assert body["models"] == ["llama3", "qwen3:14b"]
    assert body["error"] is None


def test_list_provider_models_unknown_slug_404() -> None:
    wire()
    client = TestClient(app)

    response = client.get("/providers/nope/models")

    assert response.status_code == 404


def test_list_provider_models_reports_error_without_500() -> None:
    wire()
    client = TestClient(app)
    app.state.build_provider = lambda _row: FakeProvider(
        list_models_error=ProviderRequestError("GET failed: connection refused")
    )

    response = client.get("/providers/ollama-local/models")

    assert response.status_code == 200
    body = response.json()
    assert body["models"] == []
    assert body["error"]


def test_update_provider_default_model() -> None:
    db = wire()
    client = TestClient(app)

    response = client.patch("/providers/ollama-local", json={"default_model": "qwen3:32b"})

    assert response.status_code == 200
    assert response.json()["default_model"] == "qwen3:32b"
    assert db.notified == 1


def test_update_provider_unknown_slug_404() -> None:
    wire()
    client = TestClient(app)

    response = client.patch("/providers/nope", json={"default_model": "x"})

    assert response.status_code == 404


def test_update_provider_clears_api_key_env_via_explicit_null() -> None:
    db = wire(rows=[make_row(slug="openrouter", kind="openai-compatible", api_key_env="OR_KEY")])
    client = TestClient(app)

    response = client.patch("/providers/openrouter", json={"api_key_env": None})

    assert response.status_code == 200
    assert response.json()["api_key_env"] is None
    assert db.rows[0].api_key_env is None


def test_update_provider_omitted_api_key_env_untouched() -> None:
    db = wire(rows=[make_row(slug="openrouter", kind="openai-compatible", api_key_env="OR_KEY")])
    client = TestClient(app)

    response = client.patch("/providers/openrouter", json={"default_model": "gpt-4o"})

    assert response.status_code == 200
    assert response.json()["api_key_env"] == "OR_KEY"
    assert db.rows[0].default_model == "gpt-4o"


def test_update_provider_replaces_pipeline_overrides() -> None:
    db = wire(rows=[make_row(overrides={"match": {"model": "old-model"}})])
    client = TestClient(app)

    response = client.patch(
        "/providers/ollama-local",
        json={"pipeline_overrides": {"cover_letter": {"temperature": 0.5}}},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["pipeline_overrides"] == {"cover_letter": {"temperature": 0.5}}
    assert db.rows[0].pipeline_overrides == {"cover_letter": {"temperature": 0.5}}


def test_update_provider_invalid_temperature_422() -> None:
    wire()
    client = TestClient(app)

    response = client.patch(
        "/providers/ollama-local",
        json={"pipeline_overrides": {"match": {"temperature": 5.0}}},
    )

    assert response.status_code == 422


def test_update_provider_unknown_pipeline_key_422() -> None:
    wire()
    client = TestClient(app)

    response = client.patch(
        "/providers/ollama-local",
        json={"pipeline_overrides": {"not_a_pipeline": {"model": "x"}}},
    )

    assert response.status_code == 422


def test_delete_provider_removes_row() -> None:
    db = wire()
    client = TestClient(app)

    response = client.delete("/providers/openrouter")

    assert response.status_code == 204
    assert [r.slug for r in db.rows] == ["ollama-local"]


def test_delete_provider_unknown_slug_404() -> None:
    wire()
    client = TestClient(app)

    response = client.delete("/providers/nope")

    assert response.status_code == 404


def test_delete_provider_active_409() -> None:
    db = wire()
    client = TestClient(app)

    response = client.delete("/providers/ollama-local")

    assert response.status_code == 409
    assert [r.slug for r in db.rows] == ["ollama-local", "openrouter"]


def test_delete_provider_race_with_activation_409() -> None:
    """A row activated between the active-check and the delete itself still 409s."""
    db = wire()

    class RaceyDb(FakeDb):
        async def get_provider(self, slug: str) -> ProviderRow | None:
            row = await super().get_provider(slug)
            if row is not None and row.slug == "openrouter":
                # Simulate a concurrent activation landing after the route's
                # own active-check but before the DELETE statement runs.
                self.rows = [
                    r.model_copy(update={"is_active": r.slug == "openrouter"}) for r in self.rows
                ]
            return row

    racey = RaceyDb(db.rows)
    app.state.db = racey
    client = TestClient(app)

    response = client.delete("/providers/openrouter")

    assert response.status_code == 409
    assert [r.slug for r in racey.rows if r.is_active] == ["openrouter"]
