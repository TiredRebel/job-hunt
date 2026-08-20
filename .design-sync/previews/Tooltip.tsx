import { Button, Tooltip, TooltipContent, TooltipTrigger } from 'web';

/** Open by default so the card shows the thing being previewed. */
export function Open() {
  return (
    <div className="flex min-h-24 items-end justify-center">
      <Tooltip defaultOpen>
        <TooltipTrigger asChild>
          <Button variant="outline" size="icon" aria-label="Delete">
            ⌫
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">Delete this vacancy</TooltipContent>
      </Tooltip>
    </div>
  );
}
