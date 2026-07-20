export type Param = {
  name: string;
  type: string;
  required?: boolean;
  description: string;
};

export function ParamsTable({ params }: { params: Param[] }) {
  return (
    <div className="divide-y divide-border rounded-lg border border-border">
      {params.map((p) => (
        <div key={p.name} className="flex flex-wrap items-baseline gap-x-2 gap-y-1 px-4 py-3">
          <code className="text-sm font-semibold">{p.name}</code>
          <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
            {p.type}
          </span>
          {p.required && (
            <span className="text-xs font-medium text-destructive">required</span>
          )}
          <p className="w-full text-sm text-muted-foreground">{p.description}</p>
        </div>
      ))}
    </div>
  );
}
