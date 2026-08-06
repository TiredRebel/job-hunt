"""Calendar-date parsing shared by Ukrainian job-board adapters."""

from __future__ import annotations

import re
from datetime import UTC, datetime

UKRAINIAN_MONTHS: dict[str, int] = {
    "січня": 1,
    "лютого": 2,
    "березня": 3,
    "квітня": 4,
    "травня": 5,
    "червня": 6,
    "липня": 7,
    "серпня": 8,
    "вересня": 9,
    "жовтня": 10,
    "листопада": 11,
    "грудня": 12,
}

_UKRAINIAN_CALENDAR_DATE: re.Pattern[str] = re.compile(
    r"^(?:вакансія\s+від\s+)?"
    r"(?P<day>\d{1,2})\s+"
    r"(?P<month>[а-яіїєґ]+)\s+"
    r"(?P<year>\d{4})$",
    re.IGNORECASE,
)


def parse_ukrainian_calendar_date(value: str) -> datetime | None:
    """Parse a Ukrainian calendar date into UTC midnight.

    Both a bare DOU date (``5 серпня 2026``) and Work.ua's prefixed form
    (``Вакансія від 5 серпня 2026``) are accepted. The date is represented
    at UTC midnight so persistence can keep using a timestamp without losing
    its source-calendar meaning.

    Args:
        value: Visible source text containing a complete Ukrainian date.

    Returns:
        The parsed UTC timestamp, or ``None`` for an unknown or invalid date.
    """
    normalized = " ".join(value.replace("\u00a0", " ").split())
    match = _UKRAINIAN_CALENDAR_DATE.fullmatch(normalized)
    if match is None:
        return None
    month = UKRAINIAN_MONTHS.get(match.group("month").lower())
    if month is None:
        return None
    try:
        return datetime(
            int(match.group("year")),
            month,
            int(match.group("day")),
            tzinfo=UTC,
        )
    except ValueError:
        return None
