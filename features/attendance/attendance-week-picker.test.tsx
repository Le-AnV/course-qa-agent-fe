// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  parseLocalDate,
  formatLocalDate,
  getMonday,
  getSunday,
  addWeeks,
  formatWeekRange,
  AttendanceWeekPicker,
} from "./attendance-week-picker";

describe("attendance-week-picker date utilities", () => {
  it("parseLocalDate and formatLocalDate are symmetrical and timezone-safe", () => {
    const iso = "2026-11-02";
    const date = parseLocalDate(iso);
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(10); // 0-indexed November
    expect(date.getDate()).toBe(2);
    expect(formatLocalDate(date)).toBe(iso);
  });

  it("getMonday returns the same date when given a Monday", () => {
    // 2026-11-02 is a Monday
    expect(getMonday("2026-11-02")).toBe("2026-11-02");
  });

  it("getMonday returns the preceding Monday when given a mid-week day", () => {
    // 2026-11-05 is a Thursday
    expect(getMonday("2026-11-05")).toBe("2026-11-02");
    // 2026-11-07 is a Saturday
    expect(getMonday("2026-11-07")).toBe("2026-11-02");
  });

  it("getMonday returns the preceding Monday when given a Sunday", () => {
    // 2026-11-08 is a Sunday (end of week 2026-11-02)
    expect(getMonday("2026-11-08")).toBe("2026-11-02");
  });

  it("getMonday correctly spans year boundaries", () => {
    // 2026-01-01 is a Thursday -> Monday was 2025-12-29
    expect(getMonday("2026-01-01")).toBe("2025-12-29");
  });

  it("getSunday returns Monday + 6 days", () => {
    expect(getSunday("2026-11-02")).toBe("2026-11-08");
    // Spanning end of month
    expect(getSunday("2026-10-26")).toBe("2026-11-01");
  });

  it("addWeeks increments and decrements by 7-day multiples", () => {
    expect(addWeeks("2026-11-02", 1)).toBe("2026-11-09");
    expect(addWeeks("2026-11-02", -1)).toBe("2026-10-26");
    expect(addWeeks("2026-11-02", 4)).toBe("2026-11-30");
  });

  it("formatWeekRange formats Mon dd/mm – Sun dd/mm correctly", () => {
    const formatted = formatWeekRange("2026-11-02");
    expect(formatted).toBe("Mon 02/11 – Sun 08/11 (2026)");
  });
});

describe("AttendanceWeekPicker Component (Render)", () => {
  it("renders week range text and navigation buttons", () => {
    const onChange = vi.fn();
    const html = renderToStaticMarkup(
      <AttendanceWeekPicker weekStart="2026-11-02" onChange={onChange} />,
    );

    expect(html).toContain("Mon 02/11 – Sun 08/11 (2026)");
    expect(html).toContain("aria-label=\"Previous week\"");
    expect(html).toContain("aria-label=\"Next week\"");
    expect(html).toContain("Today");
  });

  it("renders disabled state when disabled prop is true", () => {
    const onChange = vi.fn();
    const html = renderToStaticMarkup(
      <AttendanceWeekPicker weekStart="2026-11-02" onChange={onChange} disabled={true} />,
    );

    expect(html).toContain("disabled=\"\"");
  });

  it("displays 'This week' badge when weekStart matches current week", () => {
    const currentMonday = getMonday();
    const onChange = vi.fn();
    const html = renderToStaticMarkup(
      <AttendanceWeekPicker weekStart={currentMonday} onChange={onChange} />,
    );

    expect(html).toContain("This week");
  });
});

describe("AttendanceWeekPicker Component (Interactions)", () => {
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

  it("clicking Previous week calls onChange with week - 1", async () => {
    const onChange = vi.fn();
    await act(async () => {
      root.render(<AttendanceWeekPicker weekStart="2026-11-02" onChange={onChange} />);
    });

    const prevBtn = host.querySelector('button[aria-label="Previous week"]') as HTMLButtonElement;
    expect(prevBtn).not.toBeNull();

    await act(async () => {
      prevBtn.click();
    });

    expect(onChange).toHaveBeenCalledWith("2026-10-26");
  });

  it("clicking Next week calls onChange with week + 1", async () => {
    const onChange = vi.fn();
    await act(async () => {
      root.render(<AttendanceWeekPicker weekStart="2026-11-02" onChange={onChange} />);
    });

    const nextBtn = host.querySelector('button[aria-label="Next week"]') as HTMLButtonElement;
    expect(nextBtn).not.toBeNull();

    await act(async () => {
      nextBtn.click();
    });

    expect(onChange).toHaveBeenCalledWith("2026-11-09");
  });

  it("clicking Today button calls onChange with the current Monday", async () => {
    const onChange = vi.fn();
    // Use an arbitrary past week so Today is enabled
    await act(async () => {
      root.render(<AttendanceWeekPicker weekStart="2020-01-06" onChange={onChange} />);
    });

    const buttons = Array.from(host.querySelectorAll("button"));
    const todayBtn = buttons.find((b) => b.textContent?.trim() === "Today");
    expect(todayBtn).not.toBeUndefined();

    await act(async () => {
      todayBtn?.click();
    });

    expect(onChange).toHaveBeenCalledWith(getMonday());
  });
});
