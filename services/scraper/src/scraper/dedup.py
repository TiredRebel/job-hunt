"""Content fingerprinting for cross-run and cross-source dedup.

The fingerprint feeds ``scraper.jobs_raw.content_hash`` which participates in
the ``UNIQUE (source_id, external_id, content_hash)`` constraint: re-fetching
an unchanged vacancy is a no-op, while an edited posting produces a new row.
"""

from __future__ import annotations

import hashlib
import re

_WHITESPACE = re.compile(r"\s+")


def content_fingerprint(text: str) -> str:
    """Compute a stable fingerprint of a vacancy's meaningful text.

    Whitespace runs are collapsed and the text lowercased so that cosmetic
    markup or spacing changes do not produce spurious "new" versions.

    Args:
        text: Extracted vacancy text (or raw payload as a fallback).

    Returns:
        Hex-encoded SHA-256 digest.
    """
    normalized = _WHITESPACE.sub(" ", text).strip().lower()
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()
