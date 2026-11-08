import { describe, expect, it } from "vitest";
import {
  attemptStatusLabel,
  formatDateTime,
  formatPercentage,
  formatScore,
  passRateHint,
  questionTypeLabel,
} from "./quiz-result-format";

describe("quiz result formatting", () => {
  it("trims scores to at most two decimals without losing integers", () => {
    expect(formatScore(6)).toBe("6");
    expect(formatScore(5.25)).toBe("5.25");
    expect(formatScore(6.5)).toBe("6.5");
    expect(formatScore(0)).toBe("0");
    expect(formatScore(null)).toBe("—");
    expect(formatScore(undefined)).toBe("—");
  });

  it("formats percentages as 0–100 values", () => {
    expect(formatPercentage(87.5)).toBe("87.5%");
    expect(formatPercentage(100)).toBe("100%");
    expect(formatPercentage(null)).toBe("—");
  });

  it("falls back for missing or invalid dates", () => {
    expect(formatDateTime(null)).toBe("—");
    expect(formatDateTime(undefined)).toBe("—");
    expect(formatDateTime("not-a-date")).toBe("—");
    expect(formatDateTime("2026-11-05T08:00:00Z")).not.toBe("—");
  });

  it("labels question types and attempt statuses", () => {
    expect(questionTypeLabel("SINGLE_CHOICE")).toBe("Single choice");
    expect(questionTypeLabel("MULTIPLE_CHOICE")).toBe("Multiple choice");
    expect(questionTypeLabel("FILL_IN_BLANK")).toBe("Fill in blank");
    expect(attemptStatusLabel("IN_PROGRESS")).toBe("In progress");
    expect(attemptStatusLabel("SUBMITTED")).toBe("Submitted");
    expect(attemptStatusLabel("EXPIRED")).toBe("Expired");
  });

  it("describes the pass rate with the right plural", () => {
    expect(passRateHint(2, 3)).toBe("2 of 3 students passed");
    expect(passRateHint(1, 1)).toBe("1 of 1 student passed");
    expect(passRateHint(0, 0)).toBe("No official attempts yet");
  });
});
