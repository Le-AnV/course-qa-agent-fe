// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import StudentAttendancePage, {
  getMonthRange,
  getCurrentMonth,
  getAdjacentMonth,
  formatAttendanceRate,
} from "./page";
import { attendanceApi, type StudentAttendance } from "@/lib/attendance-api";

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "class-1234-uuid" }),
}));

describe("StudentAttendancePage", () => {
  let host: HTMLDivElement;
  let root: Root;

  const mockAttendanceData: StudentAttendance = {
    class_id: "class-1234-uuid",
    date_from: "2026-11-01",
    date_to: "2026-11-30",
    total_sessions: 2,
    attended: 2,
    attendance_rate: 1.0,
    items: [
      {
        session_id: "sess-1",
        date: "2026-11-02",
        start_at: "2026-11-02T08:00:00+07:00",
        end_at: "2026-11-02T10:00:00+07:00",
        session_status: "scheduled",
        status: "present",
        note: "On time",
        updated_at: "2026-11-02T09:00:00+07:00",
      },
      {
        session_id: "sess-2",
        date: "2026-11-06",
        start_at: "2026-11-06T08:00:00+07:00",
        end_at: "2026-11-06T10:00:00+07:00",
        session_status: "scheduled",
        status: "late",
        note: null,
        updated_at: "2026-11-06T09:00:00+07:00",
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

  it("calculates month range and adjacent months correctly", () => {
    const range = getMonthRange("2026-11");
    expect(range.from).toBe("2026-11-01");
    expect(range.to).toBe("2026-11-30");

    const leapFeb = getMonthRange("2024-02");
    expect(leapFeb.to).toBe("2024-02-29");

    const nonLeapFeb = getMonthRange("2025-02");
    expect(nonLeapFeb.to).toBe("2025-02-28");

    expect(getAdjacentMonth("2026-11", -1)).toBe("2026-10");
    expect(getAdjacentMonth("2026-11", 1)).toBe("2026-12");
    expect(getAdjacentMonth("2026-12", 1)).toBe("2027-01");
    expect(getAdjacentMonth("2026-01", -1)).toBe("2025-12");

    expect(formatAttendanceRate(1.0)).toBe("100.0%");
    expect(formatAttendanceRate(0.855)).toBe("85.5%");
    expect(formatAttendanceRate(null)).toBe("—");
  });

  it("renders loading skeleton initially while waiting for API responses", async () => {
    vi.spyOn(attendanceApi, "myAttendance").mockReturnValue(new Promise(() => {}));

    await act(async () => {
      root.render(<StudentAttendancePage />);
    });

    const skeleton = host.querySelector('[data-testid="attendance-loading-skeleton"]');
    expect(skeleton).not.toBeNull();
  });

  it("calls attendanceApi.myAttendance on mount with current month range", async () => {
    const spy = vi.spyOn(attendanceApi, "myAttendance").mockResolvedValue(mockAttendanceData);

    await act(async () => {
      root.render(<StudentAttendancePage />);
    });

    const currentM = getCurrentMonth();
    const { from, to } = getMonthRange(currentM);

    expect(spy).toHaveBeenCalledWith("class-1234-uuid", from, to);
    expect(host.textContent).toContain("My Attendance");
    expect(host.textContent).toContain("100.0%");
    expect(host.textContent).toContain("Attended Sessions");
    expect(host.textContent).toContain("2");
    expect(host.textContent).toContain("Present");
    expect(host.textContent).toContain("Late");
  });

  it("shows error alert and retries when clicking Retry button", async () => {
    const spy = vi
      .spyOn(attendanceApi, "myAttendance")
      .mockRejectedValueOnce(new Error("Network Error"))
      .mockResolvedValueOnce(mockAttendanceData);

    await act(async () => {
      root.render(<StudentAttendancePage />);
    });

    const errorAlert = host.querySelector('[data-testid="attendance-error-state"]');
    expect(errorAlert).not.toBeNull();
    expect(host.textContent).toContain("Connection Error");
    expect(host.textContent).toContain("Network Error");

    const retryBtn = Array.from(host.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes("Retry"),
    );
    expect(retryBtn).toBeDefined();

    await act(async () => {
      retryBtn?.click();
    });

    expect(spy).toHaveBeenCalledTimes(2);
    expect(host.textContent).toContain("My Attendance");
    expect(host.textContent).toContain("100.0%");
  });

  it("changes month via prev/next buttons and calls attendanceApi.myAttendance", async () => {
    const spy = vi.spyOn(attendanceApi, "myAttendance").mockResolvedValue(mockAttendanceData);

    await act(async () => {
      root.render(<StudentAttendancePage />);
    });

    const prevBtn = host.querySelector('button[aria-label="Previous month"]') as HTMLButtonElement;
    expect(prevBtn).not.toBeNull();

    await act(async () => {
      prevBtn.click();
    });

    expect(spy).toHaveBeenCalledTimes(2);
  });

  it("changes month directly via month select input", async () => {
    const spy = vi.spyOn(attendanceApi, "myAttendance").mockResolvedValue(mockAttendanceData);

    await act(async () => {
      root.render(<StudentAttendancePage />);
    });

    const monthInput = host.querySelector('input[data-testid="month-select-input"]') as HTMLInputElement;
    expect(monthInput).not.toBeNull();

    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value",
    )?.set;

    await act(async () => {
      nativeInputValueSetter?.call(monthInput, "2026-05");
      monthInput.dispatchEvent(new Event("change", { bubbles: true }));
    });

    expect(spy).toHaveBeenCalledWith("class-1234-uuid", "2026-05-01", "2026-05-31");
  });

  it("displays empty state 'No attendance yet' when month has no sessions", async () => {
    vi.spyOn(attendanceApi, "myAttendance").mockResolvedValue({
      class_id: "class-1234-uuid",
      date_from: "2026-11-01",
      date_to: "2026-11-30",
      total_sessions: 0,
      attended: 0,
      attendance_rate: null,
      items: [],
    });

    await act(async () => {
      root.render(<StudentAttendancePage />);
    });

    expect(host.textContent).toContain("No attendance yet");
    expect(host.textContent).toContain("No sessions found for this month");
    expect(host.textContent).toContain("—");
  });
});
