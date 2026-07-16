# llm-admin-ui

## Purpose

The `/settings/llm` page: manage LLM providers — view provider cards, switch the active provider with confirmation, and test connections inline.

## Requirements

### Requirement: Provider cards

The `/settings/llm` page SHALL list LLM providers from `GET /v1/llm/providers` as cards showing name, model, kind (local/cloud), and health/latency indicator, with the active provider marked by a radio/active state.

#### Scenario: Viewing providers

- **WHEN** the user opens `/settings/llm`
- **THEN** all configured providers render as cards and exactly one is marked active

### Requirement: One-click active switch with confirm

Selecting a different provider SHALL require a single confirmation, then persist via `PUT /v1/llm/providers/active`. The UI SHALL reflect the switch immediately on success and roll back with an error toast on failure (the backend hot-switch needs no restart).

#### Scenario: Switching provider

- **WHEN** the user selects "ollama-cloud" and confirms
- **THEN** the active flag moves to that card and a toast confirms the switch

#### Scenario: Switch failure

- **WHEN** the activation request fails
- **THEN** the previous provider remains marked active and an error toast explains the failure

### Requirement: Connection test

Each provider card SHALL offer a "Test connection" action calling `POST /v1/llm/providers/test-connection`, showing an inline pending state and then the result (success with latency, or the error message) on the card itself — not only in a toast.

#### Scenario: Successful test

- **WHEN** the user tests the local Ollama provider and it responds
- **THEN** the card shows an inline success result with the measured latency

#### Scenario: Failed test

- **WHEN** the tested provider is unreachable
- **THEN** the card shows an inline, human-readable error and the active provider is unchanged
