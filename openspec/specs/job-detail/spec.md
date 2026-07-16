# job-detail

## Purpose

Job detail view (drawer and full page): fixed-order sections for LLM summary, match explanation, original description, reaction timeline and cover letter, plus stage changes and cover-letter editing.

## Requirements

### Requirement: Job detail in drawer and full page

Job detail SHALL be available both as a right-side drawer (560px, triage flow from the table) and as a full page at `/jobs/[id]`, rendered by the same component. Sections in fixed order: header (title, company, external source link, score badge, stage select, posted/first-seen dates); LLM summary with tech-stack tag chips and red-flags list (warning tint); match explanation; sanitized original description (collapsible, prose styling); reaction timeline; cover letter. Primary actions (stage buttons, "Open original") SHALL be pinned in the drawer footer.

#### Scenario: Full detail render

- **WHEN** the user opens `/jobs/42`
- **THEN** all sections render in the fixed order with data from the job detail endpoint, and the source link opens the original posting in a new tab

#### Scenario: Missing LLM data degrades gracefully

- **WHEN** a job has no summary, match score or cover letter yet
- **THEN** the corresponding sections show localized "not processed yet" placeholders instead of empty or broken blocks

### Requirement: Stage change from detail

The user SHALL be able to change the job's reaction stage from the detail view (header select and footer buttons). A change SHALL create a reaction event via `POST /v1/reactions` and be reflected immediately in the stage badge and the timeline.

#### Scenario: Marking applied from the drawer

- **WHEN** the user clicks "Applied" in the drawer footer
- **THEN** a reaction event with stage `applied` is created, the stage badge updates, and the timeline shows the new event without a full reload

### Requirement: Reaction timeline

The detail view SHALL show the job's full reaction history from `GET /v1/reactions/{jobId}/timeline` as an event log ordered by time, with monospace timestamps formatted in the active locale.

#### Scenario: Timeline after several stage changes

- **WHEN** a job has been saved, then applied, then moved to interview
- **THEN** the timeline lists all three events in order with their timestamps and stage badges

### Requirement: Cover letter viewing and editing

For jobs with a cover-letter draft, the detail view SHALL display the letter and allow editing in a textarea with an explicit save that persists via the cover-letter endpoint without losing concurrent state (diff-safe: the save payload is the edited text, and the UI warns before discarding unsaved edits). Jobs without a draft SHALL show a placeholder explaining when drafts are generated.

#### Scenario: Editing a draft

- **WHEN** the user edits the cover letter text and clicks save
- **THEN** the edited letter is persisted, a confirmation toast appears, and reopening the job shows the edited version

#### Scenario: Unsaved edit protection

- **WHEN** the user edits the letter and attempts to close the drawer
- **THEN** the UI asks for confirmation before discarding the changes
