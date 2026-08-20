import { Label, Switch } from 'web';

/** Both states — the whole axis for this control. */
export function States() {
  return (
    <div className="flex items-center gap-4">
      <Switch defaultChecked aria-label="On" />
      <Switch aria-label="Off" />
      <Switch disabled aria-label="Disabled" />
    </div>
  );
}

/** In situ: source enable toggles on the Sources page. */
export function SourceRows() {
  return (
    <div className="flex max-w-sm flex-col gap-3">
      {[
        { name: 'dou.ua', on: true },
        { name: 'djinni.co', on: true },
        { name: 'work.ua', on: false },
      ].map((s) => (
        <Label key={s.name} className="flex items-center justify-between gap-3">
          <span className="text-sm text-text-primary">{s.name}</span>
          <Switch defaultChecked={s.on} />
        </Label>
      ))}
    </div>
  );
}
