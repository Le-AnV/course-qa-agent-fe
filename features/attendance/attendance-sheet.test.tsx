// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  AttendanceSheet,
  formatLastSaved,
  formatDateDisplay,
} from "./attendance-sheet";
import { attendanceApi, type AttendanceSheet as AttendanceSheetType } from "@/lib/attendance-api";

const mockSheet: AttendanceSheetType = {
  session: {
    id: "sess-123",
    class_id: "class-123",
    schedule_id: "sched-123",
    date: "2026-11-02",
    start_at: "2026-11-02T19:00:00+07:00",
    end_at: "2026-11-02T21:00:00+07:00",
    trainer_id: "trainer-1",
    trainer_name: "Academic Trainer",
    status: "scheduled",
    note: null,
    student_count: 2,
    marked_count: 1,
  },
  summary: {
    present: 1,
    late: 0,
    excused_absence: 0,
    unexcused_absence: 0,
    unmarked: 1,
  },
  records: [
    {
      student_id: "stu-1",
      student_code: "AS_0001",
      full_name: "Nguyen Van A",
      email: "vana@academic.edu.vn",
      status: "present",
      note: "On time",
      updated_at: "2026-11-02T19:05:00+07:00",
    },
    {
      student_id: "stu-2",
      student_code: "AS_0002",
      full_name: "Tran Thi B",
      email: "thib@academic.edu.vn",
      status: null,
      note: null,
      updated_at: null,
    },
  ],
};

describe("AttendanceSheet formatting helpers", () => {
  it("formatDateDisplay formats YYYY-MM-DD to DD/MM/YYYY", () => {
    expect(formatDateDisplay("2026-11-02")).toBe("02/11/2026");
  });

  it("formatLastSaved formats ISO timestamp", () => {
    const formatted = formatLastSaved("2026-11-02T19:05:00+07:00");
    expect(formatted).not.toBeNull();
    expect(formatted).toContain("02/11/2026");
  });

  it("formatLastSaved returns null when input is null", () => {
    expect(formatLastSaved(null)).toBeNull();
  });
});

describe("AttendanceSheet Component (Render)", () => {
  it("renders student roster table with code, name, status and note", () => {
    const html = renderToStaticMarkup(
      <AttendanceSheet
        classId="class-123"
        sheet={mockSheet}
        todayOverride="2026-11-02"
      />,
    );

    expect(html).toContain("AS_0001");
    expect(html).toContain("Nguyen Van A");
    expect(html).toContain("AS_0002");
    expect(html).toContain("Tran Thi B");
    expect(html).toContain("On time");
    expect(html).toContain("Mark all present");
    expect(html).toContain("Save attendance");
  });

  it("displays live counters for present, late, absent, unmarked", () => {
    const html = renderToStaticMarkup(
      <AttendanceSheet
        classId="class-123"
        sheet={mockSheet}
        todayOverride="2026-11-02"
      />,
    );

    expect(html).toContain("Present: 1");
    expect(html).toContain("Unmarked: 1");
  });

  it("renders upcoming session alert and disables inputs for future sessions", () => {
    const futureSheet: AttendanceSheetType = {
      ...mockSheet,
      session: {
        ...mockSheet.session,
        date: "2026-11-20",
      },
    };

    const html = renderToStaticMarkup(
      <AttendanceSheet
        classId="class-123"
        sheet={futureSheet}
        todayOverride="2026-11-02"
      />,
    );

    expect(html).toContain("Upcoming Session");
    expect(html).toContain("This session has not started yet");
    expect(html).toContain("disabled=\"\"");
  });

  it("renders cancelled session alert and disables inputs for cancelled sessions", () => {
    const cancelledSheet: AttendanceSheetType = {
      ...mockSheet,
      session: {
        ...mockSheet.session,
        status: "cancelled",
      },
    };

    const html = renderToStaticMarkup(
      <AttendanceSheet
        classId="class-123"
        sheet={cancelledSheet}
        todayOverride="2026-11-02"
      />,
    );

    expect(html).toContain("Session Cancelled");
    expect(html).toContain("This session has been cancelled");
    expect(html).toContain("disabled=\"\"");
  });
});

