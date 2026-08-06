## Why

The Jobs table can display an Aug 6 fallback date for a job whose source publication date is unavailable, while the API sorts that same row as a null `posted_at` value after jobs with authentic July dates. The visible order is therefore misleading and can appear to change unexpectedly between pagination pages.

## What Changes

- Make the Jobs table's `posted` sort use the same effective date shown in its Posted column: authentic `postedAt` when available, otherwise display-only `firstSeenAt`.
- Keep the ordered result deterministic across offset-based pages with a stable secondary key.
- Preserve `postedAt` as nullable authoritative source data; the fallback is used only to order the user-selected Posted view.
- Add API/repository and web regression coverage for mixed authentic and fallback dates, including adjacent paginated pages.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `jobs-dashboard`: Posted-column ordering and paginated ordering must match the dates rendered to the user.

## Impact

- `apps/api/src/infrastructure/repositories/postgres-job.repository.ts`: allowlisted Posted sort expression and ordering tests.
- `apps/api/src/jobs` and `apps/web/src/components/jobs`: list/pagination regression coverage as appropriate.
- No database schema, scraper parser, stored data, or public endpoint shape changes.
