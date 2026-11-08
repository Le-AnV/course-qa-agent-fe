// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  StudentAttendanceHistory,
  AttendanceStatusChip,
  formatAttendanceRate,
  formatDisplayDate,
  formatTimeRange,
} from "./student-attendance-history";
import type { StudentAttendance } from "@/lib/attendance-api";

describe("StudentAttendanceHistory Helpers", () => {
  it("formatAttendanceRate formats fraction and float rates to 1 decimal place with %", () => {
    expect(formatAttendanceRate(1.0)).toBe("100.0%");
    expect(formatAttendanceRate(0.855)).toBe("85.5%");
    expect(formatAttendanceRate(0)).toBe("0.0%");
    expect(formatAttendanceRate(75.5)).toBe("75.5%");
  });

  it("formatAttendanceRate returns em dash for null or undefined rate", () => {
    expect(formatAttendanceRate(null)).toBe("—");
    expect(formatAttendanceRate(undefined)).toBe("—");
  });

  it("formatDisplayDate formats ISO date string YYYY-MM-DD into DD/MM/YYYY", () => {
    expect(formatDisplayDate("2026-11-06")).toBe("06/11/2026");
    expect(formatDisplayDate("invalid-date")).toBe("invalid-date");
  });

  it("formatTimeRange formats start and end ISO strings into HH:mm – HH:mm", () => {
    const res = formatTimeRange("2026-11-06T19:00:00+07:00", "2026-11-06T21:00:00+07:00");
    expect(res).toContain("–");
    expect(formatTimeRange("invalid", "invalid")).toBe("");
  });
});

describe("AttendanceStatusChip", () => {
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

  it("renders Present chip with icon and label", () => {
    act(() => {
      root.render(<AttendanceStatusChip status="present" />);
    });
    expect(host.querySelector('[data-testid="status-chip-present"]')).not.toBeNull();
    expect(host.textContent).toContain("Present");
  });

  it("renders Late chip with icon and label", () => {
    act(() => {
      root.render(<AttendanceStatusChip status="late" />);
    });
    expect(host.querySelector('[data-testid="status-chip-late"]')).not.toBeNull();
    expect(host.textContent).toContain("Late");
  });

  it("renders Excused chip with icon and label", () => {
    act(() => {
      root.render(<AttendanceStatusChip status="excused_absence" />);
    });
    expect(host.querySelector('[data-testid="status-chip-excused"]')).not.toBeNull();
    expect(host.textContent).toContain("Excused");
  });

  it("renders Unexcused chip with icon and label", () => {
    act(() => {
      root.render(<AttendanceStatusChip status="unexcused_absence" />);
    });
    expect(host.querySelector('[data-testid="status-chip-unexcused"]')).not.toBeNull();
    expect(host.textContent).toContain("Unexcused");
  });

  it("renders Not marked chip when status is null without crashing", () => {
    act(() => {
      root.render(<AttendanceStatusChip status={null} />);
    });
    expect(host.querySelector('[data-testid="status-chip-unmarked"]')).not.toBeNull();
    expect(host.textContent).toContain("Not marked");
  });
});

