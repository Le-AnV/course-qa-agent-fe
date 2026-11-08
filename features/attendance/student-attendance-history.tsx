"use client";

import * as React from "react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  HelpCircle,
} from "lucide-react";
import {
  type StudentAttendance,
  type AttendanceStatus,
} from "@/lib/attendance-api";

export function formatDisplayDate(isoDateStr: string): string {
  try {
    const [y, m, d] = isoDateStr.split("-");
    if (!y || !m || !d) return isoDateStr;
    return `${d}/${m}/${y}`;
  } catch {
    return isoDateStr;
  }
}

export function formatTimeRange(startIso: string, endIso: string): string {
  try {
    const startDate = new Date(startIso);
    const endDate = new Date(endIso);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return "";
    const s = startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
    const e = endDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
    return `${s} – ${e}`;
  } catch {
    return "";
  }
}

export function formatAttendanceRate(rate?: number | null): string {
  if (rate === null || rate === undefined) return "—";
  const pct = rate > 0 && rate <= 1 ? rate * 100 : rate;
  return `${pct.toFixed(1)}%`;
}

export function getCurrentMonth(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function getMonthRange(yearMonth: string): { from: string; to: string } {
  const [yStr, mStr] = yearMonth.split("-");
  const year = parseInt(yStr, 10);
  const month = parseInt(mStr, 10);
  const from = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDayDate = new Date(year, month, 0);
  const lastDay = String(lastDayDate.getDate()).padStart(2, "0");
  const to = `${year}-${String(month).padStart(2, "0")}-${lastDay}`;
  return { from, to };
}

export function formatMonthLabel(yearMonth: string): string {
  try {
    const [yStr, mStr] = yearMonth.split("-");
    const year = parseInt(yStr, 10);
    const monthIndex = parseInt(mStr, 10) - 1;
    const date = new Date(year, monthIndex, 1);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  } catch {
    return yearMonth;
  }
}

export function getAdjacentMonth(yearMonth: string, delta: number): string {
  try {
    const [yStr, mStr] = yearMonth.split("-");
    let year = parseInt(yStr, 10);
    let month = parseInt(mStr, 10) + delta;
    while (month < 1) {
      month += 12;
      year -= 1;
    }
    while (month > 12) {
      month -= 12;
      year += 1;
    }
    return `${year}-${String(month).padStart(2, "0")}`;
  } catch {
    return yearMonth;
  }
}

export function AttendanceStatusChip({ status }: { status: AttendanceStatus | null }) {
  switch (status) {
    case "present":
      return (
        <span
          data-testid="status-chip-present"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Present
        </span>
      );
    case "late":
      return (
        <span
          data-testid="status-chip-late"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200"
        >
          <Clock className="w-3.5 h-3.5 text-amber-600" /> Late
        </span>
      );
    case "excused_absence":
      return (
        <span
          data-testid="status-chip-excused"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-blue-600" /> Excused
        </span>
      );
    case "unexcused_absence":
      return (
        <span
          data-testid="status-chip-unexcused"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200"
        >
          <XCircle className="w-3.5 h-3.5 text-rose-600" /> Unexcused
        </span>
      );
    default:
      return (
        <span
          data-testid="status-chip-unmarked"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200"
        >
          <HelpCircle className="w-3.5 h-3.5 text-gray-500" /> Not marked
        </span>
      );
  }
}

export type StudentAttendanceHistoryProps = {
  data: StudentAttendance;
};

export function StudentAttendanceHistory({ data }: StudentAttendanceHistoryProps) {
  const breakdown = React.useMemo(() => {
    const counts = {
      present: 0,
      late: 0,
      excused: 0,
      unexcused: 0,
      unmarked: 0,
    };
    if (!data.items) return counts;
    for (const item of data.items) {
      if (item.status === "present") counts.present += 1;
      else if (item.status === "late") counts.late += 1;
      else if (item.status === "excused_absence") counts.excused += 1;
      else if (item.status === "unexcused_absence") counts.unexcused += 1;
      else counts.unmarked += 1;
    }
    return counts;
  }, [data.items]);

  return (
    <div className="space-y-6" data-testid="student-attendance-history">
      {/* Metric summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Rate card */}
        <div
          data-testid="metric-attendance-rate"
          className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between"
        >
          <span className="text-sm font-medium text-gray-500">Attendance Rate</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-gray-900">
              {formatAttendanceRate(data.attendance_rate)}
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-400">
            Calculated: (Present + Late) / Total counted sessions
          </p>
        </div>

        {/* Attended sessions card */}
        <div
          data-testid="metric-attended-sessions"
          className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between"
        >
          <span className="text-sm font-medium text-gray-500">Attended Sessions</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-emerald-600">
              {data.attended}
            </span>
            <span className="text-sm font-medium text-gray-500">
              / {data.total_sessions} {data.total_sessions === 1 ? "session" : "sessions"}
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-400">Total sessions you attended on-time or late</p>
        </div>

        {/* Total sessions card */}
        <div
          data-testid="metric-total-sessions"
          className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between"
        >
          <span className="text-sm font-medium text-gray-500">Total Sessions</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-gray-900">
              {data.total_sessions}
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-400">Scheduled sessions in this period</p>
        </div>
      </div>

      {/* Breakdown chips row */}
      <div
        data-testid="status-breakdown-row"
        className="bg-white px-5 py-3.5 rounded-xl border border-gray-200 flex flex-wrap items-center gap-3 text-xs"
      >
        <span className="font-semibold text-gray-700 mr-1">Status breakdown:</span>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-medium border border-emerald-200">
          Present: {breakdown.present}
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-medium border border-amber-200">
          Late: {breakdown.late}
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-medium border border-blue-200">
          Excused: {breakdown.excused}
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 font-medium border border-rose-200">
          Unexcused: {breakdown.unexcused}
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 font-medium border border-gray-200">
          Not marked: {breakdown.unmarked}
        </span>
      </div>

      {/* Session table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <h3 className="font-semibold text-gray-900">Session History</h3>
          </div>
          <span className="text-xs text-gray-500 font-medium">
            {data.items.length} {data.items.length === 1 ? "session" : "sessions"}
          </span>
        </div>

        {data.items.length === 0 ? (
          <div
            data-testid="empty-sessions-notice"
            className="p-10 text-center text-gray-500 space-y-2"
          >
            <Calendar className="w-10 h-10 mx-auto text-gray-300 stroke-1" />
            <p className="text-sm font-semibold text-gray-800">No attendance yet</p>
            <p className="text-xs text-gray-400">
              No sessions found for this month. Sessions will appear here once scheduled.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto min-w-[500px]">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/75 text-gray-500 border-b border-gray-200 text-xs uppercase font-medium">
                <tr>
                  <th className="px-5 py-3 w-12 text-center">#</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Time</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.items.map((item, idx) => (
                  <tr
                    key={item.session_id}
                    className="hover:bg-gray-50/60 transition-colors"
                    data-testid={`session-row-${item.session_id}`}
                  >
                    <td className="px-5 py-3.5 text-center text-gray-400 text-xs font-mono">
                      {idx + 1}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-gray-900 whitespace-nowrap">
                      {formatDisplayDate(item.date)}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap text-xs">
                      {formatTimeRange(item.start_at, item.end_at)}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <AttendanceStatusChip status={item.status} />
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs max-w-xs truncate">
                      {item.note || <span className="text-gray-300">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
