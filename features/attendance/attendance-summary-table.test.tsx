// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  AttendanceSummaryTable,
  formatAttendanceRate,
  getMonthRange,
  getSemesterRange,
} from "./attendance-summary-table";
import type { AttendanceSummaryRow } from "@/lib/attendance-api";

const mockSummaryRows: AttendanceSummaryRow[] = [
  {
    student_id: "stu-1",
    student_code: "AS_0001",
    full_name: "Alice Nguyen",
    present: 8,
    late: 1,
    excused_absence: 1,
    unexcused_absence: 0,
    unmarked: 0,
    attendance_rate: 90.0,
  },
  {
    student_id: "stu-2",
    student_code: "AS_0002",
    full_name: "Bob Tran",
    present: 4,
    late: 0,
    excused_absence: 2,
    unexcused_absence: 4,
    unmarked: 0,
    attendance_rate: 40.0,
  },
  {
    student_id: "stu-3",
    student_code: "AS_0003",
    full_name: "Charlie Le",
    present: 0,
    late: 0,
    excused_absence: 0,
    unexcused_absence: 0,
    unmarked: 10,
    attendance_rate: null, // No countable sessions
  },
];

describe("AttendanceSummaryTable helpers", () => {
  it("formatAttendanceRate formats float to 1 decimal place with %", () => {
    expect(formatAttendanceRate(85.55)).toBe("85.5%");
    expect(formatAttendanceRate(100)).toBe("100.0%");
    expect(formatAttendanceRate(0)).toBe("0.0%");
    expect(formatAttendanceRate(1.0)).toBe("100.0%");
    expect(formatAttendanceRate(0.875)).toBe("87.5%");
  });

  it("formatAttendanceRate returns em dash for null or undefined rate (D12)", () => {
    expect(formatAttendanceRate(null)).toBe("—");
    expect(formatAttendanceRate(undefined)).toBe("—");
  });

  it("getMonthRange returns first and last day of current month in YYYY-MM-DD", () => {
    const range = getMonthRange(new Date(2026, 10, 5)); // Nov 5, 2026
    expect(range.from).toBe("2026-11-01");
    expect(range.to).toBe("2026-11-30");
  });

  it("getSemesterRange computes semester boundaries", () => {
    const spring = getSemesterRange(new Date(2026, 2, 1)); // March -> Spring
    expect(spring.semesterName).toBe("Spring");
    expect(spring.from).toBe("2026-01-01");
    expect(spring.to).toBe("2026-04-30");

    const fall = getSemesterRange(new Date(2026, 10, 1)); // November -> Fall
    expect(fall.semesterName).toBe("Fall");
    expect(fall.from).toBe("2026-09-01");
    expect(fall.to).toBe("2026-12-31");
  });
});

describe("AttendanceSummaryTable Component (Render)", () => {
  it("renders table headers and student rows with rates", () => {
    const html = renderToStaticMarkup(
      <AttendanceSummaryTable rows={mockSummaryRows} totalSessions={10} />,
    );

    expect(html).toContain("Attendance Summary");
    expect(html).toContain("10 sessions");
    expect(html).toContain("AS_0001");
    expect(html).toContain("Alice Nguyen");
    expect(html).toContain("90.0%");
    expect(html).toContain("AS_0002");
    expect(html).toContain("Bob Tran");
    expect(html).toContain("40.0%");
    expect(html).toContain("AS_0003");
    expect(html).toContain("Charlie Le");
    expect(html).toContain("—");
  });

  it("renders range toggle buttons (This semester, This month, Custom)", () => {
    const html = renderToStaticMarkup(
      <AttendanceSummaryTable rows={mockSummaryRows} range="semester" />,
    );

    expect(html).toContain("This semester");
    expect(html).toContain("This month");
    expect(html).toContain("Custom");
  });

  it("renders empty state message when rows array is empty", () => {
    const html = renderToStaticMarkup(
      <AttendanceSummaryTable rows={[]} totalSessions={0} />,
    );

    expect(html).toContain("No attendance records found for this period");
  });
});

describe("AttendanceSummaryTable Component (Interactions)", () => {
  let host: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    host.remove();
  });

  it("clicking 'This month' filter calls onRangeChange with 'month' and date range", async () => {
    const onRangeChange = vi.fn();
    await act(async () => {
      root.render(
        <AttendanceSummaryTable
          rows={mockSummaryRows}
          range="semester"
          onRangeChange={onRangeChange}
        />,
      );
    });

    const monthBtn = Array.from(host.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("This month"),
    );
    expect(monthBtn).not.toBeUndefined();

    await act(async () => {
      monthBtn?.click();
    });

    expect(onRangeChange).toHaveBeenCalledWith("month", expect.any(String), expect.any(String));
  });

  it("clicking 'This semester' filter calls onRangeChange with 'semester' and date range", async () => {
    const onRangeChange = vi.fn();
    await act(async () => {
      root.render(
        <AttendanceSummaryTable
          rows={mockSummaryRows}
          range="month"
          onRangeChange={onRangeChange}
        />,
      );
    });

    const semBtn = Array.from(host.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("This semester"),
    );
    expect(semBtn).not.toBeUndefined();

    await act(async () => {
      semBtn?.click();
    });

    expect(onRangeChange).toHaveBeenCalledWith("semester", expect.any(String), expect.any(String));
  });

  it("renders error message and retry button when error prop is provided", async () => {
    const onRetry = vi.fn();
    await act(async () => {
      root.render(
        <AttendanceSummaryTable
          rows={[]}
          error="Failed to load summary"
          onRetry={onRetry}
        />,
      );
    });

    expect(host.textContent).toContain("Failed to load summary");
    const retryBtn = Array.from(host.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Retry"),
    );
    expect(retryBtn).not.toBeUndefined();

    await act(async () => {
      retryBtn?.click();
    });

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
