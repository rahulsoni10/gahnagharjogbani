import { ArrowLeft } from "lucide-react";
import { LinkButton } from "@/components/ui/link-button";
import { cn } from "@/lib/utils";

type FormPageShellProps = {
  backHref: string;
  backLabel: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
};

export function FormPageShell({
  backHref,
  backLabel,
  title,
  description,
  children,
  className,
}: FormPageShellProps) {
  return (
    <div className={cn("mx-auto w-full max-w-3xl space-y-6", className)}>
      <LinkButton variant="ghost" size="sm" href={backHref}>
        <ArrowLeft className="h-4 w-4 mr-1" />
        {backLabel}
      </LinkButton>

      <div className="space-y-1">
        <h1>{title}</h1>
        {description ? <p className="text-muted-foreground">{description}</p> : null}
      </div>

      {children}
    </div>
  );
}
