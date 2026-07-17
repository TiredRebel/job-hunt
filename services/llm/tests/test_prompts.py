"""Tests for provider-aware cover-letter system prompt selection."""

from llm.pipelines.prompts import cover_letter_system


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
