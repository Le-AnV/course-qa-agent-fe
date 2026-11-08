import { describe, expect, it } from "vitest";
import {
  answeredCount,
  availabilityLabel,
  formatDuration,
  formatWindow,
  fromDateTimeLocal,
  isAnswered,
  remainingSeconds,
  serverClockOffset,
  toDateTimeLocal,
} from "@/features/quizzes/quiz-take-utils";

describe("quiz-take-utils", () => {
  it("formats a countdown without overflowing minutes", () => {
    expect(formatDuration(null)).toBe("No limit");
    expect(formatDuration(0)).toBe("00:00");
    expect(formatDuration(65)).toBe("01:05");
    expect(formatDuration(3661)).toBe("1:01:01");
    expect(formatDuration(-4)).toBe("00:00");
  });

  it("uses the server clock instead of the browser clock", () => {
    const clientNow = Date.parse("2026-11-07T10:00:00Z");
    const offset = serverClockOffset("2026-11-07T10:00:30Z", clientNow);
    expect(offset).toBe(30_000);
    expect(
      remainingSeconds("2026-11-07T10:01:00Z", offset, clientNow),
    ).toBe(30);
    expect(remainingSeconds("2026-11-07T10:00:00Z", offset, clientNow)).toBe(0);
    expect(remainingSeconds(null, offset, clientNow)).toBeNull();
  });

  it("counts answered questions, including fill-in answers", () => {
    const answers = {
      a: { selected_option_labels: ["A"], text_answer: null },
      b: { selected_option_labels: [], text_answer: "  " },
      c: { selected_option_labels: null, text_answer: "HTTPS" },
    };
    expect(isAnswered(answers.a)).toBe(true);
    expect(isAnswered(answers.b)).toBe(false);
    expect(isAnswered(undefined)).toBe(false);
    expect(answeredCount(answers)).toBe(2);
  });

  it("labels availability and windows", () => {
    expect(availabilityLabel("OPEN")).toBe("Open now");
    expect(availabilityLabel("UPCOMING")).toBe("Upcoming");
    expect(availabilityLabel("CLOSED")).toBe("Closed");
    expect(availabilityLabel("EXHAUSTED")).toBe("No attempts left");
    expect(formatWindow(null, null)).toBe("No time window");
    expect(formatWindow("2026-11-07T10:00:00Z", null)).toMatch(/^Opens /);
    expect(formatWindow("2026-11-07T10:00:00Z", "2026-11-07T11:00:00Z")).toContain("→");
  });

  it("round-trips datetime-local values", () => {
    const local = "2026-11-07T15:30";
    const iso = fromDateTimeLocal(local);
    expect(iso).not.toBeNull();
    expect(toDateTimeLocal(iso)).toBe(local);
    expect(fromDateTimeLocal("")).toBeNull();
    expect(toDateTimeLocal(null)).toBe("");
  });
});
