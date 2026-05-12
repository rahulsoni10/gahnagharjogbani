import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  action?: React.ReactNode;
  className?: string;
};

export function PageHeader({ title, description, eyebrow, action, className }: PageHeaderProps) {
  return (
    <section className={cn("rounded-2xl border bg-card/90 p-6 shadow-sm", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">{eyebrow}</p>
          ) : null}
          <h1>{title}</h1>
          {description ? <p className="max-w-2xl text-muted-foreground">{description}</p> : null}
        </div>
        {action}
      </div>
    </section>
  );
}
