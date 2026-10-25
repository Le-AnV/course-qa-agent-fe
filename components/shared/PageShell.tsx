"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * One content column for the whole app shell.
 *
 * Width is `PAGE_MAX_WIDTH` — wide enough to use the space next to the sidebar
 * instead of leaving big empty gutters, but still capped so text lines and
 * cards do not stretch on very large monitors. Change the cap here only.
 */
export const PAGE_MAX_WIDTH = "max-w-[1440px]";

export const PAGE_COLUMN = `w-full ${PAGE_MAX_WIDTH} mx-auto px-6 pt-8 pb-12`;

export function PageContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn(PAGE_COLUMN, className)}>{children}</div>;
}
