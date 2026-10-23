import { describe, expect, it } from "vitest";
import { semesterDateRange } from "./semester";

describe("semesterDateRange", () => {
  it("maps Fall to September-December of the academic year", () => {
    expect(semesterDateRange("Fall", "2026")).toBe("01/09/2026 – 31/12/2026");
  });

  it("maps Spring to January-April of the academic year", () => {
    expect(semesterDateRange("Spring", "2026")).toBe("01/01/2026 – 30/04/2026");
  });

  it("maps Summer to May-August of the academic year", () => {
    expect(semesterDateRange("Summer", "2026")).toBe("01/05/2026 – 31/08/2026");
  });

  it("omits the year when the academic year is not four digits", () => {
    expect(semesterDateRange("Fall", "")).toBe("01/09 – 31/12");
  });

  it("returns null for an unknown semester", () => {
    expect(semesterDateRange("Winter", "2026")).toBeNull();
  });
});
