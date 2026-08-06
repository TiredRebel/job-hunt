"""Parser and behavior tests for all source adapters (fixtures, no network)."""

from __future__ import annotations

import json
from datetime import UTC, datetime

import pytest
from conftest import FakeFetcher, load_fixture

from scraper.adapters._dates import parse_ukrainian_calendar_date
from scraper.adapters._html import StaticHtmlAdapter, StaticSourceDefinition
from scraper.adapters.dou import DOU_SOURCE
from scraper.adapters.dou import parse_list as parse_dou
from scraper.adapters.jobua import JOBUA_SOURCE
from scraper.adapters.jobua import parse_list as parse_jobua
from scraper.adapters.reddit import RedditAdapter, parse_listing
from scraper.adapters.upwork import UpworkAdapter, parse_feed
from scraper.adapters.workua import WORKUA_SOURCE
from scraper.adapters.workua import parse_list as parse_workua
from scraper.fetchers import FetchBlockedError
from scraper.models import JobLead, SearchQuery


def test_dou_parse_list() -> None:
    leads = parse_dou(load_fixture("dou/list.html"))

    assert [lead.external_id for lead in leads] == ["123456", "654321"]
    assert leads[0].title == "Senior Python Developer"
    assert leads[0].company == "Acme Corp"
    assert leads[0].posted_at is not None
    assert leads[0].posted_at.month == 7
    assert leads[0].posted_at.day == 15
    assert leads[1].company is None


def test_workua_parse_list_builds_absolute_urls() -> None:
    leads = parse_workua(load_fixture("workua/list.html"))

    assert [lead.external_id for lead in leads] == ["5511223", "6677889"]
    assert leads[0].url == "https://www.work.ua/jobs/5511223/"
    assert leads[0].company == "TechUA"


@pytest.mark.parametrize(
    ("month_name", "month"),
    [
        ("січня", 1),
        ("лютого", 2),
        ("березня", 3),
        ("квітня", 4),
        ("травня", 5),
        ("червня", 6),
        ("липня", 7),
        ("серпня", 8),
        ("вересня", 9),
        ("жовтня", 10),
        ("листопада", 11),
        ("грудня", 12),
    ],
)
def test_parse_ukrainian_calendar_date_supports_every_month(
    month_name: str,
    month: int,
) -> None:
    assert parse_ukrainian_calendar_date(f"5 {month_name} 2026") == datetime(
        2026, month, 5, tzinfo=UTC
    )


def test_parse_ukrainian_calendar_date_normalizes_prefix_case_and_whitespace() -> None:
    value = "  ВАКАНСІЯ\u00a0ВІД   7 ЛИПНЯ 2026  "

    assert parse_ukrainian_calendar_date(value) == datetime(2026, 7, 7, tzinfo=UTC)


@pytest.mark.parametrize("value", ["", "31 лютого 2026", "29 лютого 2025", "today"])
def test_parse_ukrainian_calendar_date_rejects_invalid_values(value: str) -> None:
    assert parse_ukrainian_calendar_date(value) is None


def test_parse_ukrainian_calendar_date_accepts_valid_leap_day() -> None:
    assert parse_ukrainian_calendar_date("29 лютого 2024") == datetime(2024, 2, 29, tzinfo=UTC)


def test_jobua_parse_list() -> None:
    leads = parse_jobua(load_fixture("jobua/list.html"))

    assert [lead.external_id for lead in leads] == ["7788990", "4455667"]
    assert leads[1].url == "https://www.job.ua/vacancy/kyiv/it/4455667"
    assert leads[0].company == "Kyiv Soft"


@pytest.mark.parametrize(
    ("source", "search_parameter", "default_url"),
    [
        (DOU_SOURCE, "search", "https://jobs.dou.ua/vacancies/"),
        (WORKUA_SOURCE, "search", "https://www.work.ua/jobs/"),
        (JOBUA_SOURCE, "q", "https://www.job.ua/vacancy/"),
    ],
)
async def test_static_adapters_preserve_search_and_probe_urls(
    source: StaticSourceDefinition,
    search_parameter: str,
    default_url: str,
) -> None:
    """Pin source query keys, configurable list URLs, and probe requests."""
    configured_url = f"{default_url}?from=test"
    fetcher = FakeFetcher(text="<html><body>no cards</body></html>")
    adapter = StaticHtmlAdapter(source, {"list_url": configured_url}, fetcher)

    _ = [lead async for lead in adapter.discover(SearchQuery(term="python"))]
    probe = await adapter.probe()

    assert fetcher.calls == [
        (configured_url, {search_parameter: "python"}),
        (configured_url, None),
    ]
    assert probe.url == configured_url


