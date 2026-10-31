"use client";

import * as React from "react";
import { TicketsInboxLayout } from "@/components/shared/TicketsInboxLayout";
import { MockBadge } from "@/components/shared/MockBadge";
import { CheckCircle2, CornerDownRight, Sparkles, Send } from "lucide-react";
import { cn } from "@/lib/utils";

type TicketStatus = "open" | "resolved";

interface TicketItem {
  id: string;
  student: string;
  ago: string;
  subject: string;
  category: string;
  status: TicketStatus;
  body: string;
  resolvedNote?: string;
  suggestedAnswer: string;
}

const TICKETS: TicketItem[] = [
  {
    id: "t1",
    student: "Trần Gia Linh",
    ago: "10m ago",
    subject: "How should I structure the final proposal?",
    category: "Syllabus",
    status: "open",
    body: "Hi teacher, I'm not sure how detailed the problem statement should be in the final proposal. Should I follow the same structure as the assignment template, or can I propose a different outline?",
    suggestedAnswer:
      "The assignment template is the required baseline — keep those five sections. You can add extra subsections inside any of them, but the cover page, problem statement, scope, timeline and references must all be present.",
  },
  {
    id: "t2",
    student: "Lê Hoàng Nam",
    ago: "2h ago",
    subject: "Will the midterm cover heuristic design?",
    category: "Assessment",
    status: "resolved",
    body: "I missed the announcement about the midterm scope. Could you confirm whether heuristic design is included?",
    resolvedNote: "Answered: yes, chapters 3 and 4 are in scope.",
    suggestedAnswer:
      "Yes — heuristic design is included. The midterm covers everything in units 03 and 04, including admissibility and consistency proofs.",
  },
];

const STATUS_META: Record<TicketStatus, { dot: string; label: string; text: string }> = {
  open: { dot: "#B4881F", label: "Open", text: "#8F6B16" },
  resolved: { dot: "#4B9E76", label: "Resolved", text: "#3B7D5D" },
};

