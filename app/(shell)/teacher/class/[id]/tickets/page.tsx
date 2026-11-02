"use client";

import { useParams } from "next/navigation";
import { TicketInbox } from "@/features/tickets/ticket-inbox";

export default function ClassTicketsPage() {
  const { id } = useParams<{ id: string }>();
  return <TicketInbox key={id} initialClassId={id} />;
}
