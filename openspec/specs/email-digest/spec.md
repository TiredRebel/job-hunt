# email-digest

## Purpose

Daily email digest workflow summarizing new jobs and matches since the last run, driven by the automation API's digest feed and watermark.

## Requirements

### Requirement: Daily digest email

A digest workflow SHALL run once per day, fetch new jobs and matches since the
last digest from `GET /v1/automation/digest`, format them into a single email
(counts, top matches by score with links, new-jobs summary per source) and
send it via SMTP to `DIGEST_TO_EMAIL`. After a successful send it SHALL
advance the digest watermark via `POST /v1/automation/digest/sent`. The email
SHALL record each digested match in the notification ledger with channel
`email` where applicable.

#### Scenario: Daily digest with new activity

- **WHEN** 12 new jobs and 3 new matches appeared since the last digest
- **THEN** one email is sent summarizing them and the watermark advances so
  the next digest only covers newer activity

#### Scenario: Nothing new

- **WHEN** no new jobs or matches appeared since the last digest
- **THEN** either no email is sent or an explicit "no new activity" email is
  sent (single behavior chosen at implementation), and the watermark still
  advances

### Requirement: Failed send preserves the watermark

If the SMTP send fails, the watermark SHALL NOT advance, so the next run
re-covers the same window.

#### Scenario: SMTP outage

- **WHEN** the send fails
- **THEN** `app_settings.last_digest_at` is unchanged and the next run
  includes the same jobs
