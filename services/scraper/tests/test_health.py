"""Tests for the scraper service health endpoint."""

from datetime import datetime

from fastapi.testclient import TestClient

from scraper.main import app


def test_health_returns_ok() -> None:
    client = TestClient(app)

    response = client.get("/health")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    datetime.fromisoformat(body["timestamp"])
