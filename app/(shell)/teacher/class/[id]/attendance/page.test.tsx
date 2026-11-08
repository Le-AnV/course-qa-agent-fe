// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import TeacherAttendancePage from "./page";
import { attendanceApi, type ClassSession, type AttendanceSheet } from "@/lib/attendance-api";

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "11111111-1111-1111-1111-111111111111" }),
}));

describe("TeacherAttendancePage", () => {
  let host: HTMLDivElement;
  let root: Root;

  const mockSessions: ClassSession[] = [
    {
      id: "sess-1",
      class_id: "11111111-1111-1111-1111-111111111111",
      schedule_id: "sched-1",
      date: "2026-11-02",
      start_at: "2026-11-02T08:00:00+07:00",
      end_at: "2026-11-02T10:00:00+07:00",
      trainer_id: "trainer-1",
      trainer_name: "Teacher Nam",
      status: "scheduled",
      note: null,
      student_count: 2,
      marked_count: 2,
    },
  ];

  const mockSheet: AttendanceSheet = {
    session: mockSessions[0],
    records: [
      {
        student_id: "std-1",
        student_code: "ST001",
        full_name: "Nguyen Van A",
        email: "a@student.edu.vn",
        status: "present",
        note: null,
        updated_at: "2026-11-02T09:00:00+07:00",
      },
    ],
    summary: {
      present: 1,
      late: 0,
      excused_absence: 0,
      unexcused_absence: 0,
      unmarked: 0,
    },
  };

  const mockSummary = {
    class_id: "11111111-1111-1111-1111-111111111111",
    date_from: "2026-09-01",
    date_to: "2026-12-31",
    total_sessions: 10,
    students: [
      {
        student_id: "std-1",
        student_code: "ST001",
        full_name: "Nguyen Van A",
        present: 9,
        late: 1,
        excused_absence: 0,
        unexcused_absence: 0,
        unmarked: 0,
        attendance_rate: 100.0,
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

  it("renders loading skeleton initially while waiting for API responses", async () => {
    vi.spyOn(attendanceApi, "listSessions").mockReturnValue(new Promise(() => {}));
    vi.spyOn(attendanceApi, "summary").mockReturnValue(new Promise(() => {}));

    await act(async () => {
      root.render(<TeacherAttendancePage />);
    });

    const skeleton = host.querySelector('[data-testid="attendance-loading-skeleton"]');
    expect(skeleton).not.toBeNull();
  });

  it("renders empty sessions state when week has no sessions", async () => {
    vi.spyOn(attendanceApi, "listSessions").mockResolvedValue([]);
    vi.spyOn(attendanceApi, "summary").mockResolvedValue(mockSummary);

    await act(async () => {
      root.render(<TeacherAttendancePage />);
    });

    const emptyBox = host.querySelector('[data-testid="attendance-empty-sessions"]');
    expect(emptyBox).not.toBeNull();
    expect(host.textContent).toContain("No sessions this week");
  });

  it("renders error state with Retry button when BE fails or connection is refused", async () => {
    vi.spyOn(attendanceApi, "listSessions").mockRejectedValue(new Error("Connection refused"));
    vi.spyOn(attendanceApi, "summary").mockRejectedValue(new Error("Connection refused"));

    await act(async () => {
      root.render(<TeacherAttendancePage />);
    });

    const errorState = host.querySelector('[data-testid="attendance-error-state"]');
    expect(errorState).not.toBeNull();
    expect(host.textContent).toContain("Connection refused");
    expect(host.textContent).toContain("Retry connection");
  });

  it("renders success state with session list, sheet and summary table", async () => {
    vi.spyOn(attendanceApi, "listSessions").mockResolvedValue(mockSessions);
    vi.spyOn(attendanceApi, "getSheet").mockResolvedValue(mockSheet);
    vi.spyOn(attendanceApi, "summary").mockResolvedValue(mockSummary);

    await act(async () => {
      root.render(<TeacherAttendancePage />);
    });

    expect(host.textContent).toContain("Sessions (1)");
    expect(host.textContent).toContain("Nguyen Van A");
    const summaryContainer = host.querySelector('[data-testid="attendance-summary-container"]');
    expect(summaryContainer).not.toBeNull();
  });

  it("renders sheet error alert with retry button when getSheet fails", async () => {
    vi.spyOn(attendanceApi, "listSessions").mockResolvedValue(mockSessions);
    vi.spyOn(attendanceApi, "getSheet").mockRejectedValue(new Error("Network timeout"));
    vi.spyOn(attendanceApi, "summary").mockResolvedValue(mockSummary);

    await act(async () => {
      root.render(<TeacherAttendancePage />);
    });

    expect(host.textContent).toContain("Failed to load attendance sheet");
    expect(host.textContent).toContain("Network timeout");
  });
});
