// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { AdminAttendanceModal } from "./admin-attendance-modal";
import { attendanceApi, type AttendanceSummary } from "@/lib/attendance-api";
import { getSemesterRange, getMonthRange } from "./attendance-summary-table";

describe("AdminAttendanceModal Component", () => {
  let host: HTMLDivElement;
  let root: Root;

  const mockSummary: AttendanceSummary = {
    class_id: "class-123",
    date_from: "2026-09-01",
    date_to: "2026-12-31",
    total_sessions: 4,
    students: [
      {
        student_id: "std-1",
        student_code: "AS_0001",
        full_name: "Academic Student",
        present: 3,
        late: 1,
        excused_absence: 0,
        unexcused_absence: 0,
        unmarked: 0,
        attendance_rate: 1.0,
      },
      {
        student_id: "std-2",
        student_code: "AS_0002",
        full_name: "Bob Tran",
        present: 1,
        late: 0,
        excused_absence: 1,
        unexcused_absence: 2,
        unmarked: 0,
        attendance_rate: 0.333,
      },
    ],
  };

  beforeEach(() => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    globalThis.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
    if (!Element.prototype.animate) {
      Element.prototype.animate = () =>
        ({
          finished: Promise.resolve(),
          cancel: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
        } as unknown as Animation);
    }
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    vi.restoreAllMocks();
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    host.remove();
  });

  it("does not render modal content and does not call API when isOpen is false", () => {
    const spy = vi.spyOn(attendanceApi, "summary");
    const onClose = vi.fn();

    act(() => {
      root.render(
        <AdminAttendanceModal
          classId="class-123"
          classCode="CS101-FA26-001"
          isOpen={false}
          onClose={onClose}
        />,
      );
    });

    expect(spy).not.toHaveBeenCalled();
    expect(host.querySelector('[data-testid="admin-attendance-modal-content"]')).toBeNull();
  });

  it("renders modal and calls attendanceApi.summary with semester range when opened", async () => {
    const sem = getSemesterRange();
    const spy = vi.spyOn(attendanceApi, "summary").mockResolvedValue(mockSummary);
    const onClose = vi.fn();

    await act(async () => {
      root.render(
        <AdminAttendanceModal
          classId="class-123"
          classCode="CS101-FA26-001"
          className="Computer Science 101"
          isOpen={true}
          onClose={onClose}
        />,
      );
    });

    expect(spy).toHaveBeenCalledWith("class-123", sem.from, sem.to);
    expect(host.textContent).toContain("Attendance Summary — CS101-FA26-001");
    expect(host.textContent).toContain("Computer Science 101");
    expect(host.textContent).toContain("AS_0001");
    expect(host.textContent).toContain("Academic Student");
    expect(host.textContent).toContain("100.0%");
    expect(host.textContent).toContain("AS_0002");
    expect(host.textContent).toContain("Bob Tran");
    expect(host.textContent).toContain("33.3%");
  });

  it("renders loading indicator while fetching API data", async () => {
    vi.spyOn(attendanceApi, "summary").mockReturnValue(new Promise(() => {}));
    const onClose = vi.fn();

    await act(async () => {
      root.render(
        <AdminAttendanceModal
          classId="class-123"
          classCode="CS101-FA26-001"
          isOpen={true}
          onClose={onClose}
        />,
      );
    });

    expect(host.querySelector('[data-testid="attendance-summary-loading"]')).not.toBeNull();
  });

  it("renders error alert and retries when clicking Retry button", async () => {
    const spy = vi
      .spyOn(attendanceApi, "summary")
      .mockRejectedValueOnce(new Error("Database connection failed"))
      .mockResolvedValueOnce(mockSummary);
    const onClose = vi.fn();

    await act(async () => {
      root.render(
        <AdminAttendanceModal
          classId="class-123"
          classCode="CS101-FA26-001"
          isOpen={true}
          onClose={onClose}
        />,
      );
    });

    expect(host.querySelector('[data-testid="attendance-summary-error"]')).not.toBeNull();
    expect(host.textContent).toContain("Database connection failed");

    const retryBtn = host.querySelector(
      '[data-testid="attendance-summary-retry-btn"]',
    ) as HTMLButtonElement;
    expect(retryBtn).not.toBeNull();

    await act(async () => {
      retryBtn.click();
    });

    expect(spy).toHaveBeenCalledTimes(2);
    expect(host.textContent).toContain("Academic Student");
    expect(host.textContent).toContain("100.0%");
  });

  it("switches range to 'This month' and refetches summary", async () => {
    const mon = getMonthRange();
    const spy = vi.spyOn(attendanceApi, "summary").mockResolvedValue(mockSummary);
    const onClose = vi.fn();

    await act(async () => {
      root.render(
        <AdminAttendanceModal
          classId="class-123"
          classCode="CS101-FA26-001"
          isOpen={true}
          onClose={onClose}
        />,
      );
    });

    const monthBtn = Array.from(host.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes("This month"),
    );
    expect(monthBtn).toBeDefined();

    await act(async () => {
      monthBtn?.click();
    });

    expect(spy).toHaveBeenCalledWith("class-123", mon.from, mon.to);
  });

  it("displays empty state when class has no attendance records", async () => {
    vi.spyOn(attendanceApi, "summary").mockResolvedValue({
      class_id: "class-123",
      date_from: "2026-09-01",
      date_to: "2026-12-31",
      total_sessions: 0,
      students: [],
    });
    const onClose = vi.fn();

    await act(async () => {
      root.render(
        <AdminAttendanceModal
          classId="class-123"
          classCode="CS101-FA26-001"
          isOpen={true}
          onClose={onClose}
        />,
      );
    });

    expect(host.querySelector('[data-testid="attendance-summary-empty"]')).not.toBeNull();
    expect(host.textContent).toContain("No attendance records found for this period");
  });

  it("calls onClose when clicking Close button", async () => {
    vi.spyOn(attendanceApi, "summary").mockResolvedValue(mockSummary);
    const onClose = vi.fn();

    await act(async () => {
      root.render(
        <AdminAttendanceModal
          classId="class-123"
          classCode="CS101-FA26-001"
          isOpen={true}
          onClose={onClose}
        />,
      );
    });

    const closeBtn = host.querySelector('[data-testid="admin-modal-close-btn"]') as HTMLButtonElement;
    expect(closeBtn).not.toBeNull();

    await act(async () => {
      closeBtn.click();
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
