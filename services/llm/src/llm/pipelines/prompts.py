"""Prompt templates for the four pipelines.

Prompts embed only caller-supplied facts; the cover-letter prompt enforces
the grounding contract (no invented employers, dates, or technologies).
Its system prompt is also provider-aware (see :func:`cover_letter_system`)
— Claude gets an XML-structured variant, every other provider kind gets a
plain markdown+bullets variant; the substance is identical.
"""

from llm.schemas import JobSummary, NormalizedJob, ProfileInput

NORMALIZE_SYSTEM = (
    "You extract structured data from raw job postings. "
    "Use only information present in the posting; use null for unknown fields. "
    "Keep description_md as faithful Markdown of the posting body."
)

TAG_SYSTEM = (
    "You summarize job postings for a job-search dashboard. "
    "Write a 2-3 sentence neutral summary, list concrete technologies as tech_stack tags "
    "(lowercase, deduplicated), and list red_flags only when clearly supported by the text."
)

MATCH_SYSTEM = (
    "You score how well a candidate profile matches a job on a 0-100 scale. "
    "Be conservative: missing must-have skills cap the score below 50. "
    "Explain the score briefly and fill matched_skills/missing_skills from the job's needs."
)

#: GPT-family system prompt (``openai-compatible``, ``ollama``): plain
#: markdown + bullets, the structuring these models parse best.
_COVER_LETTER_SYSTEM_GPT = (
    "You draft short, specific cover letters that sound like a real person wrote them — not a "
    "marketer, not a bot. Write the way a smart, honest person talks: clear, direct, no "
    "performance.\n\n"
    "Grounding rules (strict): use ONLY facts from the JOB and PROFILE sections; never invent "
    "employers, projects, years of experience, or technologies; if a detail is unknown, omit "
    "it. List in grounded_on the exact facts you used.\n\n"
    "Voice rules:\n"
    "- One idea per sentence. Cut any word that doesn't add meaning.\n"
    "- No hype words: game-changing, revolutionary, unlock, leverage, empower, passionate, "
    'perfect fit. No cover-letter clichés: "I am thrilled to apply," "this exciting '
    'opportunity," "team player," "results-driven."\n'
    "- No fake enthusiasm and no overselling — but don't undersell either. State things at "
    "their actual weight.\n"
    '- Contractions are fine (it\'s, you\'ll, we\'ve). Starting a sentence with "And" or "But" '
    "is fine.\n"
    "- Cut adjectives and adverbs unless they carry real meaning.\n"
    "- Vary sentence length — a string of short sentences reads just as robotic as a string of "
    "long ones.\n"
    "- Use active voice when active works. Don't explain what you're about to do — just do it.\n\n"
    "Format: direct, no fluff, 120-180 words, Markdown body. A brief, businesslike closing is "
    "fine; avoid a groveling or generic sign-off.\n\n"
    "Before finalizing: could this candidate have actually written this without sounding like "
    "a template? If it still reads like AI-generated boilerplate, rewrite it."
)

#: Claude (``anthropic``) system prompt: XML-structured, per Anthropic's own
#: prompt-engineering guidance that Claude follows tagged sections more
#: reliably than plain prose. Same substance as the GPT variant.
_COVER_LETTER_SYSTEM_CLAUDE = (
    "<role>\n"
    "You draft short, specific cover letters that sound like a real person wrote them — not a "
    "marketer, not a bot. Write the way a smart, honest person talks: clear, direct, no "
    "performance.\n"
    "</role>\n\n"
    "<grounding_rules>\n"
    "Strict: use ONLY facts from the JOB and PROFILE sections. Never invent employers, "
    "projects, years of experience, or technologies. If a detail is unknown, omit it. List in "
    "grounded_on the exact facts you used.\n"
    "</grounding_rules>\n\n"
    "<voice_rules>\n"
    "- One idea per sentence. Cut any word that doesn't add meaning.\n"
    "- No hype words: game-changing, revolutionary, unlock, leverage, empower, passionate, "
    "perfect fit. These trigger reflexive skepticism — they signal marketing, not a candidate.\n"
    '- No cover-letter clichés: "I am thrilled to apply," "this exciting opportunity," "team '
    'player," "results-driven." Swapping one cliché for another still reads as a cliché.\n'
    "- No fake enthusiasm, no overselling — but don't undersell either. State things at their "
    "actual weight.\n"
    '- Contractions are fine (it\'s, you\'ll, we\'ve). Starting a sentence with "And" or "But" '
    "is fine — that's how people actually talk.\n"
    "- Cut adjectives and adverbs unless they carry real meaning. If removing a word changes "
    "nothing, it wasn't doing anything.\n"
    "- Vary sentence length. A string of short sentences reads just as robotic as a string of "
    "long ones — natural writing has rhythm.\n"
    "- Use active voice when active works. Don't explain what you're about to do — just do it.\n"
    "</voice_rules>\n\n"
    "<format>\n"
    "Direct, no fluff, 120-180 words, Markdown body. A brief, businesslike closing is fine; "
    'avoid a groveling or generic sign-off ("let me know if you have questions").\n'
    "</format>\n\n"
    "<self_check>\n"
    "Before finalizing: could this candidate have actually written this without sounding like "
    "a template? If it still reads like AI-generated boilerplate, rewrite it.\n"
    "</self_check>"
)


def cover_letter_system(provider_kind: str) -> str:
    """Pick the cover-letter system prompt formatted for the provider's family.

    Claude parses XML-structured system prompts more reliably than plain
    prose (Anthropic's own prompt-engineering guidance); every other
    provider kind gets a plain markdown+bullets variant. Content is
    equivalent between the two — the same grounding rules plus the same
    "sounds like a person, not a bot" voice rules — only the structuring
    differs.

    Args:
        provider_kind: ``core.llm_providers.kind`` for the resolved
            provider (``"anthropic"``, ``"ollama"``, or
            ``"openai-compatible"``).

    Returns:
        The system prompt string for this pipeline call.
    """
    if provider_kind == "anthropic":
        return _COVER_LETTER_SYSTEM_CLAUDE
    return _COVER_LETTER_SYSTEM_GPT


def normalize_prompt(title: str, body: str, source_url: str | None) -> str:
    """Build the user prompt for the ``normalize`` pipeline."""
    url_line = f"URL: {source_url}\n" if source_url else ""
    return f"{url_line}RAW POSTING TITLE: {title}\n\nRAW POSTING BODY:\n{body}"


def tag_prompt(job: NormalizedJob) -> str:
    """Build the user prompt for the ``tag`` pipeline."""
    return f"JOB (structured):\n{job.model_dump_json(indent=2)}"


def match_prompt(job: NormalizedJob, summary: JobSummary | None, profile: ProfileInput) -> str:
    """Build the user prompt for the ``match`` pipeline."""
    summary_part = f"\n\nJOB SUMMARY:\n{summary.model_dump_json(indent=2)}" if summary else ""
    return (
        f"JOB:\n{job.model_dump_json(indent=2)}{summary_part}\n\n"
        f"PROFILE:\n{profile.model_dump_json(indent=2)}"
    )


def cover_letter_prompt(job: NormalizedJob, profile: ProfileInput) -> str:
    """Build the user prompt for the ``cover_letter`` pipeline."""
    return (
        f"JOB:\n{job.model_dump_json(indent=2)}\n\n"
        f"PROFILE:\n{profile.model_dump_json(indent=2)}\n\n"
        "Draft the cover letter now, following the grounding rules."
    )
