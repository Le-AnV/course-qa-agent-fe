"use client";

import { cn } from "@/lib/utils";

type MockBadgeProps = {
  label?: string;
  className?: string;
  title?: string;
};

/**
 * Honest marker for surfaces still on sample data (chat, proposals).
 * Visible so nobody mistakes mock content for production data.
 */
export function MockBadge({ label = "MOCK", className, title }: MockBadgeProps) {
  return (
    <span
      title={title ?? "Sample data — backend for this surface is not built yet"}
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest",
        "bg-amber-50 text-amber-700 border border-amber-200",
        className,
      )}
    >
      {label}
    </span>
  );
}
