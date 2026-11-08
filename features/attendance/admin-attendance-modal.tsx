"use client";

import * as React from "react";
import { Modal } from "@/components/shared/Modal";
import { Button } from "@/components/ui/button";
import {
  attendanceApi,
  type AttendanceSummary,
} from "@/lib/attendance-api";
import {
  AttendanceSummaryTable,
  getSemesterRange,
  getMonthRange,
} from "@/features/attendance/attendance-summary-table";

export interface AdminAttendanceModalProps {
  classId: string;
  className?: string;
  classCode?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function AdminAttendanceModal({
  classId,
  className,
  classCode,
  isOpen,
  onClose,
}: AdminAttendanceModalProps) {
  const [range, setRange] = React.useState<string>("semester");
  const [summaryData, setSummaryData] = React.useState<AttendanceSummary | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadSummary = React.useCallback(
    async (rangeType: string, customFrom?: string, customTo?: string) => {
      if (!classId) return;
      setLoading(true);
      setError(null);

      let fromStr: string | undefined;
      let toStr: string | undefined;

      if (rangeType === "semester") {
        const sem = getSemesterRange();
        fromStr = sem.from;
        toStr = sem.to;
      } else if (rangeType === "month") {
        const mon = getMonthRange();
        fromStr = mon.from;
        toStr = mon.to;
      } else if (rangeType === "custom" && customFrom && customTo) {
        fromStr = customFrom;
        toStr = customTo;
      }

      try {
        const data = await attendanceApi.summary(classId, fromStr, toStr);
        setSummaryData(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load class attendance summary",
        );
      } finally {
        setLoading(false);
      }
    },
    [classId],
  );

  const handleModalClose = React.useCallback(() => {
    setRange("semester");
    setSummaryData(null);
    setError(null);
    onClose();
  }, [onClose]);

  React.useEffect(() => {
    if (isOpen && classId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on modal open; updates happen after await.
      void loadSummary("semester");
    }
  }, [isOpen, classId, loadSummary]);

  const handleRangeChange = (rangeType: string, from?: string, to?: string) => {
    setRange(rangeType);
    void loadSummary(rangeType, from, to);
  };

  const titleText = classCode
    ? `Attendance Summary — ${classCode}`
    : className
      ? `Attendance Summary — ${className}`
      : "Attendance Summary";

  const subtitleText =
    classCode && className
      ? `${classCode} · ${className}`
      : "Review cumulative attendance rates and session counts for all enrolled students.";

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title={titleText}
      subtitle={subtitleText}
      widthClass="max-w-4xl"
    >
      <div className="space-y-4" data-testid="admin-attendance-modal-content">
        <AttendanceSummaryTable
          rows={summaryData?.students ?? []}
          totalSessions={summaryData?.total_sessions ?? 0}
          range={range}
          onRangeChange={handleRangeChange}
          loading={loading}
          error={error}
          onRetry={() => void loadSummary(range)}
        />

        <div className="flex justify-end pt-2 border-t border-gray-100">
          <Button
            variant="outline"
            size="sm"
            onClick={handleModalClose}
            data-testid="admin-modal-close-btn"
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
