# workflow-versioning

## ADDED Requirements

### Requirement: Workflows exported and versioned

All four n8n workflows (scrape-scheduler, processing-chain,
telegram-notifications, email-digest) SHALL be exported as separate JSON
files under `n8n/workflows/` and committed. Exports SHALL reference
credentials by name only — no tokens, passwords or chat ids in the JSON.

#### Scenario: Fresh n8n import

- **WHEN** the four JSON files are imported into a clean n8n instance and the
  named credentials (Telegram bot, SMTP) plus env values are configured
- **THEN** all workflows activate and run against local services without
  manual node edits

#### Scenario: No secrets in exports

- **WHEN** the exported JSON files are inspected
- **THEN** they contain credential references by name but no secret values

### Requirement: Import/runbook documentation

`n8n/README.md` SHALL document the import procedure, required credentials and
environment expressions, the base cadences, and the rule that any workflow
edit in the n8n UI must be re-exported to keep the repo canonical.

#### Scenario: Operator follows the runbook

- **WHEN** an operator sets up notifications on a new machine using only the
  README
- **THEN** they can import, credential and activate all workflows without
  reading workflow JSON internals