@pytest.mark.parametrize(
    ("source", "detail_html", "other_html", "detail_url"),
    [
        (
            DOU_SOURCE,
            "<div class='b-typo vacancy-section'><p>Python, FastAPI,  PostgreSQL</p></div>",
            "<div class='b-typo vacancy-section'>python, fastapi, postgresql</div>",
            "https://jobs.dou.ua/x/vacancies/1/",
        ),
        (
            WORKUA_SOURCE,
            "<main id='job-description'><p>Python, FastAPI,  PostgreSQL</p></main>",
            "<div id='job-description'>python, fastapi, postgresql</div>",
            "https://www.work.ua/jobs/1/",
        ),
        (
            JOBUA_SOURCE,
            "<div class='vacancy-description'><p>Python, FastAPI,  PostgreSQL</p></div>",
            "<section class='vacancy-description'>python, fastapi, postgresql</section>",
            "https://www.job.ua/vacancy/1",
        ),
    ],
)
async def test_static_adapters_extract_details_and_stable_fingerprints(
    source: StaticSourceDefinition,
    detail_html: str,
    other_html: str,
    detail_url: str,
) -> None:
    """Pin extracted detail text, detail URLs, and cosmetic-change hashes."""
    await _assert_detail_extraction_and_fingerprint(
        source,
        detail_html,
        other_html,
        detail_url,
    )


async def test_dou_detail_date_overrides_listing_inference() -> None:
    lead = JobLead(
        external_id="1",
        url="https://jobs.dou.ua/companies/acme/vacancies/1/",
        title="t",
        posted_at=datetime(2025, 8, 5, tzinfo=UTC),
    )
    fetcher = FakeFetcher(text=load_fixture("dou/detail.html"))

    posting = await StaticHtmlAdapter(DOU_SOURCE, {}, fetcher).fetch_detail(lead)

    assert posting is not None
    assert posting.lead.posted_at == datetime(2026, 8, 5, tzinfo=UTC)
    assert posting.lead.posted_at_is_authoritative is True


async def test_dou_invalid_detail_date_preserves_listing_date() -> None:
    listed_at = datetime(2026, 8, 5, tzinfo=UTC)
    lead = JobLead(external_id="1", url="https://dou.example/1", title="t", posted_at=listed_at)
    html = "<div class='l-vacancy'><div class='date'>today</div></div>"

    posting = await StaticHtmlAdapter(DOU_SOURCE, {}, FakeFetcher(text=html)).fetch_detail(lead)

    assert posting is not None
    assert posting.lead.posted_at == listed_at


async def test_workua_detail_prefers_datetime_attribute() -> None:
    lead = JobLead(external_id="1", url="https://www.work.ua/jobs/1/", title="t")
    html = """
    <time datetime="2026-08-03 17:06:31">Вакансія від 7 липня 2026</time>
    <div id="job-description">Python</div>
    """

    posting = await StaticHtmlAdapter(WORKUA_SOURCE, {}, FakeFetcher(text=html)).fetch_detail(lead)

    assert posting is not None
    assert posting.lead.posted_at == datetime(2026, 8, 3, tzinfo=UTC)
    assert posting.lead.posted_at_is_authoritative is True


async def test_workua_recorded_detail_date() -> None:
    lead = JobLead(external_id="8373417", url="https://www.work.ua/jobs/8373417/", title="t")

    posting = await StaticHtmlAdapter(
        WORKUA_SOURCE, {}, FakeFetcher(text=load_fixture("workua/detail.html"))
    ).fetch_detail(lead)

    assert posting is not None
    assert posting.lead.posted_at == datetime(2026, 8, 3, tzinfo=UTC)


async def test_workua_uses_single_datetime_when_visible_label_changes() -> None:
    lead = JobLead(external_id="1", url="https://www.work.ua/jobs/1/", title="t")
    html = """
    <time datetime="2026-08-03 17:06:31">Published recently</time>
    <div id="job-description">Python</div>
    """

    posting = await StaticHtmlAdapter(WORKUA_SOURCE, {}, FakeFetcher(text=html)).fetch_detail(lead)

    assert posting is not None
    assert posting.lead.posted_at == datetime(2026, 8, 3, tzinfo=UTC)


