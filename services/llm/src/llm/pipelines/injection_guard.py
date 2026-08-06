"""Heuristic prompt-injection detection for composed pipeline prompts.

Patterns are anchored to imperative verb+object phrasing ("ignore previous
instructions"), never bare nouns ("prompt", "jailbreak", "system") — this
project is a tech-job aggregator, and a real AI/ML job posting will
legitimately use those words as ordinary vocabulary (see
design.md D1 in openspec/changes/llm-prompt-injection-guardrails). A
heuristic pass has an irreducible false-negative rate against novel
phrasing; see prompts.py for the complementary structural mitigation
(delimiting untrusted content and telling the model not to obey it).

ponytail: regex heuristics only, no ML/LLM classifier. Upgrade path: add a
dedicated injection-detection model or a maintained ruleset if false
negatives prove costly in practice.
"""

import re

#: (label, compiled pattern) pairs. Label becomes part of the recorded
#: ``pipeline_runs.error`` and the raised error's message, so keep it
#: short and stable (used for `grep`/query, not prose).
_PATTERNS: tuple[tuple[str, re.Pattern[str]], ...] = (
    (
        "ignore_instructions",
        re.compile(
            r"\b(?:ignore|disregard|forget)\s+(?:all\s+|any\s+|the\s+|everything\s+)?"
            r"(?:previous|prior|above|preceding|earlier)\s+"
            r"(?:instructions?|prompts?|context|directions?)\b",
            re.IGNORECASE,
        ),
    ),
    (
        "role_override",
        re.compile(r"\byou\s+are\s+now\s+(?:a|an|in)\b", re.IGNORECASE),
    ),
    (
        "reveal_prompt",
        re.compile(
            r"\b(?:reveal|print|show|output)\s+(?:your|the)\s+(?:system\s+)?prompt\b",
            re.IGNORECASE,
        ),
    ),
    (
        # Closing form only. An opening `<user>`/`<system>` bare tag is
        # indistinguishable from ordinary placeholder syntax in backend/DevOps
        # postings ("ssh <user>@<host>", "GRANT ... TO <user>", a Docker env
        # var placeholder) — matching it dead-letters real postings. The
        # closing tag is also the sharper signal: it's what lets injected
        # text claim to escape the current turn.
        "fake_role_tag",
        re.compile(r"</\s*(?:system|assistant|user)\s*>", re.IGNORECASE),
    ),
    (
        "new_instructions_override",
        re.compile(r"\bnew\s+instructions\s*:", re.IGNORECASE),
    ),
    (
        "dan_jailbreak",
        re.compile(r"\bdo\s+anything\s+now\b|\bDAN\s+mode\b", re.IGNORECASE),
    ),
)


def find_injection_signals(text: str) -> list[str]:
    """Return the labels of every injection pattern matched in ``text``.

    Empty list means the text is clean. Order follows ``_PATTERNS``.
    """
    return [label for label, pattern in _PATTERNS if pattern.search(text)]
