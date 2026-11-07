"use client";

import * as React from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Timezone-stable date helpers for week calculations.
 * Always parses YYYY-MM-DD components directly to avoid UTC/local offset skew.
 */
export function parseLocalDate(isoStr: string): Date {
  const [y, m, d] = isoStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function formatLocalDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Returns the Monday (YYYY-MM-DD) of the week containing the input date.
 * If no date provided, defaults to today.
 */
export function getMonday(input?: Date | string): string {
  const d = input
    ? typeof input === "string"
      ? parseLocalDate(input)
      : new Date(input)
    : new Date();
  const day = d.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  return formatLocalDate(d);
}

/**
 * Returns the Sunday (YYYY-MM-DD) for a given Monday (YYYY-MM-DD).
 */
export function getSunday(mondayStr: string): string {
  const d = parseLocalDate(mondayStr);
  d.setDate(d.getDate() + 6);
  return formatLocalDate(d);
}

/**
 * Adds or subtracts weeks from a given Monday string.
 */
export function addWeeks(mondayStr: string, count: number): string {
  const d = parseLocalDate(mondayStr);
  d.setDate(d.getDate() + count * 7);
  return formatLocalDate(d);
}

/**
 * Formats a Monday-Sunday range string: "Mon dd/mm – Sun dd/mm" (AC-01 / Step 5.3 spec).
 */
export function formatWeekRange(mondayStr: string): string {
  const monday = parseLocalDate(mondayStr);
  const sunday = parseLocalDate(getSunday(mondayStr));

  const pad = (n: number) => String(n).padStart(2, "0");
  const monDay = pad(monday.getDate());
  const monMonth = pad(monday.getMonth() + 1);
  const sunDay = pad(sunday.getDate());
  const sunMonth = pad(sunday.getMonth() + 1);
  const year = sunday.getFullYear();

  return `Mon ${monDay}/${monMonth} – Sun ${sunDay}/${sunMonth} (${year})`;
}

export interface AttendanceWeekPickerProps {
  weekStart: string; // YYYY-MM-DD (Monday)
  onChange: (newWeekStart: string) => void;
  disabled?: boolean;
  className?: string;
}

export function AttendanceWeekPicker({
  weekStart,
  onChange,
  disabled = false,
  className,
}: AttendanceWeekPickerProps) {
  const currentTodayMonday = React.useMemo(() => getMonday(), []);
  const isCurrentWeek = weekStart === currentTodayMonday;

  const handlePrev = React.useCallback(() => {
    onChange(addWeeks(weekStart, -1));
  }, [weekStart, onChange]);

  const handleNext = React.useCallback(() => {
    onChange(addWeeks(weekStart, 1));
  }, [weekStart, onChange]);

  const handleToday = React.useCallback(() => {
    onChange(getMonday());
  }, [onChange]);

  return (
    <section
      aria-label="Attendance week selector"
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#E5E5E5] bg-white p-3 md:p-4 shadow-xs",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <Calendar className="size-4 text-[#5A5A5A]" />
        <span className="text-sm font-semibold text-[#111111]" data-testid="week-range-text">
          {formatWeekRange(weekStart)}
        </span>
        {isCurrentWeek && (
          <span className="rounded bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
            This week
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handlePrev}
          disabled={disabled}
          aria-label="Previous week"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleToday}
          disabled={disabled || isCurrentWeek}
          className="text-xs font-medium"
        >
          Today
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={disabled}
          aria-label="Next week"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </section>
  );
}

