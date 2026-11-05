import * as React from "react";
import { cn } from "@/lib/utils";

type WorkspacePageHeaderProps = {
  title: string;
  subtitle?: string;
  id?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
};

/** A compact, shared heading surface for role and class workspaces. */
export function WorkspacePageHeader({
  title,
  subtitle,
  id,
  badge,
  actions,
  className,
}: WorkspacePageHeaderProps) {
  return (
    <header
      className={cn(
        "relative isolate flex min-h-[104px] flex-col justify-center overflow-hidden rounded-xl border border-[#45698B] bg-[linear-gradient(112deg,#294D72_0%,#365F85_68%,#47759A_100%)] px-4 py-4 shadow-[0_8px_24px_rgba(23,51,83,0.12)] sm:px-5 md:px-6",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-[58%] sm:block"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.09) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.09) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          maskImage: "linear-gradient(to right, transparent, black 46%)",
          WebkitMaskImage: "linear-gradient(to right, transparent, black 46%)",
        }}
      />
      <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 id={id} className="font-heading text-balance text-[24px] font-bold leading-tight tracking-tight text-white sm:text-[28px]">
              {title}
            </h1>
            {badge}
          </div>
          {subtitle && <p className="mt-1.5 max-w-3xl text-[13px] leading-relaxed text-[#DEE8F2] sm:text-[13.5px]">{subtitle}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
