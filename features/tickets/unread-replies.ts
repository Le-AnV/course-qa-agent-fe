import type { TicketInboxItem } from "./api";

export function latestUnreadReply(ticket: TicketInboxItem) {
  const seenAt = ticket.student_seen_at ? Date.parse(ticket.student_seen_at) : -Infinity;
  return [...ticket.replies].reverse().find(
    (reply) => reply.user_id !== ticket.student_id && Date.parse(reply.created_at) > seenAt,
  );
}

export function hasUnreadReply(ticket: TicketInboxItem): boolean {
  return latestUnreadReply(ticket) !== undefined;
}
