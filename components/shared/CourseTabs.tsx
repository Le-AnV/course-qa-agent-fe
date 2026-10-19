"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CourseTabItem {
  id: string;
  label: string;
  href: string;
}

/**
 * Class-workspace tabs. Below lg the strip would need horizontal scrolling
 * (5-6 tabs never fit in 390px), so mobile gets a single row showing the
 * active section that expands into a full list. Desktop keeps the strip.
 */
export function CourseTabs({ tabs }: { tabs: CourseTabItem[] }) {
  const pathname = usePathname();
  const active =
    tabs.find((tab) => pathname === tab.href || pathname.startsWith(`${tab.href}/`)) ?? tabs[0];
  const [menuOpen, setMenuOpen] = React.useState(false);
  // Close the list on navigation (render-phase adjustment, no effect).
  const [openedAt, setOpenedAt] = React.useState(pathname);
  if (menuOpen && openedAt !== pathname) {
    setOpenedAt(pathname);
    setMenuOpen(false);
  }

  return (
    <div className="relative w-full bg-white border-b border-[#DADADA] shrink-0">
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
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        >
          <span className="flex min-w-0 items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[#6F6F6F]">
              Section
            </span>
            <span className="truncate text-[14px] font-semibold text-[#111111]">
              {active.label}
            </span>
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-[#6F6F6F] transition-transform motion-reduce:transition-none",
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
              className="absolute inset-x-0 top-full z-20 border-b border-[#DADADA] bg-white shadow-sm"
            >
              {tabs.map((tab) => {
                const isActive = tab.id === active.id;
                return (
                  <Link
                    key={tab.id}
                    href={tab.href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex items-center justify-between gap-3 px-4 py-3 text-[13.5px] transition-colors",
                      isActive
                        ? "bg-[var(--brand-soft)] font-semibold text-[#111111]"
                        : "text-[#5A5A5A] hover:bg-[#F7F7F7] hover:text-[#111111]",
                    )}
                  >
                    {tab.label}
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
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center justify-center gap-6 min-w-max">
            {tabs.map((tab) => {
              const isActive = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  className={cn(
                    "py-3 text-[13.5px] whitespace-nowrap border-b-2 transition-all",
                    isActive
                      ? "border-[var(--brand-ink)] text-[#111111] font-semibold"
                      : "border-transparent text-[#5A5A5A] hover:text-[#111111] font-medium",
                  )}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
