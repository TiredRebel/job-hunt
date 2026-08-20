import { Label, Textarea } from 'web';

/** The cover-letter editor — the app's only long-form input. */
export function CoverLetter() {
  return (
    <div className="flex max-w-md flex-col gap-1.5">
      <Label htmlFor="letter">Cover letter</Label>
      <Textarea
        id="letter"
        rows={6}
        defaultValue={
          'Hi — I saw your Senior QA Engineer opening and the backend automation focus lines up closely with the last three years of my work.\n\nMost recently I owned the Playwright suite for a payments platform, cutting flake from 12% to under 1%.'
        }
      />
    </div>
  );
}

/** Empty and disabled states. */
export function States() {
  return (
    <div className="flex max-w-md flex-col gap-2">
      <Textarea rows={3} placeholder="Notes on this role…" />
      <Textarea rows={2} defaultValue="Regenerating…" disabled />
    </div>
  );
}
