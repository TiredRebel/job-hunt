"""Prompt templates for the four pipelines.

Prompts embed only caller-supplied facts; the cover-letter prompt enforces
the grounding contract (no invented employers, dates, or technologies).
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

COVER_LETTER_SYSTEM = (
    "You draft short, specific cover letters. STRICT GROUNDING RULES: use ONLY facts from the "
    "JOB and PROFILE sections; never invent employers, projects, years of experience, or "
    "technologies; if a detail is unknown, omit it. List in grounded_on the exact facts you "
    "used. Tone: direct, no fluff, 120-180 words, Markdown body."
)


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
