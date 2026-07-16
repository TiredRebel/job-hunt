"""Parser and behavior tests for all source adapters (fixtures, no network)."""

from __future__ import annotations

import json

from conftest import FakeFetcher, load_fixture

from scraper.adapters.dou import DouAdapter
from scraper.adapters.dou import parse_list as parse_dou
from scraper.adapters.jobua import parse_list as parse_jobua
from scraper.adapters.reddit import RedditAdapter, parse_listing
from scraper.adapters.upwork import UpworkAdapter, parse_feed
from scraper.adapters.workua import parse_list as parse_workua
from scraper.fetchers import FetchBlockedError
from scraper.models import JobLead, SearchQuery


def test_dou_parse_list() -> None:
    leads = parse_dou(load_fixture("dou/list.html"))

    assert [lead.external_id for lead in leads] == ["123456", "654321"]
    assert leads[0].title == "Senior Python Developer"
    assert leads[0].company == "Acme Corp"
    assert leads[1].company is None


def test_workua_parse_list_builds_absolute_urls() -> None:
    leads = parse_workua(load_fixture("workua/list.html"))

    assert [lead.external_id for lead in leads] == ["5511223", "6677889"]
    assert leads[0].url == "https://www.work.ua/jobs/5511223/"
    assert leads[0].company == "TechUA"


def test_jobua_parse_list() -> None:
    leads = parse_jobua(load_fixture("jobua/list.html"))

    assert [lead.external_id for lead in leads] == ["7788990", "4455667"]
    assert leads[1].url == "https://www.job.ua/vacancy/kyiv/it/4455667"
    assert leads[0].company == "Kyiv Soft"


async def test_dou_fetch_detail_fingerprints_content() -> None:
    detail_html = (
        "<html><body><div class='b-typo vacancy-section'>"
        "<p>Python, FastAPI,  PostgreSQL</p></div></body></html>"
    )
    fetcher = FakeFetcher(text=detail_html)
    adapter = DouAdapter({}, fetcher)
    lead = JobLead(external_id="1", url="https://jobs.dou.ua/x/vacancies/1/", title="t")

    posting = await adapter.fetch_detail(lead)

    assert posting is not None
    assert posting.raw_html == detail_html
    # Same content with different markup/whitespace → same fingerprint.
    other = "<div class='b-typo vacancy-section'>python, fastapi, postgresql</div>"
    other_fetcher = FakeFetcher(text=other)
    other_posting = await DouAdapter({}, other_fetcher).fetch_detail(lead)
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
