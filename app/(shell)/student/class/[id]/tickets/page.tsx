"use client";

import { useParams } from "next/navigation";
import { StudentTickets } from "@/features/tickets/student-tickets";

export default function StudentTicketsPage() {
  const { id } = useParams<{ id: string }>();
  return <StudentTickets key={id} initialClassId={id} />;
}
