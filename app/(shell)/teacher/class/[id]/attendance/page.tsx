"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import {
  Calendar,
  AlertCircle,
  RefreshCw,
  Clock,
  CalendarCog,
  CalendarPlus,
} from "lucide-react";
import { ClassPageHeader } from "@/components/shared/ClassPageHeader";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { SkeletonLine } from "@/components/shared/page-skeleton";
import {
  attendanceApi,
  type ClassSession,
  type AttendanceSheet as AttendanceSheetType,
  type AttendanceSummary,
} from "@/lib/attendance-api";
import {
  AttendanceWeekPicker,
  getMonday,
  getSunday,
} from "@/features/attendance/attendance-week-picker";
import { AttendanceSheet } from "@/features/attendance/attendance-sheet";
import { AttendanceScheduleManager } from "@/features/attendance/attendance-schedule-manager";
import {
  AttendanceSummaryTable,
  getSemesterRange,
} from "@/features/attendance/attendance-summary-table";

function formatDisplayDate(isoStr: string): string {
  const [y, m, d] = isoStr.split("-");
  return `${d}/${m}/${y}`;
}

function formatTime(isoDateTimeStr: string): string {
  try {
    const d = new Date(isoDateTimeStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  } catch {
    return isoDateTimeStr;
  }
}

export default function TeacherAttendancePage() {
  const params = useParams();
  const classId = (params?.id as string) ?? "";

  // Step 5.2 core states
  const [weekStart, setWeekStart] = React.useState<string>(() => getMonday());
  const [sessions, setSessions] = React.useState<ClassSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = React.useState<string | null>(null);
  const [sheet, setSheet] = React.useState<AttendanceSheetType | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isScheduleManagerOpen, setIsScheduleManagerOpen] = React.useState<boolean>(false);

  // Summary state
  const [summaryData, setSummaryData] = React.useState<AttendanceSummary | null>(null);
  const [summaryRange, setSummaryRange] = React.useState<string>("semester");
  const [loadingSummary, setLoadingSummary] = React.useState<boolean>(false);
  const [summaryError, setSummaryError] = React.useState<string | null>(null);

  // Load summary
  const loadSummary = React.useCallback(
    async (rangeType: string = "semester", customFrom?: string, customTo?: string) => {
      if (!classId) return;
      try {
        setLoadingSummary(true);
        setSummaryError(null);
        let from = customFrom;
        let to = customTo;
        if (!from || !to) {
          if (rangeType === "semester") {
            const sem = getSemesterRange();
            from = sem.from;
            to = sem.to;
          }
        }
        const data = await attendanceApi.summary(classId, from, to);
        setSummaryData(data);
      } catch (err) {
        setSummaryError(err instanceof Error ? err.message : "Failed to load summary");
      } finally {
        setLoadingSummary(false);
      }
    },
    [classId],
  );

  const handleSummaryRangeChange = (newRange: string, from?: string, to?: string) => {
    setSummaryRange(newRange);
    void loadSummary(newRange, from, to);
  };

  // Load sessions when classId or weekStart changes
  const loadSessions = React.useCallback(async () => {
    if (!classId) return;
    try {
      setLoading(true);
      setError(null);
      const from = weekStart;
      const to = getSunday(weekStart);
      const data = await attendanceApi.listSessions(classId, from, to);
      setSessions(data);

      setSelectedSessionId((prev) => {
        if (prev && data.some((s) => s.id === prev)) {
          return prev;
        }
        return data.length > 0 ? data[0].id : null;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load class sessions");
    } finally {
      setLoading(false);
    }
  }, [classId, weekStart]);

  // Load sheet when selectedSessionId changes
  const [loadingSheet, setLoadingSheet] = React.useState<boolean>(false);
  const [sheetError, setSheetError] = React.useState<string | null>(null);

  const loadSheet = React.useCallback(
    async (sessionId: string) => {
      if (!classId) return;
      try {
        setLoadingSheet(true);
        setSheetError(null);
        const data = await attendanceApi.getSheet(classId, sessionId);
        setSheet(data);
      } catch (err) {
        setSheetError(err instanceof Error ? err.message : "Failed to load attendance sheet");
      } finally {
        setLoadingSheet(false);
      }
    },
    [classId],
  );

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-time fetch; state updates only after await.
    void loadSessions();
    void loadSummary();
  }, [loadSessions, loadSummary]);

  React.useEffect(() => {
    if (selectedSessionId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- session-change fetch; state updates only after await.
      void loadSheet(selectedSessionId);
    } else {
      setSheet(null);
    }
  }, [selectedSessionId, loadSheet]);


  const selectedSession = React.useMemo(() => {
    return sessions.find((s) => s.id === selectedSessionId) ?? null;
  }, [sessions, selectedSessionId]);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto w-full">
      <ClassPageHeader
        title="Attendance"
        subtitle="Track, take, and review class attendance per session."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsScheduleManagerOpen(true)}
              className="gap-1.5"
            >
              <CalendarCog className="size-3.5" />
              Manage schedule
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void loadSessions()}
              disabled={loading}
              className="gap-1.5"
            >
              <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        }
      />

      {error && (
        <Alert variant="destructive" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <div>
              <AlertTitle>Connection Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="xs"
            onClick={() => {
              void loadSessions();
              void loadSummary(summaryRange);
            }}
            className="shrink-0 self-start sm:self-auto gap-1"
          >
            <RefreshCw className="size-3" />
            Retry
          </Button>
        </Alert>
      )}

      {/* Week Navigation Header */}
      <AttendanceWeekPicker
        weekStart={weekStart}
        onChange={setWeekStart}
        disabled={loading}
      />

      {/* Sessions and Attendance Content Area */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" data-testid="attendance-loading-skeleton">
          {/* Left Column: 3 Session Cards Skeleton */}
          <div className="flex flex-col gap-2 lg:col-span-1">
            <SkeletonLine className="h-3.5 w-24 mb-1" />
            <div className="flex flex-col gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col gap-2 rounded-lg border border-[#E5E5E5] bg-white p-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <SkeletonLine className="h-4 w-24" />
                    <SkeletonLine className="h-3.5 w-14 rounded-full" />
                  </div>
                  <SkeletonLine className="h-3 w-32" />
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Attendance Sheet Table Skeleton */}
          <div className="flex flex-col gap-4 lg:col-span-3">
            <div className="rounded-lg border border-[#E5E5E5] bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-[#F0F0F0] pb-3 mb-4">
                <SkeletonLine className="h-4 w-48" />
                <div className="flex items-center gap-2">
                  <SkeletonLine className="h-4 w-16" />
                  <SkeletonLine className="h-4 w-16" />
                </div>
              </div>
              <div className="flex flex-col gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-[#F7F7F7]">
                    <div className="flex items-center gap-3">
                      <SkeletonLine className="h-3.5 w-6" />
                      <SkeletonLine className="h-3.5 w-20" />
                      <SkeletonLine className="h-3.5 w-32" />
                    </div>
                    <SkeletonLine className="h-6 w-48 rounded-md" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : error ? (
        <div
          className="rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] p-8 text-center"
          data-testid="attendance-error-state"
        >
          <AlertCircle className="mx-auto size-8 text-[#DC2626]" />
          <h3 className="mt-2 text-sm font-semibold text-[#991B1B]">Unable to load class sessions</h3>
          <p className="mt-1 text-xs text-[#B91C1C] max-w-md mx-auto">
            {error}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              void loadSessions();
              void loadSummary(summaryRange);
            }}
            className="mt-4 gap-1.5 text-xs font-medium border-[#FCA5A5] text-[#991B1B] hover:bg-[#FEE2E2]"
          >
            <RefreshCw className="size-3.5" />
            Retry connection
          </Button>
        </div>
      ) : sessions.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#DADADA] bg-[#FAFAFA] p-8 text-center" data-testid="attendance-empty-sessions">
          <Calendar className="mx-auto size-8 text-[#8C8C8C]" />
          <h3 className="mt-2 text-sm font-semibold text-[#111111]">No sessions this week</h3>
          <p className="mt-1 text-xs text-[#5A5A5A]">
            No class sessions are scheduled for this week range.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsScheduleManagerOpen(true)}
            className="mt-3 gap-1.5 text-xs font-medium"
          >
            <CalendarPlus className="size-3.5" />
            Manage schedule
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column: Session Selector */}
          <div className="flex flex-col gap-2 lg:col-span-1">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#5A5A5A]">
              Sessions ({sessions.length})
            </h3>
            <div className="flex flex-col gap-1.5">
              {sessions.map((sess) => {
                const isSelected = sess.id === selectedSessionId;
                return (
                  <button
                    key={sess.id}
                    type="button"
                    onClick={() => setSelectedSessionId(sess.id)}
                    className={`flex flex-col items-start rounded-lg border p-3 text-left transition-colors ${
                      isSelected
                        ? "border-[#111111] bg-[#F7F7F7] shadow-xs"
                        : "border-[#E5E5E5] bg-white hover:bg-[#FAFAFA]"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-semibold text-[#111111]">
                        {formatDisplayDate(sess.date)}
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ${
                          sess.status === "scheduled"
                            ? "bg-blue-50 text-blue-700"
                            : sess.status === "cancelled"
                            ? "bg-red-50 text-red-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {sess.status}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-[11.5px] text-[#5A5A5A]">
                      <Clock className="size-3" />
                      <span>
                        {formatTime(sess.start_at)} – {formatTime(sess.end_at)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Attendance Sheet */}
          <div className="flex flex-col gap-4 lg:col-span-3">
            {loadingSheet ? (
              <div
                className="flex items-center justify-center p-12 text-[#5A5A5A] gap-2 rounded-lg border border-[#E5E5E5] bg-white"
                data-testid="attendance-sheet-loading"
              >
                <Spinner className="size-4" />
                <span className="text-xs">Loading attendance sheet...</span>
              </div>
            ) : sheetError ? (
              <Alert variant="destructive" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="size-4 shrink-0" />
                  <div>
                    <AlertTitle>Failed to load attendance sheet</AlertTitle>
                    <AlertDescription>{sheetError}</AlertDescription>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => selectedSessionId && void loadSheet(selectedSessionId)}
                  className="shrink-0 self-start sm:self-auto gap-1"
                >
                  <RefreshCw className="size-3" />
                  Retry
                </Button>
              </Alert>
            ) : sheet ? (
              <AttendanceSheet
                classId={classId}
                sheet={sheet}
                onSheetSaved={(updated) => {
                  setSheet(updated);
                  void loadSummary(summaryRange);
                }}
              />
            ) : selectedSession ? (
              <div className="flex items-center justify-center p-12 text-[#5A5A5A] gap-2 rounded-lg border border-[#E5E5E5] bg-white">
                <Spinner className="size-4" />
                <span className="text-xs">Loading attendance sheet...</span>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-[#DADADA] bg-[#FAFAFA] p-8 text-center text-xs text-[#5A5A5A]">
                Select a session to view attendance sheet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Attendance Summary Section */}
      <AttendanceSummaryTable
        rows={summaryData?.students ?? []}
        totalSessions={summaryData?.total_sessions}
        range={summaryRange}
        onRangeChange={handleSummaryRangeChange}
        loading={loadingSummary}
        error={summaryError}
        onRetry={() => void loadSummary(summaryRange)}
      />

      {/* Schedule Manager Modal */}
      <AttendanceScheduleManager
        isOpen={isScheduleManagerOpen}
        onClose={() => setIsScheduleManagerOpen(false)}
        classId={classId}
        onScheduleChanged={() => void loadSessions()}
      />
    </div>
  );
}
