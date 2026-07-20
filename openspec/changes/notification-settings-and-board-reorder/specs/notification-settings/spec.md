# notification-settings

## ADDED Requirements

### Requirement: Notification configuration is persisted and editable

The system SHALL persist notification channel configuration in the database
and expose it for reading and editing through the gateway. The stored
configuration SHALL cover, per channel: an enabled flag; for Telegram, the
destination chat id; for email, the SMTP host, port, username, sender
address and recipient address. The gateway SHALL expose
`GET /v1/settings/notifications` returning the effective configuration and
`PATCH /v1/settings/notifications` applying a partial update, both
documented in the OpenAPI spec and included in the regenerated
`packages/shared-ts` client. A partial update SHALL leave omitted fields
unchanged.

#### Scenario: Reading configuration

- **WHEN** `GET /v1/settings/notifications` is called
- **THEN** the response contains both channels with their enabled flags and
  non-secret connection fields

#### Scenario: Updating one field leaves others intact

- **WHEN** `PATCH /v1/settings/notifications` is called with only the
  Telegram chat id
- **THEN** the chat id is persisted and every other stored field, including
  the email channel, retains its previous value

#### Scenario: Invalid port rejected

- **WHEN** a PATCH sets the SMTP port to a value outside 1–65535
- **THEN** the gateway responds 400 and no value is persisted

### Requirement: Secrets are referenced by environment variable, never stored

The configuration SHALL store the **name** of the environment variable
holding each secret — the Telegram bot token and the SMTP password — and
SHALL NOT store the secret value itself. No API response SHALL contain a
secret value. For each secret the gateway SHALL report a boolean indicating
whether the named environment variable is currently populated, so a client
can distinguish "not configured" from "configured", without transporting the
value.

#### Scenario: Response carries presence, not value

- **WHEN** `GET /v1/settings/notifications` is called while the environment
  variable named by the Telegram configuration holds a real token
- **THEN** the response reports that the token is configured and contains no
  field anywhere holding the token's value

#### Scenario: Missing environment variable is visible

- **WHEN** the environment variable named by the email configuration is
  unset or empty
- **THEN** the response reports the SMTP password as not configured

#### Scenario: Only the variable name is writable

- **WHEN** a client PATCHes the name of the environment variable to use
- **THEN** the name is persisted and the secret's value remains sourced
  exclusively from the environment

### Requirement: Matching and digest scalars are editable through the same surface

The match threshold and digest hour that automation already depends on
SHALL be readable and writable through the same settings endpoints, so a
single client form covers all notification-affecting configuration. Their
existing storage location SHALL remain the source of truth for the
automation queries that already read them.

#### Scenario: Threshold change takes effect

- **WHEN** the match threshold is changed through
  `PATCH /v1/settings/notifications`
- **THEN** the unnotified-matches feed subsequently filters against the new
  threshold

#### Scenario: Threshold bounds enforced

- **WHEN** a PATCH sets the match threshold outside 0–100
- **THEN** the gateway responds 400 and the stored value is unchanged
