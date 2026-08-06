## 1. Injection guard module

- [x] 1.1 Create `services/llm/src/llm/pipelines/injection_guard.py` with a
      `find_injection_signals(text: str) -> list[str]` function and a
      module-level tuple of `(label, compiled_pattern)` pairs covering:
      instruction-override phrasing (`ignore/disregard/forget ...
  previous/prior/above instructions`), role reassignment (`you are now
  a/an/in ...`), prompt-exfiltration requests (`reveal/print/show/output
  your/the (system) prompt`), fake role-turn markers
      (`</?system|assistant|user>`), and the `new instructions:` /
      `do anything now` / `DAN mode` idioms — each pattern anchored to an
      imperative verb+object, never a bare noun (see design.md D1).
- [x] 1.2 Add `PromptInjectionDetectedError(LlmError)` to
      `services/llm/src/llm/errors.py`, carrying the matched signal
      label(s) in its message.

## 2. Wire the guard into the shared execution path

- [x] 2.1 In `services/llm/src/llm/pipelines/engine.py::run_structured()`,
      scan `prompt` once before the retry loop; on a match, record the
      attempt via `record()` with `status="failed"` and
      `error="prompt_injection_blocked:<signal>"` (design.md D3/D4 order:
      record before raise), then raise `PromptInjectionDetectedError`.
- [x] 2.2 Confirm (via existing/new unit test) that a blocked call never
      reaches `resolved.provider.complete_structured(...)` — zero provider
      calls made.

## 3. Route-level error mapping

- [x] 3.1 In `services/llm/src/llm/routes.py`, add
      `except PromptInjectionDetectedError as exc: raise
  HTTPException(status_code=422, detail=str(exc)) from exc` to
      `/process/job`, ordered before its existing `except LlmError` clause.
- [x] 3.2 Apply the same clause, in the same order, to `/match`.
- [x] 3.3 Apply the same clause, in the same order, to `/cover-letter`.

## 4. Prompt hardening (structural isolation)

- [x] 4.1 In `services/llm/src/llm/pipelines/prompts.py::normalize_prompt`,
      wrap the raw title/body in an `<untrusted_posting>...
  </untrusted_posting>` block; add one sentence to `NORMALIZE_SYSTEM`
      stating that delimited content is data to extract from, never
      instructions to follow.
- [x] 4.2 Apply the same delimiter (`<untrusted_job_data>...
  </untrusted_job_data>`) around the embedded JSON in `tag_prompt`,
      `match_prompt`, and `cover_letter_prompt`; add the equivalent
      sentence to `TAG_SYSTEM`, `MATCH_SYSTEM`, and both
      `_COVER_LETTER_SYSTEM_GPT` / `_COVER_LETTER_SYSTEM_CLAUDE` variants
      (matching each variant's existing plain-prose vs. XML-tag style).

## 5. Tests

- [x] 5.1 Create `services/llm/tests/test_injection_guard.py`: one test per
      pattern label asserting it fires on a representative attack string,
      plus a **negative fixture** — a realistic AI/ML engineer job posting
      (mentions "prompt engineering," "system prompt," "LLM jailbreak
      red-teaming" descriptively) that must NOT be flagged.
- [x] 5.2 Extend `services/llm/tests/test_engine.py` with a test mirroring
      `test_transport_error_fails_fast`: a poisoned prompt raises
      `PromptInjectionDetectedError`, the fake provider's `.calls` stays
      empty, and the recorded run has `status="failed"` with the
      `prompt_injection_blocked:` prefix in `error`.
- [x] 5.3 Extend `services/llm/tests/test_prompts.py` to assert the new
      delimiters and system-prompt sentences are present in the output of
      all four prompt builders.
- [x] 5.4 Extend `services/llm/tests/test_api.py` with one test per route
      (`/process/job`, `/match`, `/cover-letter`) asserting a poisoned
      payload returns 422 with a body identifying it as a blocked
      injection attempt.

## 6. Docs

- [x] 6.1 Add a "Prompt-injection guardrail" section to
      `docs/LLM_CONFIG.md` (near "Structured output discipline") covering:
      what's detected, that detection runs once per call in
      `run_structured()`, the 422 response, and the `ponytail:` upgrade
      note from design.md D3.

## 7. Verification

- [x] 7.1 Run `services/llm`'s test suite
      (`pytest services/llm/tests -q` or the project's configured runner)
      and confirm all new and existing tests pass.
- [x] 7.2 Manually exercise `POST /process/job` with a poisoned
      title/body against a local run and confirm a 422 with no
      provider call in the logs, per design.md's Migration Plan (no other
      service needs touching to observe correct end-to-end denial).
