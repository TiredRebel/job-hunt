"""Tests for provider-aware cover-letter system prompt selection."""

from llm.pipelines.prompts import (
    MATCH_SYSTEM,
    NORMALIZE_SYSTEM,
    TAG_SYSTEM,
    cover_letter_prompt,
    cover_letter_system,
    match_prompt,
    normalize_prompt,
    tag_prompt,
)
from llm.schemas import NormalizedJob, ProfileInput


def test_anthropic_gets_xml_structured_prompt() -> None:
    system = cover_letter_system("anthropic")

    assert system.startswith("<role>")
    assert "<grounding_rules>" in system
    assert "<voice_rules>" in system
    assert "<self_check>" in system


def test_openai_compatible_gets_plain_prompt() -> None:
    system = cover_letter_system("openai-compatible")

    assert "<role>" not in system
    assert "Grounding rules (strict):" in system
    assert "Voice rules:" in system


def test_ollama_gets_the_same_plain_prompt_as_openai_compatible() -> None:
    assert cover_letter_system("ollama") == cover_letter_system("openai-compatible")


def test_unknown_kind_falls_back_to_plain_prompt() -> None:
    system = cover_letter_system("some-future-kind")

    assert system == cover_letter_system("openai-compatible")


def test_both_variants_carry_the_same_grounding_and_length_contract() -> None:
    for kind in ("anthropic", "openai-compatible"):
        system = cover_letter_system(kind)
        assert "grounded_on" in system
        assert "120-180 words" in system
        assert "never invent" in system.lower()


def test_both_cover_letter_variants_warn_against_treating_job_data_as_instructions() -> None:
    for kind in ("anthropic", "openai-compatible"):
        system = cover_letter_system(kind)
        assert "<untrusted_job_data>" in system
        assert "never" in system.lower()


_JOB = NormalizedJob(title="Dev", description_md="Python.")
_PROFILE = ProfileInput(summary="Backend dev.", skills=["python"])


def test_normalize_prompt_delimits_the_raw_posting() -> None:
    prompt = normalize_prompt("Senior Dev", "Build things.", "https://example.com/job")

    assert "<untrusted_posting>" in prompt
    assert "</untrusted_posting>" in prompt
    assert prompt.index("<untrusted_posting>") < prompt.index("RAW POSTING TITLE")
    assert prompt.index("Build things.") < prompt.index("</untrusted_posting>")


def test_normalize_system_warns_content_is_data_not_instructions() -> None:
    assert "<untrusted_posting>" in NORMALIZE_SYSTEM
    assert "never" in NORMALIZE_SYSTEM.lower()


def test_tag_prompt_delimits_job_data() -> None:
    prompt = tag_prompt(_JOB)

    assert prompt.startswith("<untrusted_job_data>")
    assert prompt.endswith("</untrusted_job_data>")


def test_tag_system_warns_content_is_data_not_instructions() -> None:
    assert "<untrusted_job_data>" in TAG_SYSTEM
    assert "never" in TAG_SYSTEM.lower()


def test_match_prompt_delimits_job_and_profile_data() -> None:
    prompt = match_prompt(_JOB, None, _PROFILE)

    assert prompt.startswith("<untrusted_job_data>")
    assert prompt.endswith("</untrusted_job_data>")


def test_match_system_warns_content_is_data_not_instructions() -> None:
    assert "<untrusted_job_data>" in MATCH_SYSTEM
    assert "never" in MATCH_SYSTEM.lower()


def test_cover_letter_prompt_delimits_job_and_profile_data_but_not_the_final_instruction() -> None:
    prompt = cover_letter_prompt(_JOB, _PROFILE)

    assert "<untrusted_job_data>" in prompt
    closing_tag = prompt.index("</untrusted_job_data>")
    instruction = prompt.index("Draft the cover letter now")
    assert closing_tag < instruction