describe("AttendanceSheet Component (Interactions)", () => {
  let host: HTMLDivElement;
  let root: Root;

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

  it("clicking 'Mark all present' opens confirmation popup and marks all present upon confirm", async () => {
    await act(async () => {
      root.render(
        <AttendanceSheet
          classId="class-123"
          sheet={mockSheet}
          todayOverride="2026-11-02"
        />,
      );
    });

    const markAllBtn = Array.from(host.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Mark all present"),
    );
    expect(markAllBtn).not.toBeUndefined();

    // Clicking 'Mark all present' opens ConfirmDialog
    await act(async () => {
      markAllBtn?.click();
    });

    expect(host.textContent).toContain("Confirm Mark All Present");

    // Click confirm in dialog
    const confirmBtn = Array.from(host.querySelectorAll("button")).find(
      (b) => b.textContent?.trim() === "Mark All Present",
    );
    expect(confirmBtn).not.toBeUndefined();

    await act(async () => {
      confirmBtn?.click();
    });

    expect(host.textContent).toContain("Present: 2");
    expect(host.textContent).toContain("Unmarked: 0");
    const unsavedIndicator = host.querySelector('[data-testid="unsaved-changes-indicator"]');
    expect(unsavedIndicator).not.toBeNull();
  });

  it("changing a student's status opens confirmation popup and updates on confirm", async () => {
    await act(async () => {
      root.render(
        <AttendanceSheet
          classId="class-123"
          sheet={mockSheet}
          todayOverride="2026-11-02"
        />,
      );
    });

    // Student 2 is initially unmarked. Click "Late"
    const lateBtns = Array.from(host.querySelectorAll("button")).filter(
      (b) => b.textContent?.trim() === "Late",
    );
    expect(lateBtns.length).toBeGreaterThan(0);

    await act(async () => {
      lateBtns[1].click(); // second student (Tran Thi B)
    });

    expect(host.textContent).toContain("Confirm Status Change");
    expect(host.textContent).toContain("Tran Thi B");

    // Click confirm in dialog
    const confirmBtn = Array.from(host.querySelectorAll("button")).find(
      (b) => b.textContent?.trim() === "Change Status",
    );
    expect(confirmBtn).not.toBeUndefined();

    await act(async () => {
      confirmBtn?.click();
    });

    expect(host.textContent).toContain("Late: 1");
    expect(host.textContent).toContain("Unmarked: 0");
  });

  it("saving attendance calls attendanceApi.saveSheet and onSheetSaved callback", async () => {
    const onSheetSaved = vi.fn();
    const updatedSheet: AttendanceSheetType = {
      ...mockSheet,
      records: mockSheet.records.map((r) => ({ ...r, status: "present" })),
    };
    const saveSpy = vi.spyOn(attendanceApi, "saveSheet").mockResolvedValue(updatedSheet);

    await act(async () => {
      root.render(
        <AttendanceSheet
          classId="class-123"
          sheet={mockSheet}
          todayOverride="2026-11-02"
          onSheetSaved={onSheetSaved}
        />,
      );
    });

    // Mark all present to trigger dirty state
    const markAllBtn = Array.from(host.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Mark all present"),
    );
    await act(async () => {
      markAllBtn?.click();
    });

    // Confirm dialog
    const confirmBtn = Array.from(host.querySelectorAll("button")).find(
      (b) => b.textContent?.trim() === "Mark All Present",
    );
    await act(async () => {
      confirmBtn?.click();
    });

    const saveBtn = host.querySelector('[data-testid="save-attendance-btn"]') as HTMLButtonElement;
    expect(saveBtn).not.toBeNull();
    expect(saveBtn.disabled).toBe(false);

    await act(async () => {
      saveBtn.click();
    });

    expect(host.textContent).toContain("Confirm Save Attendance");

    // Click confirm in the Save dialog
    const confirmSaveBtn = Array.from(host.querySelectorAll("button")).find(
      (b) => b.textContent?.trim() === "Save Attendance",
    );
    expect(confirmSaveBtn).not.toBeUndefined();

    await act(async () => {
      confirmSaveBtn?.click();
    });

    expect(saveSpy).toHaveBeenCalledWith(
      "class-123",
      "sess-123",
      expect.arrayContaining([
        expect.objectContaining({ student_id: "stu-1", status: "present" }),
        expect.objectContaining({ student_id: "stu-2", status: "present" }),
      ]),
    );
    expect(onSheetSaved).toHaveBeenCalledWith(updatedSheet);
  });
});
