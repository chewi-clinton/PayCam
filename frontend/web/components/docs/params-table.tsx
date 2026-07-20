import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type Param = {
  name: string;
  type: string;
  required?: boolean;
  description: string;
};

export function ParamsTable({ params }: { params: Param[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Parameter</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Description</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {params.map((p) => (
          <TableRow key={p.name}>
            <TableCell className="font-mono text-xs">
              {p.name}
              {p.required && <span className="ml-1 text-destructive">*</span>}
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">{p.type}</TableCell>
            <TableCell className="text-sm">{p.description}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
