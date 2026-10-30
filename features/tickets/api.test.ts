import { afterEach, describe, expect, it, vi } from "vitest";
import { addTicketReply, createTicket, listTickets } from "./api";

describe("ticket API", () => {
  afterEach(() => vi.restoreAllMocks());

  it("creates a ticket with the selected class, question, and optional details", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ id: "ticket-1", status: "OPEN" }), { status: 201 }),
    );

    await createTicket({ class_id: "class-1", question: "Why?", details: "Please explain." });

    expect(fetchMock.mock.calls[0][0]).toContain("/api/tickets");
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
      class_id: "class-1",
      question: "Why?",
      details: "Please explain.",
    });
  });

  it("posts a follow-up to the selected ticket", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ id: "reply-1" }), { status: 201 }),
    );

    await addTicketReply("ticket-1", "Could you give another example?");

    expect(fetchMock.mock.calls[0][0]).toContain("/api/tickets/ticket-1/replies");
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
      message: "Could you give another example?",
    });
  });

  it("sends the student's question separately from the selected agent answer", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ id: "ticket-1", status: "OPEN" }), { status: 201 }),
    );
    await createTicket({
      class_id: "class-1", question: "Can you explain this condition?",
      agent_answer: "Only matching items are included.",
    });
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
      class_id: "class-1", question: "Can you explain this condition?",
      agent_answer: "Only matching items are included.",
    });
  });

  it("requests class/status filters and the selected page from the server", async () => {
    const response = { items: [], total: 0, page: 2, page_size: 20 };
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(response)),
    );
    expect(await listTickets({ class_id: "class-1", status: "ANSWERED", page: 2 })).toEqual(response);
    const url = new URL(String(fetchMock.mock.calls[0][0]));
    expect(url.pathname).toBe("/api/tickets");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      class_id: "class-1", status: "ANSWERED", page: "2", page_size: "20",
    });
  });

  it("omits optional filters for all assigned classes and all statuses", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ items: [], total: 0, page: 1, page_size: 20 })),
    );
    await listTickets({});
    const url = new URL(String(fetchMock.mock.calls[0][0]));
    expect(url.searchParams.has("class_id")).toBe(false);
    expect(url.searchParams.has("status")).toBe(false);
    expect(url.searchParams.get("page")).toBe("1");
  });

  it("surfaces authorization errors instead of substituting mock tickets", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ detail: "You are not assigned to this class." }), { status: 403 }),
    );
    await expect(listTickets({ class_id: "private" })).rejects.toThrow();
  });
});
