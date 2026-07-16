# agent-browser-fallback

## ADDED Requirements

### Requirement: Subprocess fetcher behind a thin seam

The agent-browser fetcher SHALL invoke the `agent-browser` CLI as a
subprocess using a configurable command (`Settings.agent_browser_cmd`) to
open a URL and capture the rendered page content, with a hard timeout. Each
request SHALL pass the shared politeness gate first. The fetcher SHALL be
used only for sources whose `fetch_strategy` is `agent-browser` and MUST NOT
perform login automation, CAPTCHA solving, or bot-detection evasion of any
kind.

#### Scenario: Rendered content captured for a public page

- **WHEN** the CLI successfully renders a public, non-challenged page
- **THEN** the fetcher returns the captured content as the fetch result and
  the adapter parses it normally

### Requirement: Graceful degradation when the CLI is unavailable

A missing CLI, non-zero exit, timeout, or empty output SHALL raise a
dedicated unavailability error that the run treats as a skipped lead —
never a failed run. Run stats SHALL make the degradation visible, matching
the existing Upwork best-effort posture.

#### Scenario: CLI not installed

- **WHEN** the configured agent-browser command cannot be executed
- **THEN** affected leads are counted as skipped, the run completes (at
  worst `partial`), and the log names the missing command

#### Scenario: CLI hangs

- **WHEN** the subprocess exceeds its timeout
- **THEN** it is terminated, the lead is skipped, and the run continues
