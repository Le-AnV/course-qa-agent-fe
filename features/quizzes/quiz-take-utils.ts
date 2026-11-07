import type { QuizAvailability } from "@/lib/student-quiz-api";

export function formatDuration(totalSeconds: number | null | undefined): string {
  if (totalSeconds === null || totalSeconds === undefined) return "No limit";
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Positive when the server clock is ahead of the browser clock. */
export function serverClockOffset(serverTime: string, clientNowMs: number): number {
  const parsed = Date.parse(serverTime);
  return Number.isNaN(parsed) ? 0 : parsed - clientNowMs;
}

export function remainingSeconds(
  deadlineAt: string | null,
  offsetMs: number,
  clientNowMs: number,
): number | null {
  if (!deadlineAt) return null;
  const deadline = Date.parse(deadlineAt);
  if (Number.isNaN(deadline)) return null;
  return Math.max(0, Math.floor((deadline - (clientNowMs + offsetMs)) / 1000));
}

export function isAnswered(
  answer:
    | { selected_option_labels?: string[] | null; text_answer?: string | null }
    | null
    | undefined,
): boolean {
  if (!answer) return false;
  return (answer.selected_option_labels?.length ?? 0) > 0 || Boolean(answer.text_answer?.trim());
}

export function answeredCount(
  answers: Record<
    string,
    { selected_option_labels?: string[] | null; text_answer?: string | null } | undefined
  >,
): number {
  return Object.values(answers).filter((answer) => isAnswered(answer)).length;
}

export function formatWindow(opensAt: string | null, closesAt: string | null): string {
  const format = (value: string) =>
    new Date(value).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  if (opensAt && closesAt) return `${format(opensAt)} → ${format(closesAt)}`;
  if (opensAt) return `Opens ${format(opensAt)}`;
  if (closesAt) return `Closes ${format(closesAt)}`;
  return "No time window";
}

export function availabilityLabel(availability: QuizAvailability): string {
  switch (availability) {
    case "UPCOMING":
      return "Upcoming";
    case "CLOSED":
      return "Closed";
    case "EXHAUSTED":
      return "No attempts left";
    default:
      return "Open now";
  }
}

/** ISO timestamp -> value accepted by <input type="datetime-local">. */
export function toDateTimeLocal(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

/** <input type="datetime-local"> value -> ISO timestamp, or null when cleared. */
export function fromDateTimeLocal(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
