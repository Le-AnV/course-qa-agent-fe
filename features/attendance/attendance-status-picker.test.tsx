// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  AttendanceStatusPicker,
  ATTENDANCE_STATUS_OPTIONS,
} from "./attendance-status-picker";

describe("AttendanceStatusPicker Component (Render)", () => {
  it("renders 4 status options matching Backend enum exactly", () => {
    const expectedValues = [
      "present",
      "late",
      "excused_absence",
      "unexcused_absence",
    ];
    const actualValues = ATTENDANCE_STATUS_OPTIONS.map((o) => o.value);
    expect(actualValues).toEqual(expectedValues);
  });

  it("renders all 4 segmented buttons on desktop with correct labels", () => {
    const onChange = vi.fn();
    const html = renderToStaticMarkup(
      <AttendanceStatusPicker value="present" onChange={onChange} studentName="Nguyen Van A" />,
    );

    expect(html).toContain("Present");
    expect(html).toContain("Late");
    expect(html).toContain("Excused");
    expect(html).toContain("Unexcused");
    expect(html).toContain("aria-label=\"Attendance status for Nguyen Van A\"");
  });

  it("marks the active status button as pressed", () => {
    const onChange = vi.fn();
    const html = renderToStaticMarkup(
      <AttendanceStatusPicker value="late" onChange={onChange} />,
    );

    // Late button should have aria-pressed="true"
    expect(html).toContain("aria-pressed=\"true\"");
  });

  it("renders unpressed buttons when value is null (unmarked)", () => {
    const onChange = vi.fn();
    const html = renderToStaticMarkup(
      <AttendanceStatusPicker value={null} onChange={onChange} />,
    );

    expect(html).not.toContain("aria-pressed=\"true\"");
  });

  it("renders buttons as disabled when disabled prop is true (e.g. future or cancelled session)", () => {
    const onChange = vi.fn();
    const html = renderToStaticMarkup(
      <AttendanceStatusPicker value="present" onChange={onChange} disabled={true} />,
    );

    expect(html).toContain("disabled=\"\"");
  });
});

describe("AttendanceStatusPicker Component (Interactions)", () => {
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
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    host.remove();
  });

  it("clicking Late status button calls onChange with 'late'", async () => {
    const onChange = vi.fn();
    await act(async () => {
      root.render(
        <AttendanceStatusPicker value="present" onChange={onChange} studentName="Nguyen Van A" />,
      );
    });

    const buttons = Array.from(host.querySelectorAll("button"));
    const lateBtn = buttons.find((b) => b.textContent?.trim() === "Late");
    expect(lateBtn).not.toBeUndefined();

    await act(async () => {
      lateBtn?.click();
    });

    expect(onChange).toHaveBeenCalledWith("late");
  });

  it("clicking Excused status button calls onChange with 'excused_absence'", async () => {
    const onChange = vi.fn();
    await act(async () => {
      root.render(
        <AttendanceStatusPicker value="present" onChange={onChange} studentName="Nguyen Van A" />,
      );
    });

    const buttons = Array.from(host.querySelectorAll("button"));
    const excusedBtn = buttons.find((b) => b.textContent?.trim() === "Excused");
    expect(excusedBtn).not.toBeUndefined();

    await act(async () => {
      excusedBtn?.click();
    });

    expect(onChange).toHaveBeenCalledWith("excused_absence");
  });

  it("clicking buttons does not call onChange when disabled", async () => {
    const onChange = vi.fn();
    await act(async () => {
      root.render(
        <AttendanceStatusPicker
          value="present"
          onChange={onChange}
          disabled={true}
          studentName="Nguyen Van A"
        />,
      );
    });

    const buttons = Array.from(host.querySelectorAll("button"));
    const unexcusedBtn = buttons.find((b) => b.textContent?.trim() === "Unexcused");
    expect(unexcusedBtn).not.toBeUndefined();

    await act(async () => {
      unexcusedBtn?.click();
    });

    expect(onChange).not.toHaveBeenCalled();
  });
});
