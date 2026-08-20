import { Button, Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from 'web';

/** Destructive confirm — the delete flow, open. */
export function Confirm() {
  return (
    <Dialog defaultOpen>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Delete this vacancy?</DialogTitle>
        <DialogDescription>
          “Senior QA Engineer — Backend Services” will be removed permanently. This cannot be
          undone.
        </DialogDescription>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" size="sm">
            Cancel
          </Button>
          <Button variant="destructive" size="sm">
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
