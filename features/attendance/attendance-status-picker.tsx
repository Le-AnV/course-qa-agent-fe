"use client";

import * as React from "react";
import { Check, Clock, ShieldCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppSelect, type AppSelectOption } from "@/components/ui/app-select";
import type { AttendanceStatus } from "@/lib/attendance-api";

export interface AttendanceOption {
  value: AttendanceStatus;
  label: string;
  shortLabel: string;
  activeClassName: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const ATTENDANCE_STATUS_OPTIONS: AttendanceOption[] = [
  {
    value: "present",
    label: "Present",
    shortLabel: "Present",
    activeClassName: "bg-emerald-600 text-white border-emerald-600 shadow-xs",
    icon: Check,
  },
  {
    value: "late",
    label: "Late",
    shortLabel: "Late",
    activeClassName: "bg-amber-500 text-white border-amber-500 shadow-xs",
    icon: Clock,
  },
  {
    value: "excused_absence",
    label: "Absent (excused)",
    shortLabel: "Excused",
    activeClassName: "bg-blue-600 text-white border-blue-600 shadow-xs",
    icon: ShieldCheck,
  },
  {
    value: "unexcused_absence",
    label: "Absent (unexcused)",
    shortLabel: "Unexcused",
    activeClassName: "bg-rose-600 text-white border-rose-600 shadow-xs",
    icon: X,
  },
];

export interface AttendanceStatusPickerProps {
  value: AttendanceStatus | null;
  onChange: (value: AttendanceStatus) => void;
  disabled?: boolean;
  className?: string;
  studentName?: string;
}

export function AttendanceStatusPicker({
  value,
  onChange,
  disabled = false,
  className,
  studentName,
}: AttendanceStatusPickerProps) {
  const selectOptions = React.useMemo<AppSelectOption[]>(() => {
    const list: AppSelectOption[] = [];
    if (!value) {
      list.push({ value: "", label: "Not marked", disabled: true });
    }
    for (const opt of ATTENDANCE_STATUS_OPTIONS) {
      const Icon = opt.icon;
      list.push({
        value: opt.value,
        label: opt.label,
        icon: <Icon className="size-3.5" />,
      });
    }
    return list;
  }, [value]);

  return (
    <div className={cn("inline-flex items-center", className)}>
      {/* Desktop View: Segmented Button Control */}
      <div
        role="group"
        aria-label={`Attendance status${studentName ? ` for ${studentName}` : ""}`}
        className="hidden sm:inline-flex items-center rounded-lg border border-[#E5E5E5] bg-[#F7F7F7] p-0.5 shadow-2xs gap-0.5"
      >
        {ATTENDANCE_STATUS_OPTIONS.map((opt) => {
          const isActive = value === opt.value;
          const Icon = opt.icon;
          return (
            <button
              key={opt.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(opt.value)}
              aria-label={`${opt.label}${studentName ? ` for ${studentName}` : ""}`}
              aria-pressed={isActive}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-all select-none",
                isActive
                  ? opt.activeClassName
                  : "border border-transparent text-[#5A5A5A] hover:bg-white hover:text-[#111111] hover:shadow-2xs",
                disabled && "opacity-50 cursor-not-allowed hover:bg-transparent hover:text-[#5A5A5A]",
              )}
            >
              <Icon className="size-3.5 shrink-0" />
              <span>{opt.shortLabel}</span>
            </button>
          );
        })}
      </div>

      {/* Mobile View: AppSelect Dropdown */}
      <div className="block sm:hidden w-full min-w-[130px]">
        <AppSelect
          value={value ?? ""}
          onValueChange={(val) => {
            if (val) onChange(val as AttendanceStatus);
          }}
          disabled={disabled}
          options={selectOptions}
          size="xs"
          placeholder="Status"
          aria-label={`Select status${studentName ? ` for ${studentName}` : ""}`}
        />
      </div>
    </div>
  );
}

