"use client";

import * as React from "react";
import {
  Calendar,
  Plus,
  Trash2,
  CalendarPlus,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/shared/Modal";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import {
  attendanceApi,
  type ClassSchedule,
  type CreateScheduleBody,
  type CreateSessionBody,
} from "@/lib/attendance-api";

export const WEEKDAYS = [
  { value: 0, label: "Monday" },
  { value: 1, label: "Tuesday" },
  { value: 2, label: "Wednesday" },
  { value: 3, label: "Thursday" },
  { value: 4, label: "Friday" },
  { value: 5, label: "Saturday" },
  { value: 6, label: "Sunday" },
];

function formatTimeOnly(timeStr: string): string {
  if (!timeStr) return "";
  const parts = timeStr.split(":");
  return `${parts[0]}:${parts[1]}`;
}

function formatDateDisplay(isoStr?: string | null): string {
  if (!isoStr) return "—";
  const [y, m, d] = isoStr.split("-");
  return `${d}/${m}/${y}`;
}

export interface AttendanceScheduleManagerProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  onScheduleChanged?: () => void;
}

export function AttendanceScheduleManager({
  isOpen,
  onClose,
  classId,
  onScheduleChanged,
}: AttendanceScheduleManagerProps) {
  const [schedules, setSchedules] = React.useState<ClassSchedule[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Active sub-view: "list" | "create-weekly" | "create-ad-hoc"
  const [view, setView] = React.useState<"list" | "create-weekly" | "create-ad-hoc">("list");

  // Deletion confirm state
  const [deletingSchedule, setDeletingSchedule] = React.useState<ClassSchedule | null>(null);

  // Weekly form state
  const [weekday, setWeekday] = React.useState<number>(0);
  const [startTime, setStartTime] = React.useState<string>("19:00");
  const [endTime, setEndTime] = React.useState<string>("21:00");
  const [effectiveFrom, setEffectiveFrom] = React.useState<string>(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}-01`;
  });
  const [effectiveTo, setEffectiveTo] = React.useState<string>("");
  const [submittingWeekly, setSubmittingWeekly] = React.useState(false);

  // One-off ad-hoc form state
  const [adHocDate, setAdHocDate] = React.useState<string>(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  });
  const [adHocStart, setAdHocStart] = React.useState<string>("19:00");
  const [adHocEnd, setAdHocEnd] = React.useState<string>("21:00");
  const [adHocNote, setAdHocNote] = React.useState<string>("");
  const [submittingAdHoc, setSubmittingAdHoc] = React.useState(false);

  // Load schedules on modal open
  const loadSchedules = React.useCallback(async () => {
    if (!classId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await attendanceApi.listSchedules(classId);
      setSchedules(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load schedules");
    } finally {
      setLoading(false);
    }
  }, [classId]);

  const handleModalClose = React.useCallback(() => {
    setView("list");
    onClose();
  }, [onClose]);

  React.useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on modal open; updates happen after await.
      void loadSchedules();
    }
  }, [isOpen, loadSchedules]);

  // Handle create weekly schedule
  const handleCreateWeekly = async (e: React.FormEvent) => {
    e.preventDefault();
    if (endTime <= startTime) {
      toast.error("End time must be after start time");
      return;
    }
    if (effectiveTo && effectiveTo < effectiveFrom) {
      toast.error("Effective to date must be on or after effective from date");
      return;
    }

    try {
      setSubmittingWeekly(true);
      const payload: CreateScheduleBody = {
        weekday,
        start_time: startTime,
        end_time: endTime,
        effective_from: effectiveFrom,
        effective_to: effectiveTo ? effectiveTo : null,
      };
      await attendanceApi.createSchedule(classId, payload);
      toast.success("Weekly schedule created successfully");
      setView("list");
      void loadSchedules();
      onScheduleChanged?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create schedule");
    } finally {
      setSubmittingWeekly(false);
    }
  };

  // Handle create one-off session
  const handleCreateAdHoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adHocEnd <= adHocStart) {
      toast.error("End time must be after start time");
      return;
    }

    try {
      setSubmittingAdHoc(true);
      const payload: CreateSessionBody = {
        date: adHocDate,
        start_time: adHocStart,
        end_time: adHocEnd,
        note: adHocNote.trim() ? adHocNote.trim() : null,
      };
      await attendanceApi.createSession(classId, payload);
      toast.success("One-off session created successfully");
      setView("list");
      onScheduleChanged?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create session");
    } finally {
      setSubmittingAdHoc(false);
    }
  };

  // Handle delete schedule
  const handleDeleteConfirm = async () => {
    if (!deletingSchedule) return;
    try {
      await attendanceApi.deleteSchedule(classId, deletingSchedule.id);
      toast.success("Schedule template deleted");
      setDeletingSchedule(null);
      void loadSchedules();
      onScheduleChanged?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete schedule");
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleModalClose}
        title="Manage Class Schedule"
        subtitle="Configure weekly recurring class times or add one-off sessions."
        widthClass="max-w-2xl"
      >
        <div className="flex flex-col gap-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Sub-view Navigation */}
          <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-2 overflow-x-auto">
            <div className="flex items-center gap-1 min-w-max">
              <Button
                type="button"
                variant={view === "list" ? "default" : "ghost"}
                size="xs"
                onClick={() => setView("list")}
              >
                Weekly Schedules ({schedules.length})
              </Button>
              <Button
                type="button"
                variant={view === "create-weekly" ? "default" : "ghost"}
                size="xs"
                onClick={() => setView("create-weekly")}
                className="gap-1"
              >
                <Plus className="size-3" />
                Add Weekly
              </Button>
              <Button
                type="button"
                variant={view === "create-ad-hoc" ? "default" : "ghost"}
                size="xs"
                onClick={() => setView("create-ad-hoc")}
                className="gap-1"
              >
                <CalendarPlus className="size-3" />
                Add One-off Session
              </Button>
            </div>
          </div>

          {/* VIEW: Schedules List */}
          {view === "list" && (
            <div className="flex flex-col gap-3">
              {loading ? (
                <div className="flex items-center justify-center p-8 text-[#5A5A5A] gap-2">
                  <Spinner className="size-4" />
                  <span className="text-xs">Loading schedules...</span>
                </div>
              ) : schedules.length === 0 ? (
                <div className="rounded-lg border border-dashed border-[#DADADA] bg-[#FAFAFA] p-8 text-center">
                  <Calendar className="mx-auto size-7 text-[#8C8C8C]" />
                  <h4 className="mt-2 text-xs font-semibold text-[#111111]">
                    No weekly schedule yet
                  </h4>
                  <p className="mt-1 text-[11.5px] text-[#5A5A5A]">
                    Add recurring weekly schedules to automatically generate attendance sessions.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setView("create-weekly")}
                    className="mt-3 gap-1.5 text-xs"
                  >
                    <Plus className="size-3.5" />
                    Add Weekly Schedule
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-md border border-[#E5E5E5]">
                  <table className="w-full text-left text-xs min-w-[480px]">
                    <thead className="border-b border-[#E5E5E5] bg-[#FAFAFA] text-[10.5px] font-semibold uppercase text-[#5A5A5A]">
                      <tr>
                        <th className="py-2 px-3">Weekday</th>
                        <th className="py-2 px-3">Time</th>
                        <th className="py-2 px-3">Effective</th>
                        <th className="py-2 px-3">Trainer</th>
                        <th className="py-2 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0F0F0] bg-white">
                      {schedules.map((s) => {
                        const dayLabel =
                          WEEKDAYS.find((w) => w.value === s.weekday)?.label ?? `Day ${s.weekday}`;
                        return (
                          <tr key={s.id} className="hover:bg-[#FAFAFA] transition-colors">
                            <td className="py-2 px-3 font-semibold text-[#111111]">{dayLabel}</td>
                            <td className="py-2 px-3 text-[#5A5A5A] font-mono">
                              {formatTimeOnly(s.start_time)} – {formatTimeOnly(s.end_time)}
                            </td>
                            <td className="py-2 px-3 text-[#5A5A5A]">
                              {formatDateDisplay(s.effective_from)} →{" "}
                              {s.effective_to ? formatDateDisplay(s.effective_to) : "Ongoing"}
                            </td>
                            <td className="py-2 px-3 text-[#5A5A5A]">
                              {s.trainer_name ?? "Assigned trainer"}
                            </td>
                            <td className="py-2 px-3 text-right">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-xs"
                                onClick={() => setDeletingSchedule(s)}
                                aria-label={`Delete ${dayLabel} schedule`}
                                className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* VIEW: Create Weekly Form */}
          {view === "create-weekly" && (
            <form onSubmit={handleCreateWeekly} className="flex flex-col gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Weekday */}
                <div>
                  <label className="block text-xs font-semibold text-[#5A5A5A] mb-1">
                    Weekday <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={weekday}
                    onChange={(e) => setWeekday(Number(e.target.value))}
                    className="w-full rounded-md border border-[#DADADA] bg-white px-2.5 py-1.5 text-xs text-[#111111] focus:border-[#111111] focus:outline-none"
                  >
                    {WEEKDAYS.map((w) => (
                      <option key={w.value} value={w.value}>
                        {w.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Time Range */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-[#5A5A5A] mb-1">
                      Start Time <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="time"
                      required
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full rounded-md border border-[#DADADA] bg-white px-2 py-1.5 text-xs text-[#111111] focus:border-[#111111] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#5A5A5A] mb-1">
                      End Time <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="time"
                      required
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full rounded-md border border-[#DADADA] bg-white px-2 py-1.5 text-xs text-[#111111] focus:border-[#111111] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Effective From */}
                <div>
                  <label className="block text-xs font-semibold text-[#5A5A5A] mb-1">
                    Effective From <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={effectiveFrom}
                    onChange={(e) => setEffectiveFrom(e.target.value)}
                    className="w-full rounded-md border border-[#DADADA] bg-white px-2.5 py-1.5 text-xs text-[#111111] focus:border-[#111111] focus:outline-none"
                  />
                </div>

                {/* Effective To */}
                <div>
                  <label className="block text-xs font-semibold text-[#5A5A5A] mb-1">
                    Effective To (Optional)
                  </label>
                  <input
                    type="date"
                    value={effectiveTo}
                    onChange={(e) => setEffectiveTo(e.target.value)}
                    className="w-full rounded-md border border-[#DADADA] bg-white px-2.5 py-1.5 text-xs text-[#111111] focus:border-[#111111] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-[#F0F0F0] pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setView("list")}
                  disabled={submittingWeekly}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submittingWeekly}
                  className="gap-1.5"
                >
                  {submittingWeekly && <Spinner className="size-3.5" />}
                  Save Schedule
                </Button>
              </div>
            </form>
          )}

          {/* VIEW: Create One-off Ad-hoc Session Form */}
          {view === "create-ad-hoc" && (
            <form onSubmit={handleCreateAdHoc} className="flex flex-col gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Session Date */}
                <div>
                  <label className="block text-xs font-semibold text-[#5A5A5A] mb-1">
                    Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={adHocDate}
                    onChange={(e) => setAdHocDate(e.target.value)}
                    className="w-full rounded-md border border-[#DADADA] bg-white px-2.5 py-1.5 text-xs text-[#111111] focus:border-[#111111] focus:outline-none"
                  />
                </div>

                {/* Time Range */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-[#5A5A5A] mb-1">
                      Start Time <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="time"
                      required
                      value={adHocStart}
                      onChange={(e) => setAdHocStart(e.target.value)}
                      className="w-full rounded-md border border-[#DADADA] bg-white px-2 py-1.5 text-xs text-[#111111] focus:border-[#111111] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#5A5A5A] mb-1">
                      End Time <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="time"
                      required
                      value={adHocEnd}
                      onChange={(e) => setAdHocEnd(e.target.value)}
                      className="w-full rounded-md border border-[#DADADA] bg-white px-2 py-1.5 text-xs text-[#111111] focus:border-[#111111] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Note */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#5A5A5A] mb-1">
                    Note / Purpose
                  </label>
                  <input
                    type="text"
                    value={adHocNote}
                    onChange={(e) => setAdHocNote(e.target.value)}
                    placeholder="e.g. Makeup session, Exam review"
                    maxLength={255}
                    className="w-full rounded-md border border-[#DADADA] bg-white px-2.5 py-1.5 text-xs text-[#111111] focus:border-[#111111] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-[#F0F0F0] pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setView("list")}
                  disabled={submittingAdHoc}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submittingAdHoc}
                  className="gap-1.5"
                >
                  {submittingAdHoc && <Spinner className="size-3.5" />}
                  Create Session
                </Button>
              </div>
            </form>
          )}
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingSchedule)}
        tone="danger"
        title="Delete Weekly Schedule"
        description="Are you sure you want to delete this weekly schedule template? Existing and past sessions generated from this schedule will not be deleted."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingSchedule(null)}
      />
    </>
  );
}
