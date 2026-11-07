"use client";

import * as React from "react";
import {
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Calendar,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import type { AttendanceSummaryRow } from "@/lib/attendance-api";

export function formatAttendanceRate(rate: number | null | undefined): string {
  if (rate === null || rate === undefined) return "—";
  const pct = rate > 0 && rate <= 1 ? rate * 100 : rate;
  return `${pct.toFixed(1)}%`;
}

export function getMonthRange(dateInput: Date = new Date()): { from: string; to: string } {
  const year = dateInput.getFullYear();
  const month = dateInput.getMonth();
  const pad = (n: number) => String(n).padStart(2, "0");
  const from = `${year}-${pad(month + 1)}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const to = `${year}-${pad(month + 1)}-${pad(lastDay)}`;
  return { from, to };
}

export function getSemesterRange(dateInput: Date = new Date()): { from: string; to: string; semesterName: string } {
  const year = dateInput.getFullYear();
  const month = dateInput.getMonth() + 1;

  if (month >= 1 && month <= 4) {
    return { from: `${year}-01-01`, to: `${year}-04-30`, semesterName: "Spring" };
  } else if (month >= 5 && month <= 8) {
    return { from: `${year}-05-01`, to: `${year}-08-31`, semesterName: "Summer" };
  } else {
    return { from: `${year}-09-01`, to: `${year}-12-31`, semesterName: "Fall" };
  }
}

type SortField =
  | "student_code"
  | "full_name"
  | "present"
  | "late"
  | "excused_absence"
  | "unexcused_absence"
  | "unmarked"
  | "attendance_rate";

type SortDirection = "asc" | "desc";

export interface AttendanceSummaryTableProps {
  rows: AttendanceSummaryRow[];
  totalSessions?: number;
  range?: string; // "semester" | "month" | "custom"
  onRangeChange?: (rangeType: string, from?: string, to?: string) => void;
  className?: string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export function AttendanceSummaryTable({
  rows,
  totalSessions,
  range = "semester",
  onRangeChange,
  className,
  loading = false,
  error = null,
  onRetry,
}: AttendanceSummaryTableProps) {
  const [sortField, setSortField] = React.useState<SortField>("student_code");
  const [sortDir, setSortDir] = React.useState<SortDirection>("asc");

  // Custom date range state
  const [customFrom, setCustomFrom] = React.useState<string>(() => getMonthRange().from);
  const [customTo, setCustomTo] = React.useState<string>(() => getMonthRange().to);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const handleRangeSelect = (newRange: string) => {
    if (newRange === "semester") {
      const { from, to } = getSemesterRange();
      onRangeChange?.(newRange, from, to);
    } else if (newRange === "month") {
      const { from, to } = getMonthRange();
      onRangeChange?.(newRange, from, to);
    } else {
      onRangeChange?.(newRange, customFrom, customTo);
    }
  };

  const handleCustomApply = () => {
    if (customFrom && customTo && customFrom <= customTo) {
      onRangeChange?.("custom", customFrom, customTo);
    }
  };

  const sortedRows = React.useMemo(() => {
    return [...rows].sort((a, b) => {
      let valA: string | number | null = a[sortField];
      let valB: string | number | null = b[sortField];

      if (valA === null || valA === undefined) valA = sortDir === "asc" ? Infinity : -Infinity;
      if (valB === null || valB === undefined) valB = sortDir === "asc" ? Infinity : -Infinity;

      if (typeof valA === "string" && typeof valB === "string") {
        return sortDir === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [rows, sortField, sortDir]);

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="size-3 text-[#8C8C8C]" />;
    }
    return sortDir === "asc" ? (
      <ChevronUp className="size-3 text-[#111111]" />
    ) : (
      <ChevronDown className="size-3 text-[#111111]" />
    );
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-lg border border-[#E5E5E5] bg-white p-4 shadow-xs",
        className,
      )}
      data-testid="attendance-summary-container"
    >
      {/* Header and Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0F0F0] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-[#111111]">Attendance Summary</h3>
            {totalSessions !== undefined && (
              <span className="rounded bg-[#FAFAFA] border border-[#E5E5E5] px-2 py-0.5 text-xs text-[#5A5A5A] font-medium">
                {totalSessions} {totalSessions === 1 ? "session" : "sessions"}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-[#5A5A5A]">
            Cumulative attendance counts and rates calculated per student.
          </p>
        </div>

        {/* Range Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-[#E5E5E5] bg-[#F7F7F7] p-0.5 text-xs">
            <button
              type="button"
              onClick={() => handleRangeSelect("semester")}
              className={cn(
                "rounded-md px-2.5 py-1 font-medium transition-all",
                range === "semester"
                  ? "bg-white text-[#111111] shadow-2xs font-semibold"
                  : "text-[#5A5A5A] hover:text-[#111111]",
              )}
            >
              This semester
            </button>
            <button
              type="button"
              onClick={() => handleRangeSelect("month")}
              className={cn(
                "rounded-md px-2.5 py-1 font-medium transition-all",
                range === "month"
                  ? "bg-white text-[#111111] shadow-2xs font-semibold"
                  : "text-[#5A5A5A] hover:text-[#111111]",
              )}
            >
              This month
            </button>
            <button
              type="button"
              onClick={() => handleRangeSelect("custom")}
              className={cn(
                "rounded-md px-2.5 py-1 font-medium transition-all",
                range === "custom"
                  ? "bg-white text-[#111111] shadow-2xs font-semibold"
                  : "text-[#5A5A5A] hover:text-[#111111]",
              )}
            >
              Custom
            </button>
          </div>

          {/* Custom Date Pickers */}
          {range === "custom" && (
            <div className="flex items-center gap-1.5 text-xs">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="rounded border border-[#DADADA] bg-white px-2 py-1 text-xs"
              />
              <span className="text-[#8C8C8C]">–</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="rounded border border-[#DADADA] bg-white px-2 py-1 text-xs"
              />
              <Button size="xs" variant="outline" onClick={handleCustomApply}>
                Apply
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Summary Table */}
      {loading ? (
        <div className="flex items-center justify-center p-12 text-[#5A5A5A] gap-2">
          <Spinner className="size-4" />
          <span className="text-xs">Loading attendance summary...</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center p-8 text-center gap-2 rounded-lg border border-[#FCA5A5] bg-[#FEF2F2]">
          <p className="text-xs text-[#991B1B] font-medium">{error}</p>
          {onRetry && (
            <Button size="xs" variant="outline" onClick={onRetry} className="gap-1 border-[#FCA5A5] text-[#991B1B] hover:bg-[#FEE2E2]">
              Retry
            </Button>
          )}
        </div>
      ) : sortedRows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#DADADA] bg-[#FAFAFA] p-8 text-center text-xs text-[#8C8C8C]">
          <Calendar className="mx-auto size-7 text-[#8C8C8C] mb-2" />
          No attendance records found for this period.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-[#E5E5E5] max-h-[420px]">
          <table className="w-full text-left text-xs relative min-w-[620px]">
            <thead className="sticky top-0 z-10 border-b border-[#E5E5E5] bg-[#FAFAFA] text-[10.5px] font-semibold uppercase text-[#5A5A5A]">
              <tr>
                <th
                  scope="col"
                  onClick={() => handleSort("student_code")}
                  className="py-2.5 px-3 cursor-pointer hover:bg-[#F0F0F0] select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Student</span>
                    {renderSortIcon("student_code")}
                  </div>
                </th>
                <th
                  scope="col"
                  onClick={() => handleSort("present")}
                  className="py-2.5 px-3 text-center cursor-pointer hover:bg-[#F0F0F0] select-none"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Present</span>
                    {renderSortIcon("present")}
                  </div>
                </th>
                <th
                  scope="col"
                  onClick={() => handleSort("late")}
                  className="py-2.5 px-3 text-center cursor-pointer hover:bg-[#F0F0F0] select-none"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Late</span>
                    {renderSortIcon("late")}
                  </div>
                </th>
                <th
                  scope="col"
                  onClick={() => handleSort("excused_absence")}
                  className="py-2.5 px-3 text-center cursor-pointer hover:bg-[#F0F0F0] select-none"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Excused</span>
                    {renderSortIcon("excused_absence")}
                  </div>
                </th>
                <th
                  scope="col"
                  onClick={() => handleSort("unexcused_absence")}
                  className="py-2.5 px-3 text-center cursor-pointer hover:bg-[#F0F0F0] select-none"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Unexcused</span>
                    {renderSortIcon("unexcused_absence")}
                  </div>
                </th>
                <th
                  scope="col"
                  onClick={() => handleSort("unmarked")}
                  className="py-2.5 px-3 text-center cursor-pointer hover:bg-[#F0F0F0] select-none"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Unmarked</span>
                    {renderSortIcon("unmarked")}
                  </div>
                </th>
                <th
                  scope="col"
                  onClick={() => handleSort("attendance_rate")}
                  className="py-2.5 px-3 text-right cursor-pointer hover:bg-[#F0F0F0] select-none"
                >
                  <div
                    className="flex items-center justify-end gap-1"
                    title="Formula: (Present + Late) / Total Sessions * 100%"
                  >
                    <span>Rate</span>
                    <Info className="size-3 text-[#8C8C8C]" />
                    {renderSortIcon("attendance_rate")}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F0F0] bg-white">
              {sortedRows.map((row) => {
                const rate = row.attendance_rate;
                return (
                  <tr key={row.student_id} className="hover:bg-[#FAFAFA] transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-[#111111]">{row.full_name}</div>
                      <div className="font-mono text-[11px] text-[#5A5A5A]">
                        {row.student_code ?? "—"}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center font-medium text-emerald-700">
                      {row.present}
                    </td>
                    <td className="py-2.5 px-3 text-center font-medium text-amber-700">
                      {row.late}
                    </td>
                    <td className="py-2.5 px-3 text-center font-medium text-blue-700">
                      {row.excused_absence}
                    </td>
                    <td className="py-2.5 px-3 text-center font-medium text-rose-700">
                      {row.unexcused_absence}
                    </td>
                    <td className="py-2.5 px-3 text-center text-[#8C8C8C]">{row.unmarked}</td>
                    <td className="py-2.5 px-3 text-right">
                      <span
                        className={cn(
                          "inline-block rounded px-2 py-0.5 font-semibold text-xs",
                          rate === null || rate === undefined
                            ? "text-[#8C8C8C] bg-gray-50"
                            : rate >= 80
                            ? "text-emerald-800 bg-emerald-50"
                            : rate >= 50
                            ? "text-amber-800 bg-amber-50"
                            : "text-rose-800 bg-rose-50",
                        )}
                      >
                        {formatAttendanceRate(rate)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

