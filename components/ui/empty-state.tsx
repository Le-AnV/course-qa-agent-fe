import type * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "cn";

type EmptyStateProps = {
  /** Small line icon from lucide-react — keep it quiet, it is not an illustration. */
  icon?: LucideIcon;
  title: string;
  description?: string;
  /** Call to action — usually a <Button> from this library. */
  action?: React.ReactNode;
  className?: string;
};

/** Zero-data state for lists, tables and panels. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border px-6 py-12 text-center",
        className,
      )}
    >
      {Icon && <Icon className="size-5 text-muted-foreground" aria-hidden />}
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && (
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
