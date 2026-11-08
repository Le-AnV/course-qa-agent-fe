"use client";

import * as React from "react";
import {
  UserCheck,
  Clock,
  AlertCircle,
  Save,
  CheckCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import {
  attendanceApi,
  type AttendanceSheet as AttendanceSheetType,
  type AttendanceStatus,
  type AttendanceRecordUpdate,
} from "@/lib/attendance-api";
import { AttendanceStatusPicker } from "./attendance-status-picker";

export function getTodayVN(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatLastSaved(latestDateStr?: string | null): string | null {
  if (!latestDateStr) return null;
  try {
    const d = new Date(latestDateStr);
    const pad = (n: number) => String(n).padStart(2, "0");
    const hours = pad(d.getHours());
    const mins = pad(d.getMinutes());
    const day = pad(d.getDate());
    const month = pad(d.getMonth() + 1);
    const year = d.getFullYear();
    return `${hours}:${mins} ${day}/${month}/${year}`;
  } catch {
    return latestDateStr;
  }
}

export function formatTimeDisplay(isoDateTimeStr: string): string {
  try {
    const d = new Date(isoDateTimeStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  } catch {
    return isoDateTimeStr;
  }
}

export function formatDateDisplay(isoDateStr: string): string {
  const [y, m, d] = isoDateStr.split("-");
  return `${d}/${m}/${y}`;
}

export function formatStatusLabel(status?: AttendanceStatus | null): string {
  switch (status) {
    case "present":
      return "Present";
    case "late":
      return "Late";
    case "excused_absence":
      return "Excused";
    case "unexcused_absence":
      return "Unexcused";
    default:
      return status ?? "";
  }
}

export interface LocalRecord {
  student_id: string;
  student_code: string | null;
  full_name: string;
  status: AttendanceStatus | null;
  note: string;
}

export interface AttendanceSheetProps {
  classId: string;
  sheet: AttendanceSheetType;
  onSheetSaved?: (updatedSheet: AttendanceSheetType) => void;
  className?: string;
  todayOverride?: string; // For testing
}

export function AttendanceSheet({
  classId,
  sheet,
  onSheetSaved,
  className,
  todayOverride,
}: AttendanceSheetProps) {
  const { session } = sheet;

  // Session state checks (D8 & D9)
  const today = todayOverride ?? getTodayVN();
  const isFuture = session.date > today;
  const isCancelled = session.status === "cancelled";
  const isDisabled = isFuture || isCancelled;

  // Find the latest updated_at among records
  const latestSavedDate = React.useMemo(() => {
    let latest: string | null = null;
    for (const r of sheet.records) {
      if (r.updated_at) {
        if (!latest || new Date(r.updated_at) > new Date(latest)) {
          latest = r.updated_at;
        }
      }
    }
    return latest;
  }, [sheet.records]);

  const [lastSavedText, setLastSavedText] = React.useState<string | null>(() =>
    formatLastSaved(latestSavedDate),
  );

  // Draft local state
  const [records, setRecords] = React.useState<LocalRecord[]>(() =>
    sheet.records.map((r) => ({
      student_id: r.student_id,
      student_code: r.student_code,
      full_name: r.full_name,
      status: r.status,
      note: r.note ?? "",
    })),
  );

  const [saving, setSaving] = React.useState(false);

  // Re-sync draft when sheet changes from outside
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync draft state when new sheet prop lands.
    setRecords(
      sheet.records.map((r) => ({
        student_id: r.student_id,
        student_code: r.student_code,
        full_name: r.full_name,
        status: r.status,
        note: r.note ?? "",
      })),
    );
    setLastSavedText(formatLastSaved(latestSavedDate));
  }, [sheet, latestSavedDate]);

  // Dirty checking
  const isDirty = React.useMemo(() => {
    if (sheet.records.length !== records.length) return true;
    for (let i = 0; i < sheet.records.length; i++) {
      const initial = sheet.records[i];
      const current = records[i];
      if (initial.student_id !== current.student_id) return true;
      if (initial.status !== current.status) return true;
      const initialNote = (initial.note ?? "").trim();
      const currentNote = current.note.trim();
      if (initialNote !== currentNote) return true;
    }
    return false;
  }, [sheet.records, records]);

  // Dynamic status counts based on current draft
  const currentCounts = React.useMemo(() => {
    let present = 0;
    let late = 0;
    let excused = 0;
    let unexcused = 0;
    let unmarked = 0;

    for (const r of records) {
      if (r.status === "present") present++;
      else if (r.status === "late") late++;
      else if (r.status === "excused_absence") excused++;
      else if (r.status === "unexcused_absence") unexcused++;
      else unmarked++;
    }

    return { present, late, excused, unexcused, unmarked, total: records.length };
  }, [records]);

  // Confirm dialogs
  const [confirmMarkAllOpen, setConfirmMarkAllOpen] = React.useState(false);
  const [confirmSaveOpen, setConfirmSaveOpen] = React.useState(false);
  const [pendingStatusChange, setPendingStatusChange] = React.useState<{
    studentId: string;
    studentName: string;
    newStatus: AttendanceStatus;
  } | null>(null);

  // Status changer for single student
  const handleRequestStatusChange = (
    studentId: string,
    studentName: string,
    currentStatus: AttendanceStatus | null,
    newStatus: AttendanceStatus,
  ) => {
    if (isDisabled || saving) return;
    if (currentStatus === newStatus) return;
    setPendingStatusChange({
      studentId,
      studentName,
      newStatus,
    });
  };

  const handleConfirmStatusChange = () => {
    if (pendingStatusChange) {
      setRecords((prev) =>
        prev.map((r) =>
          r.student_id === pendingStatusChange.studentId
            ? { ...r, status: pendingStatusChange.newStatus }
            : r,
        ),
      );
    }
    setPendingStatusChange(null);
  };

  // Note changer for single student
  const handleNoteChange = (studentId: string, note: string) => {
    if (isDisabled) return;
    setRecords((prev) =>
      prev.map((r) => (r.student_id === studentId ? { ...r, note } : r)),
    );
  };

  // Mark all present trigger
  const handleMarkAllPresentClick = () => {
    if (isDisabled || saving) return;
    setConfirmMarkAllOpen(true);
  };

  const handleConfirmMarkAll = () => {
    setRecords((prev) => prev.map((r) => ({ ...r, status: "present" })));
    setConfirmMarkAllOpen(false);
  };

  // Save attendance
  const handleSave = async () => {
    if (isDisabled || saving || !isDirty) return;

    // Filter students with non-null status
    const updates: AttendanceRecordUpdate[] = records
      .filter((r): r is LocalRecord & { status: AttendanceStatus } => r.status !== null)
      .map((r) => ({
        student_id: r.student_id,
        status: r.status,
        note: r.note.trim() ? r.note.trim() : null,
      }));

    if (updates.length === 0) {
      toast.error("Please mark attendance for at least one student before saving.");
      return;
    }

    try {
      setSaving(true);
      const updatedSheet = await attendanceApi.saveSheet(classId, session.id, updates);
      toast.success("Attendance saved successfully");
      setLastSavedText(formatLastSaved(new Date().toISOString()));
      if (onSheetSaved) {
        onSheetSaved(updatedSheet);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  // Save attendance confirmation trigger
  const handleSaveClick = () => {
    if (isDisabled || saving || !isDirty) return;
    const hasMarked = records.some((r) => r.status !== null);
    if (!hasMarked) {
      toast.error("Please mark attendance for at least one student before saving.");
      return;
    }
    setConfirmSaveOpen(true);
  };

  const handleConfirmSave = async () => {
    setConfirmSaveOpen(false);
    await handleSave();
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-lg border border-[#E5E5E5] bg-white p-4 shadow-xs",
        className,
      )}
      data-testid="attendance-sheet-container"
    >
      {/* Session Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0F0F0] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-[#111111]">
              Session: {formatDateDisplay(session.date)}
            </h3>
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ${
                session.status === "scheduled"
                  ? "bg-blue-50 text-blue-700"
                  : session.status === "cancelled"
                  ? "bg-red-50 text-red-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              {session.status}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-[#5A5A5A]">
            Time: {formatTimeDisplay(session.start_at)} – {formatTimeDisplay(session.end_at)}
            {session.trainer_name ? ` · Trainer: ${session.trainer_name}` : ""}
          </p>
        </div>

        {/* Live Counters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 font-medium text-emerald-800">
            <UserCheck className="size-3 text-emerald-600" />
            Present: {currentCounts.present}
          </span>
          <span className="rounded-md bg-amber-50 px-2 py-0.5 font-medium text-amber-800">
            Late: {currentCounts.late}
          </span>
          <span className="rounded-md bg-rose-50 px-2 py-0.5 font-medium text-rose-800">
            Absent: {currentCounts.excused + currentCounts.unexcused}
          </span>
          <span className="rounded-md bg-gray-100 px-2 py-0.5 font-medium text-gray-700">
            Unmarked: {currentCounts.unmarked}
          </span>
        </div>
      </div>

      {/* Banner for Future / Cancelled Session */}
      {isCancelled && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Session Cancelled</AlertTitle>
          <AlertDescription>
            This session has been cancelled. Attendance records cannot be taken or modified.
          </AlertDescription>
        </Alert>
      )}

      {isFuture && (
        <Alert>
          <Clock className="size-4" />
          <AlertTitle>Upcoming Session</AlertTitle>
          <AlertDescription>
            This session has not started yet. Attendance can only be recorded on or after the session date.
          </AlertDescription>
        </Alert>
      )}

      {/* Controls Bar: Mark all present */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs font-semibold text-[#5A5A5A]">
          Students ({records.length})
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleMarkAllPresentClick}
          disabled={isDisabled || saving}
          className="gap-1.5 text-xs font-medium"
        >
          <CheckCheck className="size-3.5 text-emerald-600" />
          Mark all present
        </Button>
      </div>

      {/* Student Roster Table */}
      <div className="overflow-x-auto rounded-md border border-[#E5E5E5]">
        <table className="w-full text-left text-xs min-w-[620px]">
          <thead className="border-b border-[#E5E5E5] bg-[#FAFAFA] text-[10.5px] font-semibold uppercase text-[#5A5A5A]">
            <tr>
              <th className="py-2.5 px-3 w-10 text-center">#</th>
              <th className="py-2.5 px-3 w-28">Student Code</th>
              <th className="py-2.5 px-3 min-w-[150px]">Full Name</th>
              <th className="py-2.5 px-3 min-w-[280px]">Status</th>
              <th className="py-2.5 px-3 min-w-[180px]">Note</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0F0F0] bg-white">
            {records.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-xs text-[#8C8C8C]">
                  No enrolled students found in this class.
                </td>
              </tr>
            ) : (
              records.map((rec, idx) => (
                <tr key={rec.student_id} className="hover:bg-[#FAFAFA] transition-colors">
                  <td className="py-2.5 px-3 text-center text-[#8C8C8C]">{idx + 1}</td>
                  <td className="py-2.5 px-3 font-mono font-medium text-[#111111]">
                    {rec.student_code ?? "—"}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-[#111111]">
                    {rec.full_name}
                  </td>
                  <td className="py-2 px-3">
                    <AttendanceStatusPicker
                      value={rec.status}
                      onChange={(status) =>
                        handleRequestStatusChange(rec.student_id, rec.full_name, rec.status, status)
                      }
                      disabled={isDisabled || saving}
                      studentName={rec.full_name}
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={rec.note}
                      disabled={isDisabled || saving}
                      onChange={(e) => handleNoteChange(rec.student_id, e.target.value)}
                      placeholder="Optional note"
                      maxLength={500}
                      aria-label={`Note for ${rec.full_name}`}
                      className="w-full rounded-md border border-[#E5E5E5] bg-white px-2.5 py-1 text-xs text-[#111111] placeholder:text-[#8C8C8C] focus:border-[#111111] focus:outline-none disabled:bg-[#F7F7F7] disabled:text-[#8C8C8C]"
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Sheet Footer: Last Saved & Save Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#F0F0F0] pt-3">
        <div className="flex items-center gap-3 text-xs">
          {lastSavedText && (
            <span className="text-[#5A5A5A]" data-testid="last-saved-time">
              Last saved: {lastSavedText}
            </span>
          )}
          {isDirty && (
            <span
              className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700"
              data-testid="unsaved-changes-indicator"
            >
              ● Unsaved changes
            </span>
          )}
        </div>

        <Button
          type="button"
          size="sm"
          onClick={handleSaveClick}
          disabled={!isDirty || isDisabled || saving}
          className="gap-1.5"
          data-testid="save-attendance-btn"
        >
          {saving ? <Spinner className="size-3.5" /> : <Save className="size-3.5" />}
          {saving ? "Saving..." : "Save attendance"}
        </Button>
      </div>

      {/* Confirmation Dialog: Save Attendance */}
      <ConfirmDialog
        isOpen={confirmSaveOpen}
        title="Confirm Save Attendance"
        description={
          <span>
            Are you sure you want to save attendance for session on{" "}
            <strong className="text-[#111111]">{formatDateDisplay(session.date)}</strong>?
            <span className="block mt-1 text-xs text-[#5A5A5A]">
              ({currentCounts.present} present, {currentCounts.late} late, {currentCounts.excused + currentCounts.unexcused} absent, {currentCounts.unmarked} unmarked)
            </span>
          </span>
        }
        confirmLabel="Save Attendance"
        cancelLabel="Cancel"
        onConfirm={handleConfirmSave}
        onCancel={() => setConfirmSaveOpen(false)}
      />

      {/* Confirmation Dialog: Mark All Present */}
      <ConfirmDialog
        isOpen={confirmMarkAllOpen}
        title="Confirm Mark All Present"
        description="Are you sure you want to mark all students in this session as Present?"
        confirmLabel="Mark All Present"
        cancelLabel="Cancel"
        onConfirm={handleConfirmMarkAll}
        onCancel={() => setConfirmMarkAllOpen(false)}
      />

      {/* Confirmation Dialog: Single Student Status Change */}
      <ConfirmDialog
        isOpen={pendingStatusChange !== null}
        title="Confirm Status Change"
        description={
          pendingStatusChange ? (
            <span>
              Are you sure you want to change attendance status for{" "}
              <strong className="text-[#111111]">{pendingStatusChange.studentName}</strong> to{" "}
              <strong className="text-[#111111]">
                {formatStatusLabel(pendingStatusChange.newStatus)}
              </strong>
              ?
            </span>
          ) : (
            ""
          )
        }
        confirmLabel="Change Status"
        cancelLabel="Cancel"
        onConfirm={handleConfirmStatusChange}
        onCancel={() => setPendingStatusChange(null)}
      />
    </div>
  );
}
