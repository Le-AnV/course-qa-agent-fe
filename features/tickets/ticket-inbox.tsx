"use client";

import * as React from "react";
import { TicketsInboxLayout } from "@/components/shared/TicketsInboxLayout";
import { Button } from "@/components/ui/button";
import { studentApi, type StudentClass } from "@/lib/student-api";
import { cn } from "@/lib/utils";
import { addTicketReply, listTickets, type Ticket, type TicketList } from "./api";

const FILTERS = [
  { id: "OPEN", label: "Open" },
  { id: "ANSWERED", label: "Answered" },
  { id: "RESOLVED", label: "Resolved" },
  { id: "EXPIRED", label: "Expired" },
  { id: "all", label: "All" },
];

export function TicketInbox({ initialClassId }: { initialClassId: string }) {
  const [classes, setClasses] = React.useState<StudentClass[]>([]);
  const [classId, setClassId] = React.useState(initialClassId);
  const [filter, setFilter] = React.useState<Ticket["status"] | "all">("OPEN");
  const [page, setPage] = React.useState(1);
  const [data, setData] = React.useState<TicketList | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [classError, setClassError] = React.useState<string | null>(null);
  const [retry, setRetry] = React.useState(0);
  const [search, setSearch] = React.useState("");
  const [reply, setReply] = React.useState("");
  const [replyBusy, setReplyBusy] = React.useState(false);
  const [replyError, setReplyError] = React.useState<string | null>(null);
  const [selectedId, setSelectedId] = React.useState<string | null>(() =>
    typeof window === "undefined"
      ? null
      : new URLSearchParams(window.location.search).get("ticket_id"),
  );

  React.useEffect(() => {
    let cancelled = false;
    studentApi.classes().then((result) => {
      if (!cancelled) { setClasses(result); setClassError(null); }
    }).catch((cause) => {
      if (!cancelled) setClassError(cause instanceof Error ? cause.message : "Could not load classes.");
    });
    return () => { cancelled = true; };
  }, [retry]);

  React.useEffect(() => {
    let cancelled = false;
    listTickets({ class_id: classId || undefined, status: filter === "all" ? undefined : filter, page })
      .then((result) => { if (!cancelled) setData(result); })
      .catch((cause) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Could not load tickets.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [classId, filter, page, retry]);

  function startRequest() {
    setLoading(true);
    setError(null);
    setSelectedId(null);
    setSearch("");
  }

  const query = search.trim().toLowerCase();
  const visible = loading || error ? [] : (data?.items ?? []).filter((ticket) =>
    !query || [ticket.id, ticket.question, ticket.student_name, ticket.class_code]
      .some((value) => value.toLowerCase().includes(query)),
  );
  const selected = visible.find((ticket) => ticket.id === selectedId) ?? visible[0];
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / (data?.page_size ?? 20)));
  const selectedClassKnown = classes.some((item) => item.id === classId);

  const leftContent = (
    <>
      {loading ? (
        <div role="status" aria-label="Loading tickets" aria-busy="true" className="space-y-3 p-4">
          {[1, 2, 3].map((item) => <div key={item} className="h-20 animate-pulse rounded bg-[#F7F7F7]" />)}
        </div>
      ) : error ? (
        <div className="space-y-3 p-4">
          <p role="alert" className="text-sm text-red-700">{error}</p>
          <Button variant="outline" onClick={() => { startRequest(); setRetry((value) => value + 1); }}>Retry</Button>
        </div>
      ) : visible.length === 0 ? (
        <p role="status" className="p-4 text-sm text-[#6F6F6F]">
          {query ? "No tickets match this search on this page." : "No tickets match these filters."}
        </p>
      ) : visible.map((ticket) => (
        <button key={ticket.id} type="button" aria-pressed={selected?.id === ticket.id}
          onClick={() => setSelectedId(ticket.id)}
          className={cn("flex w-full flex-col gap-1 border-b border-l-[3px] border-b-[#F0F0F0] p-3.5 text-left focus-visible:outline-2 focus-visible:outline-offset-[-2px]",
            selected?.id === ticket.id ? "border-l-[#111111] bg-[#FAFAFA]" : "border-l-transparent hover:bg-[#FAFAFA]")}
        >
          <span className="text-xs font-semibold text-[#5A5A5A]">{ticket.student_name} · {ticket.class_code}</span>
          <span className="line-clamp-2 break-words text-sm font-semibold text-[#111111]">{ticket.question}</span>
          <span className="text-xs text-[#5A5A5A]">{FILTERS.find((item) => item.id === ticket.status)?.label} · <time dateTime={ticket.created_at}>{new Date(ticket.created_at).toLocaleString()}</time></span>
          <span className="break-all font-mono text-[10px] text-[#6F6F6F]">ID: {ticket.id}</span>
        </button>
      ))}
      <nav aria-label="Ticket pagination" className="flex flex-wrap items-center justify-between gap-2 border-t border-[#F0F0F0] p-3">
        <Button size="sm" variant="outline" disabled={loading || !!error || page <= 1}
          onClick={() => { startRequest(); setPage((value) => value - 1); }}>Previous</Button>
        <span role="status" className="text-xs text-[#5A5A5A]">Page {page} of {totalPages}</span>
        <Button size="sm" variant="outline" disabled={loading || !!error || page >= totalPages}
          onClick={() => { startRequest(); setPage((value) => value + 1); }}>Next</Button>
      </nav>
    </>
  );

  return (
    <div className="space-y-4">
      <label htmlFor="inbox-class" className="flex flex-wrap items-center gap-2 text-sm font-medium">
        Class
        <select id="inbox-class" value={classId} className="min-w-0 max-w-full rounded border border-[#DADADA] bg-white px-3 py-2"
          onChange={(event) => { startRequest(); setClassId(event.target.value); setPage(1); }}>
          <option value="">All assigned classes</option>
          {classId && !selectedClassKnown && <option value={classId}>Current class</option>}
          {classes.map((item) => <option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}
        </select>
      </label>
      {classError && <div role="alert" className="text-sm text-red-700">{classError} <Button variant="outline" size="sm" onClick={() => { startRequest(); setRetry((value) => value + 1); }}>Retry classes</Button></div>}
      <TicketsInboxLayout title="Class Tickets" subtitle="Student questions for your assigned classes. Newest first."
        titleBadge={!loading && !error && data ? <span className="text-xs text-[#6F6F6F]">{data.total} tickets</span> : undefined}
        searchValue={search} searchPlaceholder="Search this page" onSearchChange={setSearch}
        filters={FILTERS} activeFilter={filter}
        onFilterChange={(value) => {
          if (value === filter) return;
          startRequest(); setFilter(value as Ticket["status"] | "all"); setPage(1);
        }}
        leftListContent={leftContent}
        rightDetailContent={selected ? (
          <article className="space-y-4 p-4 md:p-6">
            {selected.original_question && <section className="space-y-2">
              <h3 className="text-sm font-semibold text-[#111111]">Student&apos;s original question</h3>
              <p className="whitespace-pre-wrap break-words rounded-md bg-[#F7F7F7] p-3 text-sm">{selected.original_question}</p>
            </section>}
            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-[#111111]">Question for teacher</h3>
              <p className="whitespace-pre-wrap break-words text-sm">{selected.question}</p>
            </section>
            {selected.agent_answer && <div className="space-y-2">
              <p className="text-sm font-medium">Agent answer</p>
              <blockquote className="max-h-48 overflow-y-auto whitespace-pre-wrap break-words rounded-md bg-[#F7F7F7] p-3 text-sm">{selected.agent_answer}</blockquote>
            </div>}
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm">
              <dt>Ticket ID</dt><dd className="break-all font-mono text-xs">{selected.id}</dd>
              <dt>Student</dt><dd>{selected.student_name}</dd>
              <dt>Class</dt><dd>{selected.class_code} · {selected.class_name}</dd>
              <dt>Status</dt><dd>{FILTERS.find((item) => item.id === selected.status)?.label}</dd>
              <dt>Created</dt><dd><time dateTime={selected.created_at}>{new Date(selected.created_at).toLocaleString()}</time></dd>
            </dl>
            <section className="space-y-3 border-t border-[#E5E5E5] pt-4">
              <h3 className="text-sm font-semibold">Conversation</h3>
              {selected.replies.map((item) => (
                <div key={item.id} className="rounded-md bg-[#F7F7F7] p-3 text-sm">
                  <p className="mb-1 text-xs text-[#6F6F6F]">{item.user_id === selected.student_id ? "Student" : "Teacher"}</p>
                  <p className="whitespace-pre-wrap">{item.message}</p>
                </div>
              ))}
              {selected.status === "OPEN" && <form className="space-y-2" onSubmit={async (event) => {
                event.preventDefault();
                if (!reply.trim()) return;
                setReplyBusy(true); setReplyError(null);
                try {
                  await addTicketReply(selected.id, reply.trim());
                  setReply("");
                  startRequest(); setRetry((value) => value + 1);
                } catch (cause) {
                  setReplyError(cause instanceof Error ? cause.message : "Could not send your answer.");
                } finally { setReplyBusy(false); }
              }}>
                <label className="block space-y-1 text-sm font-medium" htmlFor="ticket-teacher-reply">Reply to student
                  <textarea id="ticket-teacher-reply" rows={4} maxLength={10000} value={reply}
                    onChange={(event) => setReply(event.target.value)}
                    className="w-full rounded-md border border-[#DADADA] px-3 py-2 font-normal" />
                </label>
                {replyError && <p role="alert" className="text-sm text-red-700">{replyError}</p>}
                <Button type="submit" disabled={replyBusy || !reply.trim()}>{replyBusy ? "Sending…" : "Send answer"}</Button>
              </form>}
            </section>
          </article>
        ) : <p className="p-6 text-sm text-[#6F6F6F]">Select a ticket from the list to read it.</p>}
      />
    </div>
  );
}
