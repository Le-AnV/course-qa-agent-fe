"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Shared loading primitives for tab content.
 *
 * Tab pages fetch on mount, so for the first ~100ms they only have a placeholder
 * to show. A one-line "Loading…" paragraph makes that window read as a jolt: the
 * text appears, then whole cards replace it. These helpers keep the footprint of
 * the real layout (card outlines, row heights) and fade the real content in, so
 * the handoff is a subtle crossfade instead of a pop.
 */

/** A single placeholder line, sized like the text it stands in for. */
export function SkeletonLine({ className }: { className?: string }) {
  return <div aria-hidden className={cn("skeleton-shimmer rounded bg-[#EDEDED]", className)} />;
}

/** Card-shaped placeholder: same border, radius and padding as a real panel. */
export function SkeletonCard({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "skeleton-shimmer rounded-xl border border-[#DADADA] bg-white p-5 shadow-sm [--skeleton-sheen:rgba(17,17,17,0.05)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Fades content in once its data has landed. Opacity only — a transform here
 * would grow the inner scroller's overflow and make the scrollbar flicker.
 */
export function Reveal({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
