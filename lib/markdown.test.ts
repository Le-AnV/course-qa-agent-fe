import { describe, expect, it } from "vitest";
import { normalizeLegacySchedule } from "./markdown";

describe("normalizeLegacySchedule", () => {
  it("splits legacy one-line values on runs of 3+ spaces", () => {
    expect(
      normalizeLegacySchedule("**Lecture:** Tue 09:00   **Lab:** Thu 13:30   **Location:** Lab 2"),
    ).toBe("**Lecture:** Tue 09:00\n**Lab:** Thu 13:30\n**Location:** Lab 2");
  });

  it("keeps real newlines untouched", () => {
    expect(normalizeLegacySchedule("**Lecture:** Tue\n**Lab:** Thu")).toBe(
      "**Lecture:** Tue\n**Lab:** Thu",
    );
  });

  it("does not split normal single spaces", () => {
    expect(normalizeLegacySchedule("Mon & Wed 19:00-21:00, online")).toBe(
      "Mon & Wed 19:00-21:00, online",
    );
  });

  it("normalizes CRLF and trims the edges", () => {
    expect(normalizeLegacySchedule("  line one\r\nline two  ")).toBe("line one\nline two");
  });

  it("returns an empty string for empty input", () => {
    expect(normalizeLegacySchedule(null)).toBe("");
    expect(normalizeLegacySchedule("   ")).toBe("");
  });
});
