"use client";

import { cn } from "@/lib/utils";

type MockBadgeProps = {
  label?: string;
  className?: string;
  title?: string;
};

/**
 * Honest marker for surfaces still on sample data (chat, proposals).
 * Labelled in the user's language, not the developer's: the surface is a
 * preview of a feature whose backend does not exist yet.
 */
export function MockBadge({ label = "Preview", className, title }: MockBadgeProps) {
  return (
    <span
      title={title ?? "Preview data — this feature isn't connected to a backend yet"}
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium",
        "bg-white text-[#8F6B16] border border-[#ECDCB8]",
        className,
      )}
    >
      {label}
    </span>
  );
}