async def test_workua_detail_falls_back_to_visible_date() -> None:
    lead = JobLead(external_id="1", url="https://www.work.ua/jobs/1/", title="t")
    html = """
    <time datetime="not-a-date">Вакансія від&nbsp;7 липня 2026</time>
    <div id="job-description">Python</div>
    """

    posting = await StaticHtmlAdapter(WORKUA_SOURCE, {}, FakeFetcher(text=html)).fetch_detail(lead)

    assert posting is not None
    assert posting.lead.posted_at == datetime(2026, 7, 7, tzinfo=UTC)


async def _assert_detail_extraction_and_fingerprint(
    source: StaticSourceDefinition,
    detail_html: str,
    other_html: str,
    detail_url: str,
) -> None:
    """Assert shared detail behavior for one static source definition."""
    lead = JobLead(external_id="1", url=detail_url, title="t")
    fetcher = FakeFetcher(text=detail_html)
    posting = await StaticHtmlAdapter(source, {}, fetcher).fetch_detail(lead)

    assert posting is not None
    assert fetcher.calls == [(detail_url, None)]
    assert posting.raw_html == "Python, FastAPI,  PostgreSQL"

    other_fetcher = FakeFetcher(text=other_html)
    other_posting = await StaticHtmlAdapter(source, {}, other_fetcher).fetch_detail(lead)

    assert other_posting is not None
    assert posting.content_hash == other_posting.content_hash


def test_reddit_parse_listing_skips_malformed() -> None:
    payload = json.loads(load_fixture("reddit/listing.json"))

    posts = parse_listing(payload)

    assert len(posts) == 4  # the "more" child is dropped, empty data kept
    assert posts[0]["name"] == "t3_abc123"


async def test_reddit_discover_filters_by_flair_and_term() -> None:
    fetcher = FakeFetcher(text=load_fixture("reddit/listing.json"))
    adapter = RedditAdapter({"subreddits": ["forhire"]}, fetcher)

    leads = [lead async for lead in adapter.discover(SearchQuery(term="python"))]

    assert [lead.external_id for lead in leads] == ["t3_abc123"]
    assert leads[0].url.startswith("https://www.reddit.com/r/forhire/")
    assert leads[0].posted_at is not None
    # Listing is cached: a second query must not refetch.
    _ = [lead async for lead in adapter.discover(SearchQuery(term="rust"))]
    assert len(fetcher.calls) == 1


async def test_reddit_fetch_detail_uses_cached_post() -> None:
    fetcher = FakeFetcher(text=load_fixture("reddit/listing.json"))
    adapter = RedditAdapter({}, fetcher)
    leads = [lead async for lead in adapter.discover(SearchQuery(term="python"))]

    posting = await adapter.fetch_detail(leads[0])

    assert posting is not None
    assert "FastAPI" in posting.raw_html
    assert len(fetcher.calls) == 1  # no extra network round-trip


def test_upwork_parse_feed() -> None:
    items = parse_feed(load_fixture("upwork/feed.xml"))

    assert len(items) == 2
    assert items[0]["guid"] == "https://www.upwork.com/jobs/~0abc123"
    assert items[0]["pub_date"] is not None
    assert items[1]["pub_date"] is None  # malformed date degrades to None


def test_upwork_parse_feed_rejects_html_challenge() -> None:
    assert parse_feed("<html><body>Just a moment...</body></html>") == []


async def test_upwork_discover_and_detail() -> None:
    fetcher = FakeFetcher(text=load_fixture("upwork/feed.xml"))
    adapter = UpworkAdapter({}, fetcher)

    leads = [lead async for lead in adapter.discover(SearchQuery(term="python"))]
    posting = await adapter.fetch_detail(leads[0])

    assert [lead.title for lead in leads] == ["Python scraper needed", "FastAPI microservice"]
    assert posting is not None
    assert "polite python scraper" in posting.raw_html


async def test_upwork_degrades_gracefully_when_blocked() -> None:
    fetcher = FakeFetcher(error=FetchBlockedError("HTTP 403"))
    adapter = UpworkAdapter({}, fetcher)

    first = [lead async for lead in adapter.discover(SearchQuery(term="python"))]
    second = [lead async for lead in adapter.discover(SearchQuery(term="react"))]

    assert first == [] and second == []
    assert len(fetcher.calls) == 1  # blocked flag prevents hammering the host
