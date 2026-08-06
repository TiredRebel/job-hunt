## 1. Correct the server-side Posted ordering

- [x] 1.1 Update the allowlisted `posted` sort expression in `PostgresJobRepository` to use the same effective date as the table (`posted_at`, falling back to `first_seen_at`) without changing date-filter semantics or the API response shape.
- [x] 1.2 Retain and document the unique ID secondary ordering so equal effective dates produce a stable offset-pagination sequence in both sort directions.

## 2. Add regression coverage

- [x] 2.1 Add focused repository/query tests that assert `sortBy=posted` uses the effective display-date expression, while other sort modes retain their existing expressions.
- [x] 2.2 Add a mixed fixture case with an August 6 fallback-only job, an authentic August 5 job, and older authentic jobs; verify descending Posted order puts August 6 first.
- [x] 2.3 Verify consecutive `limit`/`offset` requests over mixed authentic and fallback dates have no reversed boundary, duplicate, or unstable tied rows.

## 3. Verify and record the change

- [x] 3.1 Run the API test suite and the relevant web jobs-table/pagination tests; manually verify `GET /v1/jobs?sortBy=posted&sortDir=desc` and the `/en/jobs` Posted sort through at least two pages.
- [x] 3.2 Update `PROGRESS.md` with the root cause, effective-date ordering rule, and verification result; run `graphify update .` after implementation.
