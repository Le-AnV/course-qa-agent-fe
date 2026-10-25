/**
 * The collapsed rail can only fit a few conversation shortcuts, so it shows the
 * newest ones — but never hides the conversation the user is currently reading.
 * `sessions` is already newest-first (AC-06).
 */
export function railSessions<T extends { id: string }>(
  sessions: T[],
  activeSessionId: string | null | undefined,
  limit = 3,
): T[] {
  if (limit < 1) return [];

  const visible = sessions.slice(0, limit);
  if (!activeSessionId || visible.some((session) => session.id === activeSessionId)) {
    return visible;
  }

  const active = sessions.find((session) => session.id === activeSessionId);
  if (!active) return visible;

  return [...visible.slice(0, limit - 1), active];
}
