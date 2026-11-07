"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import {
  Calendar,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { ClassPageHeader } from "@/components/shared/ClassPageHeader";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { SkeletonLine, SkeletonCard } from "@/components/shared/page-skeleton";
import {
  attendanceApi,
  type StudentAttendance,
} from "@/lib/attendance-api";
import {
  StudentAttendanceHistory,
  formatAttendanceRate,
  formatDisplayDate,
  formatTimeRange,
  AttendanceStatusChip,
} from "@/features/attendance/student-attendance-history";

export { formatAttendanceRate, formatDisplayDate, formatTimeRange, AttendanceStatusChip };

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
  const [yStr, mStr] = yearMonth.split("-");
  const year = parseInt(yStr, 10);
  const month = parseInt(mStr, 10);
  const target = new Date(year, month - 1 + delta, 1);
  const nextY = target.getFullYear();
  const nextM = String(target.getMonth() + 1).padStart(2, "0");
  return `${nextY}-${nextM}`;
}

export default function StudentAttendancePage() {
  const params = useParams();
  const classId = (params?.id as string) ?? "";

  // Step 6.2 & 6.4 core states: month, data, loading, error
  const [month, setMonth] = React.useState<string>(() => getCurrentMonth());
  const [data, setData] = React.useState<StudentAttendance | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  // Load attendance data from API
  const loadAttendance = React.useCallback(
    async (targetMonth: string) => {
      if (!classId) return;
      setLoading(true);
      setError(null);
      const { from, to } = getMonthRange(targetMonth);
      try {
        const result = await attendanceApi.myAttendance(classId, from, to);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load attendance history");
      } finally {
        setLoading(false);
      }
    },
    [classId],
  );

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on mount and month change
    void loadAttendance(month);
  }, [loadAttendance, month]);

  const handlePrevMonth = () => {
    setMonth((prev) => getAdjacentMonth(prev, -1));
  };

  const handleNextMonth = () => {
    setMonth((prev) => getAdjacentMonth(prev, 1));
  };

  const handleCurrentMonth = () => {
    setMonth(getCurrentMonth());
  };

  return (
    <div className="space-y-6">
      <ClassPageHeader
        title="My Attendance"
        subtitle="View your attendance history, sessions, and attendance rate."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadAttendance(month)}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      {/* Month Filter Selector (prev/next and direct select) */}
      <div
        data-testid="month-filter-toolbar"
        className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-200"
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            <span className="font-semibold text-gray-900">{formatMonthLabel(month)}</span>
          </div>
          <input
            type="month"
            aria-label="Select month"
            data-testid="month-select-input"
            value={month}
            onChange={(e) => {
              if (e.target.value) setMonth(e.target.value);
            }}
            disabled={loading}
            className="text-xs text-gray-600 border border-gray-200 rounded-md px-2 py-1 bg-gray-50 hover:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevMonth}
            disabled={loading}
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCurrentMonth}
            disabled={loading || month === getCurrentMonth()}
          >
            This month
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextMonth}
            disabled={loading}
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <Alert
          data-testid="attendance-error-state"
          variant="destructive"
          className="bg-rose-50 border-rose-200 text-rose-800"
        >
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <AlertTitle className="font-semibold text-rose-900">Connection Error</AlertTitle>
          <AlertDescription className="mt-1 flex flex-col gap-2">
            <span>{error}</span>
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadAttendance(month)}
                className="bg-white border-rose-300 hover:bg-rose-100 text-rose-900 font-medium"
              >
                Retry
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Loading state */}
      {loading && (
        <div data-testid="attendance-loading-skeleton" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SkeletonCard className="h-28" />
            <SkeletonCard className="h-28" />
            <SkeletonCard className="h-28" />
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
            <SkeletonLine className="h-6 w-1/4" />
            <SkeletonLine className="h-10 w-full" />
            <SkeletonLine className="h-10 w-full" />
            <SkeletonLine className="h-10 w-full" />
          </div>
        </div>
      )}

      {/* Loaded Content */}
      {!loading && !error && data && <StudentAttendanceHistory data={data} />}
    </div>
  );
}
