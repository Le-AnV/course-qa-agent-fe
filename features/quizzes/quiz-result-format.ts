import type { QuizAttemptStatus } from "@/lib/quiz-api";

/** Backend scores are rounded to 2dp; trim trailing zeros for display. */
export function formatScore(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

/** The API sends percentages as 0–100 values, not fractions. */
export function formatPercentage(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${formatScore(value)}%`;
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const QUESTION_TYPE_LABELS: Record<string, string> = {
  SINGLE_CHOICE: "Single choice",
  MULTIPLE_CHOICE: "Multiple choice",
  FILL_IN_BLANK: "Fill in blank",
};

export function questionTypeLabel(type: string): string {
  return QUESTION_TYPE_LABELS[type] ?? type.replaceAll("_", " ").toLowerCase();
}

const ATTEMPT_STATUS_LABELS: Record<QuizAttemptStatus, string> = {
  IN_PROGRESS: "In progress",
  SUBMITTED: "Submitted",
  EXPIRED: "Expired",
};

export function attemptStatusLabel(status: QuizAttemptStatus): string {
  return ATTEMPT_STATUS_LABELS[status] ?? status;
}

/** "2 of 3 students passed" — used under the pass-rate card. */
export function passRateHint(passed: number, total: number): string {
  if (total === 0) return "No official attempts yet";
  return `${passed} of ${total} student${total === 1 ? "" : "s"} passed`;
}