export default function ClassTicketsPage() {
  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState("open");
  const [selectedId, setSelectedId] = React.useState("t1");

  const filters = [
    { id: "open", label: "Open" },
    { id: "resolved", label: "Resolved" },
    { id: "all", label: "All" },
  ];

  const visible = TICKETS.filter((t) => {
    const matchesFilter = filter === "all" || t.status === filter;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      q.length === 0 || t.student.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  const selected = visible.find((t) => t.id === selectedId) ?? visible[0] ?? null;
  const openCount = TICKETS.filter((t) => t.status === "open").length;
  const resolvedCount = TICKETS.length - openCount;

  const leftContent = (
    <div className="flex flex-col">
      {visible.length === 0 ? (
        <p className="p-4 text-center text-[12.5px] text-[#6F6F6F]">No tickets match this filter.</p>
      ) : (
        visible.map((ticket, index) => {
          const meta = STATUS_META[ticket.status];
          const active = selected?.id === ticket.id;
          return (
            <button
              key={ticket.id}
              onClick={() => setSelectedId(ticket.id)}
              className={cn(
                "w-full text-left p-3.5 transition-colors flex flex-col gap-1 border-l-[3px]",
                index < visible.length - 1 && "border-b border-[#F0F0F0]",
                active
                  ? "bg-[#FAFAFA] border-l-[#111111]"
                  : "hover:bg-[#FAFAFA] border-l-transparent",
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.dot }} />
                  <span className="text-[11.5px] font-semibold text-[#5A5A5A]">{ticket.student}</span>
                </div>
                <span className="text-[10.5px] text-[#6F6F6F]">{ticket.ago}</span>
              </div>
              <div className="text-[13px] font-semibold text-[#111111] line-clamp-1 mt-0.5">
                {ticket.subject}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white text-[#5A5A5A] border border-[#DADADA]">
                  {ticket.category}
                </span>
                <span className="text-[10px] font-semibold" style={{ color: meta.text }}>
                  {meta.label}
                </span>
              </div>
            </button>
          );
        })
      )}
    </div>
  );

  const rightContent = selected ? (
    <>
      <div className="p-6 border-b border-[#F0F0F0]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-[16px] font-bold text-[#111111]">{selected.subject}</h3>
            <p className="text-[12.5px] text-[#6F6F6F] mt-1">
              {selected.student} · {selected.category} · {selected.ago}
            </p>
          </div>
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-white border border-[#DADADA] whitespace-nowrap"
            style={{ color: STATUS_META[selected.status].text }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: STATUS_META[selected.status].dot }}
            />
            {STATUS_META[selected.status].label}
          </span>
        </div>
        <p className="text-[13.5px] text-[#111111] leading-relaxed mt-4">{selected.body}</p>
        {selected.resolvedNote && (
          <p className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] text-[#3B7D5D]">
            <CheckCircle2 className="w-3.5 h-3.5" /> {selected.resolvedNote}
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        <div className="rounded-xl border border-[#DADADA] bg-white p-4">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-[#8F6B16]" />
            <span className="text-[12.5px] font-bold text-[#111111]">Suggested reply</span>
          </div>
          <p className="mb-2 text-[11.5px] text-[#6F6F6F]">
            Draft for this ticket only — nothing is sent to the student automatically.
          </p>
          <p className="text-[13px] text-[#111111] leading-relaxed">{selected.suggestedAnswer}</p>
          <div className="flex items-center gap-2 mt-3">
            <button className="flex items-center gap-1.5 rounded border border-[#CFCFCF] bg-white px-3 py-1.5 text-[12.5px] font-semibold text-[#111111] shadow-xs transition-colors hover:bg-[#F7F7F7]">
              <CornerDownRight className="w-3.5 h-3.5" /> Use as reply
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-[#DADADA] bg-white p-4">
          <textarea
            rows={4}
            placeholder="Write a reply to this student…"
            className="w-full resize-none border-0 text-[13px] text-[#111111] outline-none placeholder:text-[#6F6F6F]"
          />
          <div className="flex items-center justify-end border-t border-[#F0F0F0] pt-3">
            <button className="flex items-center gap-1.5 rounded border border-[#CFCFCF] bg-white px-3.5 py-1.5 text-[13px] font-semibold text-[#111111] shadow-xs transition-colors hover:bg-[#F7F7F7]">
              <Send className="w-3.5 h-3.5" /> Send reply
            </button>
          </div>
        </div>
      </div>
    </>
  ) : (
    <div className="flex h-full items-center justify-center p-8 text-center text-[13px] text-[#6F6F6F]">
      Select a ticket from the list to read it.
    </div>
  );

  return (
    <div className="h-[calc(100vh_-_124px)] min-h-[600px]">
      <TicketsInboxLayout
        title="Class Tickets"
        subtitle="Student questions and support requests for this class."
        titleBadge={
          <MockBadge
            label="Ticket"
            title="Ticket preview — the tickets backend is not connected yet"
          />
        }
        headerActions={
          <div className="flex items-center gap-3 rounded-md border border-[var(--brand-line)] bg-white/70 px-3 py-1.5 text-[11.5px] text-[#5A5A5A]">
            <span>
              <strong className="font-semibold text-[#111111]">{openCount}</strong> open
            </span>
            <span className="h-3 w-px bg-[var(--brand-line)]" />
            <span>
              <strong className="font-semibold text-[#111111]">{resolvedCount}</strong> resolved
            </span>
          </div>
        }
        searchValue={search}
        searchPlaceholder="Search tickets"
        onSearchChange={setSearch}
        filters={filters}
        activeFilter={filter}
        onFilterChange={setFilter}
        leftListContent={leftContent}
        rightDetailContent={rightContent}
      />
    </div>
  );
}
