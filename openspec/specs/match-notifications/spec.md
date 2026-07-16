# match-notifications

## Purpose

Telegram push notifications for above-threshold job matches, driven by the automation API's unnotified-matches feed and notification ledger.

## Requirements

### Requirement: Telegram push for above-threshold matches

A notification workflow SHALL periodically fetch unnotified telegram-channel
matches from the gateway and send one Telegram message per match (title,
company, score, match-explanation excerpt, dashboard link) using n8n's
Telegram credentials. After a successful send it SHALL record the
notification via the gateway ledger.

#### Scenario: High-scoring match is pushed once

- **WHEN** a new match with score 85 (threshold 70) exists and the workflow
  fires twice in a row
- **THEN** exactly one Telegram message is sent and the second run finds no
  unnotified matches

#### Scenario: Below-threshold match is not pushed

- **WHEN** the highest new match scores 55 with threshold 70
- **THEN** no Telegram message is sent

### Requirement: Send failures do not mark matches notified

If the Telegram send fails, the workflow SHALL NOT record the notification,
leaving the match eligible for retry on the next run.

#### Scenario: Telegram API outage

- **WHEN** the Telegram send returns an error for a match
- **THEN** no ledger row is written and the next run retries that match
