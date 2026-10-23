/**
 * Helpers for teacher-authored rich text (class information).
 *
 * The schedule used to be a single-line <input>, so browsers flattened pasted
 * newlines into spaces. This keeps those legacy one-line values readable
 * without rewriting the stored data: only when a value has no real newline do
 * we treat runs of 3+ spaces as the line separators the author intended.
 */
export function normalizeLegacySchedule(value: string | null | undefined): string {
  const text = (value ?? "").replace(/\r\n?/g, "\n").trim();
  if (!text || text.includes("\n")) return text;
  const lines = text
    .split(/[ \t]{3,}/)
    .map((line) => line.trim())
    .filter(Boolean);
  return lines.length > 1 ? lines.join("\n") : text;
}
