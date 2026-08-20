import {
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'web';

/** The jobs table's column-visibility menu, open. */
export function Columns() {
  return (
    <div className="min-h-64">
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            Columns
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem checked>Score</DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem checked>Source</DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem checked>Salary</DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem>Tags</DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
