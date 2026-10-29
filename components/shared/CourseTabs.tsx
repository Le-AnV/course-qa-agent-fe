"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { PAGE_MAX_WIDTH } from "@/components/shared/PageShell";

export interface CourseTabItem {
  id: string;
  label: string;
  href: string;
  badge?: number;
}

function TabBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  const label = `${count} pending join request${count === 1 ? "" : "s"}`;
  return (
    <span
      aria-label={label}
      title={label}
      className="inline-flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-[#9D4C38] px-1 text-[10px] font-semibold leading-none text-white"
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

/**
 * Class-workspace tabs. Below lg the strip would need horizontal scrolling
 * (5-6 tabs never fit in 390px), so mobile gets a single row showing the
 * active section that expands into a full list. Desktop keeps the strip.
 */
export function CourseTabs({ tabs }: { tabs: CourseTabItem[] }) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const active =
    tabs.find((tab) => pathname === tab.href || pathname.startsWith(`${tab.href}/`)) ?? tabs[0];
  const indicatorTransition = reduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 420, damping: 38 };
  const [menuOpen, setMenuOpen] = React.useState(false);
  // Close the list on navigation (render-phase adjustment, no effect).
  const [openedAt, setOpenedAt] = React.useState(pathname);
  if (menuOpen && openedAt !== pathname) {
    setOpenedAt(pathname);
    setMenuOpen(false);
  }

  return (
    // Tinted with the brand soft/line pair already used by the sidebar's active
    // state: a white strip here merged into the white header + sidebar above it.
    <div className="relative w-full bg-[var(--brand-soft)] border-b border-[var(--brand-line)] shrink-0">
      {/* Below lg: no scrolling, one row + expandable list */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => {
            setOpenedAt(pathname);
            setMenuOpen((v) => !v);
          }}
          aria-expanded={menuOpen}
          aria-controls="course-tab-menu"
          className="flex w-full items-center justify-between gap-3 px-4 py-1.5 text-left transition-colors hover:bg-[var(--brand-soft-strong)]"
        >
          <span className="flex min-w-0 items-center gap-2">
            <span className="text-[9.5px] font-semibold uppercase tracking-wide text-[#5A5A5A]">
              Section
            </span>
            <span className="truncate text-[13.5px] font-semibold text-[#111111]">
              {active.label}
            </span>
            <TabBadge count={active.badge ?? 0} />
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-[#5A5A5A] transition-transform motion-reduce:transition-none",
              menuOpen && "rotate-180",
            )}
          />
        </button>

        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setMenuOpen(false)}
              aria-hidden="true"
            />
            <div
              id="course-tab-menu"
              className="absolute inset-x-0 top-full z-20 border-b border-[var(--brand-line)] bg-white shadow-sm"
            >
              {tabs.map((tab) => {
                const isActive = tab.id === active.id;
                return (
                  <Link
                    key={tab.id}
                    href={tab.href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex items-center justify-between gap-3 px-4 py-2.5 text-[13px] transition-colors",
                      isActive
                        ? "bg-[var(--brand-soft)] font-semibold text-[#111111]"
                        : "text-[#5A5A5A] hover:bg-[#F7F7F7] hover:text-[#111111]",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      {tab.label}
                      <TabBadge count={tab.badge ?? 0} />
                    </span>
                    {isActive && <Check className="h-4 w-4 shrink-0 text-[var(--brand-ink)]" />}
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* lg+: the original strip, in the same column as the page content and
          centered, so it does not hug the left edge when the sidebar collapses. */}
      <div className="hidden lg:block px-6 md:px-8">
        <div className={`mx-auto ${PAGE_MAX_WIDTH}`}>
          <div className="flex items-center justify-center gap-6 min-w-max">
            {tabs.map((tab) => {
              const isActive = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "relative py-1.5 text-[12px] whitespace-nowrap border-b-2 border-transparent transition-colors",
                    isActive
                      ? "text-[#111111] font-semibold"
                      : "text-[#5A5A5A] hover:text-[#111111] font-medium",
                  )}
                >
                  <span className="inline-flex items-center gap-1.5">
                    {tab.label}
                    <TabBadge count={tab.badge ?? 0} />
                  </span>
                  {isActive && (
                    <motion.span
                      layoutId="course-tab-indicator"
                      className="absolute inset-x-0 bottom-0 h-0.5 bg-[var(--brand-ink)]"
                      transition={indicatorTransition}
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
