"""Tests for structured logging + correlation-id propagation."""

import json
import logging

import pytest
from fastapi.testclient import TestClient

from scraper.main import app
from scraper.observability import (
    CORRELATION_ID_HEADER,
    configure_logging,
    get_correlation_id,
    set_correlation_id,
)


def test_incoming_correlation_id_is_echoed() -> None:
    client = TestClient(app)

    response = client.get("/health", headers={CORRELATION_ID_HEADER: "test-abc-123"})

    assert response.status_code == 200
    assert response.headers[CORRELATION_ID_HEADER] == "test-abc-123"


def test_missing_correlation_id_is_minted_and_echoed() -> None:
    client = TestClient(app)

    response = client.get("/health")

    assert response.status_code == 200
    minted = response.headers.get(CORRELATION_ID_HEADER)
    assert minted is not None and minted != ""


def test_malformed_correlation_id_is_rejected_and_a_fresh_one_is_minted() -> None:
    client = TestClient(app)
    malformed = "not a; safe=id"

    response = client.get("/health", headers={CORRELATION_ID_HEADER: malformed})

    assert response.status_code == 200
    minted = response.headers.get(CORRELATION_ID_HEADER)
    assert minted is not None and minted != malformed


def test_overlong_correlation_id_is_rejected_and_a_fresh_one_is_minted() -> None:
    client = TestClient(app)
    overlong = "a" * 200

    response = client.get("/health", headers={CORRELATION_ID_HEADER: overlong})

    assert response.status_code == 200
    minted = response.headers.get(CORRELATION_ID_HEADER)
    assert minted is not None and minted != overlong


def test_correlation_id_is_cleared_after_the_request() -> None:
    client = TestClient(app)

    client.get("/health", headers={CORRELATION_ID_HEADER: "test-xyz-789"})

    assert get_correlation_id() is None


def test_json_logging_includes_the_bound_correlation_id(
    capsys: pytest.CaptureFixture[str],
) -> None:
    configure_logging("info")
    set_correlation_id("test-log-marker")
    try:
        logging.getLogger("scraper.test_observability").info("marker log line for the test")
    finally:
        set_correlation_id(None)

    captured = capsys.readouterr()
    lines = [json.loads(line) for line in captured.out.strip().splitlines() if line]
    assert any(
        entry.get("message") == "marker log line for the test"
        and entry.get("correlation_id") == "test-log-marker"
        for entry in lines
    )


def test_json_logging_with_no_bound_id_has_null_correlation_id(
    capsys: pytest.CaptureFixture[str],
) -> None:
    configure_logging("info")

    logging.getLogger("scraper.test_observability").info("unbound marker log line")

    captured = capsys.readouterr()
    lines = [json.loads(line) for line in captured.out.strip().splitlines() if line]
    assert any(
        entry.get("message") == "unbound marker log line" and entry.get("correlation_id") is None
        for entry in lines
    )
