import { describe, expect, it } from "vitest";
import type { TicketInboxItem } from "./api";
import { hasUnreadReply, latestUnreadReply } from "./unread-replies";

const ticket = {
  student_id: "student",
  student_seen_at: "2026-11-05T08:00:00Z",
  replies: [
    { id: "student-reply", user_id: "student", created_at: "2026-11-05T09:00:00Z" },
    { id: "trainer-reply", user_id: "trainer", created_at: "2026-11-05T09:01:00Z" },
  ],
} as TicketInboxItem;

describe("unread trainer replies", () => {
  it("ignores student follow-ups and identifies the newest trainer reply", () => {
    expect(hasUnreadReply(ticket)).toBe(true);
    expect(latestUnreadReply(ticket)?.id).toBe("trainer-reply");
    expect(hasUnreadReply({ ...ticket, student_seen_at: "2026-11-05T09:02:00Z" })).toBe(false);
  });
});
