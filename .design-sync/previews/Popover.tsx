import { Button, Label, Popover, PopoverContent, PopoverTrigger, Switch } from 'web';

/** The filter bar's "more filters" popover, open. */
export function Filters() {
  return (
    <div className="min-h-56">
      <Popover defaultOpen>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            More filters
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-56">
          <div className="flex flex-col gap-3">
            <span className="utility-label text-text-muted">Triage filters</span>
            <Label className="flex items-center justify-between gap-3">
              Remote only <Switch defaultChecked />
            </Label>
            <Label className="flex items-center justify-between gap-3">
              Has salary <Switch />
            </Label>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
