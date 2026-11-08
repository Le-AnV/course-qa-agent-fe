import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  AttendanceScheduleManager,
  WEEKDAYS,
} from "./attendance-schedule-manager";

describe("AttendanceScheduleManager Component", () => {
  it("defines all 7 weekdays from Monday (0) to Sunday (6)", () => {
    expect(WEEKDAYS).toHaveLength(7);
    expect(WEEKDAYS[0]).toEqual({ value: 0, label: "Monday" });
    expect(WEEKDAYS[6]).toEqual({ value: 6, label: "Sunday" });
  });

  it("renders modal content when isOpen is true", () => {
    const onClose = vi.fn();
    const html = renderToStaticMarkup(
      <AttendanceScheduleManager
        isOpen={true}
        onClose={onClose}
        classId="class-123"
      />,
    );

    expect(html).toContain("Manage Class Schedule");
    expect(html).toContain("Weekly Schedules");
    expect(html).toContain("Add Weekly");
    expect(html).toContain("Add One-off Session");
  });

  it("does not render when isOpen is false", () => {
    const onClose = vi.fn();
    const html = renderToStaticMarkup(
      <AttendanceScheduleManager
        isOpen={false}
        onClose={onClose}
        classId="class-123"
      />,
    );

    expect(html).not.toContain("Manage Class Schedule");
  });
});

