import { describe, expect, it } from "vitest";
import { ticketNotificationHref } from "./ticket-notifications";

describe("ticketNotificationHref", () => {
  it("opens the related class inbox with the ticket selected", () => {
    expect(ticketNotificationHref({ class_id: "class-1", id: "ticket-2" }))
      .toBe("/teacher/class/class-1/tickets?ticket_id=ticket-2");
  });
});