describe("StudentAttendanceHistory Component", () => {
  let host: HTMLDivElement;
  let root: Root;

  const mockData: StudentAttendance = {
    class_id: "class-1",
    date_from: "2026-11-01",
    date_to: "2026-11-30",
    total_sessions: 5,
    attended: 3,
    attendance_rate: 0.75,
    items: [
      {
        session_id: "s-1",
        date: "2026-11-02",
        start_at: "2026-11-02T19:00:00+07:00",
        end_at: "2026-11-02T21:00:00+07:00",
        session_status: "scheduled",
        status: "present",
        note: "Attended on time",
        updated_at: "2026-11-02T20:00:00+07:00",
      },
      {
        session_id: "s-2",
        date: "2026-11-04",
        start_at: "2026-11-04T19:00:00+07:00",
        end_at: "2026-11-04T21:00:00+07:00",
        session_status: "scheduled",
        status: "late",
        note: "Traffic jam",
        updated_at: "2026-11-04T20:00:00+07:00",
      },
      {
        session_id: "s-3",
        date: "2026-11-06",
        start_at: "2026-11-06T19:00:00+07:00",
        end_at: "2026-11-06T21:00:00+07:00",
        session_status: "scheduled",
        status: "excused_absence",
        note: "Doctor appointment",
        updated_at: "2026-11-06T20:00:00+07:00",
      },
      {
        session_id: "s-4",
        date: "2026-11-09",
        start_at: "2026-11-09T19:00:00+07:00",
        end_at: "2026-11-09T21:00:00+07:00",
        session_status: "scheduled",
        status: "unexcused_absence",
        note: null,
        updated_at: "2026-11-09T20:00:00+07:00",
      },
      {
        session_id: "s-5",
        date: "2026-11-11",
        start_at: "2026-11-11T19:00:00+07:00",
        end_at: "2026-11-11T21:00:00+07:00",
        session_status: "scheduled",
        status: null,
        note: null,
        updated_at: null,
      },
    ],
  };

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

  it("renders metric cards with correct values and rate", () => {
    act(() => {
      root.render(<StudentAttendanceHistory data={mockData} />);
    });

    const rateCard = host.querySelector('[data-testid="metric-attendance-rate"]');
    expect(rateCard?.textContent).toContain("75.0%");

    const attendedCard = host.querySelector('[data-testid="metric-attended-sessions"]');
    expect(attendedCard?.textContent).toContain("3");
    expect(attendedCard?.textContent).toContain("/ 5 sessions");

    const totalCard = host.querySelector('[data-testid="metric-total-sessions"]');
    expect(totalCard?.textContent).toContain("5");
  });

  it("calculates and displays status breakdown counts correctly", () => {
    act(() => {
      root.render(<StudentAttendanceHistory data={mockData} />);
    });

    const breakdownRow = host.querySelector('[data-testid="status-breakdown-row"]');
    expect(breakdownRow).not.toBeNull();
    expect(breakdownRow?.textContent).toContain("Present: 1");
    expect(breakdownRow?.textContent).toContain("Late: 1");
    expect(breakdownRow?.textContent).toContain("Excused: 1");
    expect(breakdownRow?.textContent).toContain("Unexcused: 1");
    expect(breakdownRow?.textContent).toContain("Not marked: 1");
  });

  it("renders all session rows with formatted dates, times, chips, and notes", () => {
    act(() => {
      root.render(<StudentAttendanceHistory data={mockData} />);
    });

    expect(host.querySelector('[data-testid="session-row-s-1"]')).not.toBeNull();
    expect(host.querySelector('[data-testid="session-row-s-2"]')).not.toBeNull();
    expect(host.querySelector('[data-testid="session-row-s-3"]')).not.toBeNull();
    expect(host.querySelector('[data-testid="session-row-s-4"]')).not.toBeNull();
    expect(host.querySelector('[data-testid="session-row-s-5"]')).not.toBeNull();

    expect(host.textContent).toContain("02/11/2026");
    expect(host.textContent).toContain("Attended on time");
    expect(host.textContent).toContain("Traffic jam");
    expect(host.textContent).toContain("Doctor appointment");
  });

  it("displays empty notice when data has 0 sessions", () => {
    const emptyData: StudentAttendance = {
      class_id: "class-1",
      date_from: "2026-11-01",
      date_to: "2026-11-30",
      total_sessions: 0,
      attended: 0,
      attendance_rate: null,
      items: [],
    };

    act(() => {
      root.render(<StudentAttendanceHistory data={emptyData} />);
    });

    const emptyNotice = host.querySelector('[data-testid="empty-sessions-notice"]');
    expect(emptyNotice).not.toBeNull();
    expect(emptyNotice?.textContent).toContain("No attendance yet");
    expect(emptyNotice?.textContent).toContain("No sessions found for this month");
  });
});
