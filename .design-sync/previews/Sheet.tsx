import {
  Badge,
  Button,
  ScoreBadge,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from 'web';

/** The job detail drawer — the app's primary triage surface after the table. */
export function JobDrawer() {
  return (
    <Sheet defaultOpen>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          Open job
        </Button>
      </SheetTrigger>
      <SheetContent>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <ScoreBadge score={88} />
            <span className="utility-label text-text-muted">dou · Aug 12, 2026</span>
          </div>
          <SheetTitle>Senior QA Engineer — Backend Services</SheetTitle>
          <SheetDescription>uSoftware / Botim · Remote</SheetDescription>
          <div className="flex flex-wrap gap-1.5">
            <Badge>Playwright</Badge>
            <Badge>TypeScript</Badge>
            <Badge>CI/CD</Badge>
          </div>
          <div className="mt-2 flex gap-2">
            <Button size="sm">Mark applied</Button>
            <Button variant="outline" size="sm">
              Open original
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
