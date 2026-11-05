import { apiFetch } from "@/lib/admin-api";
import type { ChatMessageCitation } from "@/features/history/types";

export type Ticket = {
  id: string;
  class_id: string;
  student_id: string;
  question: string;
  original_question?: string | null;
  agent_answer?: string | null;
  citations?: ChatMessageCitation[];
  source_message_id?: string | null;
  status: "OPEN" | "ANSWERED" | "RESOLVED" | "EXPIRED";
  created_at: string;
  escalated_to_id?: string | null;
  escalated_at?: string | null;
  escalated_to_name?: string | null;
};

export type TicketReply = {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  created_at: string;
};

export type TicketThread = Ticket & { replies: TicketReply[] };

export type TicketInboxItem = Ticket & {
  student_name: string;
  class_name: string;
  class_code: string;
  class_status?: "ACTIVE" | "ARCHIVED" | string;
  replies: TicketReply[];
};

export type TicketList = {
  items: TicketInboxItem[];
  total: number;
  page: number;
  page_size: number;
};

export type TicketClassCounts = {
  class_id: string;
  class_code: string;
  class_name: string;
  class_status?: "ACTIVE" | "ARCHIVED" | string;
  open_count: number;
  completed_count: number;
  expired_count: number;
};

export type TicketCounts = {
  items: TicketClassCounts[];
  open_total: number;
  completed_total: number;
};

export function listTickets(input: {
  class_id?: string;
  status?: Ticket["status"];
  page?: number;
  page_size?: number;
}): Promise<TicketList> {
  const query = new URLSearchParams({
    page: String(input.page ?? 1),
    page_size: String(input.page_size ?? 20),
  });
  if (input.class_id) query.set("class_id", input.class_id);
  if (input.status) query.set("status", input.status);
  return apiFetch<TicketList>(`/api/tickets?${query}`);
}

export function listMyTickets(input: {
  class_id?: string;
  status?: Ticket["status"];
  page?: number;
  page_size?: number;
}): Promise<TicketList> {
  const query = new URLSearchParams({
    page: String(input.page ?? 1),
    page_size: String(input.page_size ?? 20),
  });
  if (input.class_id) query.set("class_id", input.class_id);
  if (input.status) query.set("status", input.status);
  return apiFetch<TicketList>(`/api/tickets/mine?${query}`);
}

export function createTicket(input: {
  class_id: string;
  question: string;
  original_question?: string;
  agent_answer?: string;
  details?: string;
}): Promise<Ticket> {
  return apiFetch<Ticket>("/api/tickets", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function createAnswerTicket(messageId: string, details: string): Promise<Ticket> {
  return apiFetch<Ticket>(`/api/chat/messages/${messageId}/ticket`, {
    method: "POST", body: JSON.stringify({ confirmed: true, details }),
  });
}

export function addTicketReply(ticketId: string, message: string): Promise<TicketReply> {
  return apiFetch<TicketReply>(`/api/tickets/${ticketId}/replies`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

export function getStudentTicket(ticketId: string): Promise<TicketThread> {
  return apiFetch<TicketThread>(`/api/tickets/${ticketId}`);
}

export function resolveTicket(ticketId: string): Promise<Ticket> {
  return apiFetch<Ticket>(`/api/tickets/${ticketId}/resolve`, { method: "POST" });
}

export function reopenTicket(ticketId: string): Promise<Ticket> {
  return apiFetch<Ticket>(`/api/tickets/${ticketId}/reopen`, { method: "POST" });
}

export function getTicketCounts(classId?: string): Promise<TicketCounts> {
  const query = classId ? `?class_id=${encodeURIComponent(classId)}` : "";
  return apiFetch<TicketCounts>(`/api/tickets/counts${query}`);
}
