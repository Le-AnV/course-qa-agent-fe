import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * One tinted header surface for every class tab, so a page title never floats
 * on the grey workspace background. The actions sit on the same baseline as
 * the title and wrap below it on narrow screens.
 */
export function ClassPageHeader({
  id,
  title,
  subtitle,
  badge,
  actions,
  className,
}: {
  id?: string;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "flex min-h-[90px] flex-col justify-center rounded-lg border border-[var(--brand-line)] bg-[var(--brand-soft-strong)] px-4 py-3.5 md:px-5 md:py-4",
        className,
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id={id} className="text-xl font-bold text-[var(--brand-ink)]">
              {title}
            </h2>
            {badge}
          </div>
          {subtitle && <p className="mt-0.5 text-[13px] text-[#5A5A5A]">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </section>
  );
}
