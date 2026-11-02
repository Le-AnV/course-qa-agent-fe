"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { ClassPageHeader } from "@/components/shared/ClassPageHeader";
import { cn } from "@/lib/utils";

interface TicketsInboxLayoutProps {
  title: string;
  subtitle: string;
  titleBadge?: React.ReactNode;
  headerActions?: React.ReactNode;
  searchValue: string;
  searchPlaceholder?: string;
  onSearchChange: (val: string) => void;
  filters: { id: string; label: string }[];
  activeFilter: string;
  onFilterChange: (id: string) => void;
  leftListContent: React.ReactNode;
  rightDetailContent: React.ReactNode;
}

const STATUS_DOT: Record<string, string> = {
  OPEN: "bg-[#C99A2E]",
  ANSWERED: "bg-[#2563EB]",
  RESOLVED: "bg-[#137A4B]",
  EXPIRED: "bg-[#9A9A9A]",
};

export function TicketsInboxLayout({
  title,
  subtitle,
  titleBadge,
  headerActions,
  searchValue,
  searchPlaceholder = "Search tickets",
  onSearchChange,
  filters,
  activeFilter,
  onFilterChange,
  leftListContent,
  rightDetailContent,
}: TicketsInboxLayoutProps) {
  const activeIndex = Math.max(
    0,
    filters.findIndex((filter) => filter.id === activeFilter),
  );
  const columnCount = Math.max(filters.length, 1);

  return (
    <div className="flex h-full flex-col space-y-5">
      <ClassPageHeader
        title={title}
        subtitle={subtitle}
        badge={titleBadge}
        actions={headerActions}
      />

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="relative w-full xl:w-[340px] xl:shrink-0">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5A5A5A]" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            className="w-full rounded-lg border border-[#DADADA] bg-white py-2 pl-9 pr-4 text-[13.5px] shadow-sm outline-none transition-shadow focus:border-[#111111]"
          />
        </div>

        <div
          role="group"
          aria-label="Filter tickets by status"
          className="relative grid w-full rounded-lg bg-slate-100 p-1 xl:w-auto xl:max-w-[520px] xl:flex-1"
          style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-1 left-1 rounded-md bg-white shadow-sm transition-transform duration-300 ease-out"
            style={{
              width: `calc((100% - 0.5rem) / ${columnCount})`,
              transform: `translateX(${activeIndex * 100}%)`,
            }}
          />
          {filters.map((filter) => {
            const isActive = activeFilter === filter.id;
            return (
              <button
                key={filter.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => onFilterChange(filter.id)}
                className={cn(
                  "relative z-10 flex items-center justify-center gap-1 rounded-md px-1 py-1.5 text-[11.5px] transition-colors sm:gap-1.5 sm:px-3 sm:text-[13px]",
                  isActive
                    ? "font-semibold text-[#111111]"
                    : "font-medium text-[#5A5A5A] hover:text-[#111111]",
                )}
              >
                {STATUS_DOT[filter.id] && (
                  <span
                    aria-hidden="true"
                    className={cn(
                      "hidden h-1.5 w-1.5 shrink-0 rounded-full sm:block",
                      STATUS_DOT[filter.id],
                    )}
                  />
                )}
                <span className="truncate">{filter.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex min-h-[520px] flex-1 flex-col overflow-hidden rounded-lg border border-[#DADADA] bg-white md:flex-row">
        {/* Left Column */}
        <div className="flex w-full shrink-0 flex-col border-r border-[#F0F0F0] bg-white md:w-[340px] lg:w-[380px]">
          <div className="flex-1 overflow-y-auto">{leftListContent}</div>
        </div>

        {/* Right Column */}
        <div className="flex flex-1 flex-col overflow-hidden bg-white">
          {rightDetailContent}
        </div>
      </div>
    </div>
  );
}
