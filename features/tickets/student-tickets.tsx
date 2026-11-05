"use client";

import * as React from "react";
import { TicketCitations } from './ticket-citations';
import { TicketsInboxLayout } from "@/components/shared/TicketsInboxLayout";
import { AppSelect, type AppSelectOption } from "@/components/ui/app-select";
import { Button } from "@/components/ui/button";
import { studentApi, type StudentClass } from "@/lib/student-api";
import { cn } from "@/lib/utils";
import {
  addTicketReply,
  getStudentTicket,
  listMyTickets,
  markTicketSeen,
  reopenTicket,
  resolveTicket,
  type Ticket,
  type TicketList,
  type TicketInboxItem,
} from "./api";
import {
  ArchivedClassBadge,
  formatTicketDate,
  getTicketStatusTheme,
  TicketStatusBadge,
} from "./ticket-status-badge";
import { hasUnreadReply, latestUnreadReply } from "./unread-replies";
import { useTicketNotifications } from "./ticket-notifications";

const FILTERS = [
  { id: "OPEN", label: "Open" },
  { id: "ANSWERED", label: "Answered" },
  { id: "RESOLVED", label: "Resolved" },
  { id: "EXPIRED", label: "Expired" },
  { id: "all", label: "All" },
];

export function StudentTickets({ initialClassId }: { initialClassId: string }) {
  const [classes, setClasses] = React.useState<StudentClass[]>([]);
  const [classId, setClassId] = React.useState(initialClassId);
  const [filter, setFilter] = React.useState<Ticket["status"] | "all">("all");
  const [page, setPage] = React.useState(1);
  const [data, setData] = React.useState<TicketList | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [retry, setRetry] = React.useState(0);
  const [search, setSearch] = React.useState("");
  const [selectedId, setSelectedId] = React.useState<string | null>(() =>
    typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("ticket_id"),
  );
  const [linkedTicket, setLinkedTicket] = React.useState<TicketInboxItem | null>(null);
  const notifications = useTicketNotifications();
  const markedReply = React.useRef<string | null>(null);
  const [followUp, setFollowUp] = React.useState("");
  const [replyBusy, setReplyBusy] = React.useState(false);
  const [replyError, setReplyError] = React.useState<string | null>(null);
  const [actionBusy, setActionBusy] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    studentApi
      .classes()
      .then((result) => {
        if (!cancelled) {
          setClasses(result);
          // Archived classes disappear from the picker, so fall back to all
          // classes if the URL still points at one.
          setClassId((current) =>
            result.some((item) => item.id === current && item.status !== "ARCHIVED")
              ? current
              : "",
          );
        }
      })
      .catch(() => {
        // The class filter falls back to the class in the URL.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    listMyTickets({
      class_id: classId || undefined,
      status: filter === "all" ? undefined : filter,
      page,
    })
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setError(null);
        }
      })
      .catch((cause) => {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "Could not load your tickets.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [classId, filter, page, retry, notifications?.newReplyVersion]);

  // Keep the page fresh while the student waits for a teacher reply.
  React.useEffect(() => {
    const timer = window.setInterval(() => setRetry((value) => value + 1), 20000);
    return () => window.clearInterval(timer);
  }, []);

  function startRequest({ soft = false }: { soft?: boolean } = {}) {
    // Keep the current rows on screen while a filter/class/page request is in
    // flight so the list does not flash a skeleton.
    if (!soft) setLoading(true);
    setError(null);
    setSelectedId(null);
    setLinkedTicket(null);
    setFollowUp("");
    setReplyError(null);
    setActionError(null);
  }

  const query = search.trim().toLowerCase();
  const visible = error
    ? []
    : (data?.items ?? []).filter(
        (ticket) =>
          !query ||
          [ticket.id, ticket.question, ticket.class_code].some((value) =>
            value.toLowerCase().includes(query),
          ),
      );
  React.useEffect(() => {
    if (!selectedId || !data || data.items.some((ticket) => ticket.id === selectedId)) return;
    let cancelled = false;
    void getStudentTicket(selectedId).then((ticket) => {
      if (cancelled) return;
      const clazz = classes.find((item) => item.id === ticket.class_id);
      setLinkedTicket({ ...ticket, student_name: "", class_name: clazz?.name ?? "", class_code: clazz?.code ?? "", class_status: clazz?.status ?? "ACTIVE" });
    }).catch(() => { if (!cancelled) setLinkedTicket(null); });
    return () => { cancelled = true; };
  }, [selectedId, data, classes]);
  const selected = selectedId
    ? visible.find((ticket) => ticket.id === selectedId) ?? (linkedTicket?.id === selectedId ? linkedTicket : undefined)
    : visible[0];
  const unreadReply = selected ? latestUnreadReply(selected) : undefined;
  React.useEffect(() => {
    if (!selected || !unreadReply || markedReply.current === unreadReply.id) return;
    markedReply.current = unreadReply.id;
    void markTicketSeen(selected.id).then(() => {
      setRetry((value) => value + 1);
      void notifications?.refresh();
    }).catch(() => { markedReply.current = null; });
  }, [selected, unreadReply, notifications]);
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / (data?.page_size ?? 20)));
  const classSelectOptions: AppSelectOption[] = [
    { value: "", label: "All my classes" },
    ...classes
      .filter((item) => item.status !== "ARCHIVED")
      .map((item) => ({
        value: item.id,
        label: `${item.code} · ${item.name}`,
      })),
  ];
  // Archived classes never appear in the picker.
  const classSelectValue = classSelectOptions.some((item) => item.value === classId)
    ? classId
    : "";

  async function updateStatus(action: "resolve" | "reopen") {
    if (!selected) return;
    setActionBusy(true);
    setActionError(null);
    try {
      if (action === "resolve") await resolveTicket(selected.id);
      else await reopenTicket(selected.id);
      // Keep the ticket in view after its status changes.
      if (filter !== "all") setFilter(action === "resolve" ? "RESOLVED" : "ANSWERED");
      setRetry((value) => value + 1);
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Could not update the ticket.");
    } finally {
      setActionBusy(false);
    }
  }

  async function sendFollowUp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !followUp.trim()) return;
    setReplyBusy(true);
    setReplyError(null);
    try {
      await addTicketReply(selected.id, followUp.trim());
      setFollowUp("");
      // A follow-up puts the ticket back in the teacher queue.
      if (filter === "ANSWERED") setFilter("OPEN");
      setRetry((value) => value + 1);
    } catch (cause) {
      setReplyError(cause instanceof Error ? cause.message : "Could not send your message.");
    } finally {
      setReplyBusy(false);
    }
  }

  const leftContent = (
    <>
      {loading ? (
        <div role="status" aria-label="Loading tickets" aria-busy="true" className="space-y-3 p-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-24 animate-pulse rounded-lg bg-[#F7F7F7]" />
          ))}
        </div>
      ) : error ? (
        <div className="space-y-3 p-4">
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
          <Button
            variant="outline"
            onClick={() => {
              startRequest();
              setRetry((value) => value + 1);
            }}
          >
            Retry
          </Button>
        </div>
      ) : visible.length === 0 ? (
        <div className="p-5 text-sm text-[#6F6F6F]">
          <p className="font-medium text-[#111111]">No tickets here yet.</p>
          <p className="mt-1 leading-relaxed">
            Open Q&amp;A Chat, select part of a completed AI answer, then choose
            <span className="font-medium text-[#111111]"> “Ask my teacher”</span>.
          </p>
        </div>
      ) : (
        visible.map((ticket) => (
          <button
            key={ticket.id}
            type="button"
            aria-pressed={selected?.id === ticket.id}
            onClick={() => {
              setSelectedId(ticket.id);
              setFollowUp("");
              setReplyError(null);
              setActionError(null);
            }}
            className={cn(
              "flex w-full flex-col gap-1 border-b border-l-[3px] border-b-[#F0F0F0] px-4 py-3.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px]",
              selected?.id === ticket.id
                ? "border-l-[#111111] bg-[#FAFAFA]"
                : "border-l-transparent hover:bg-[#FAFAFA]",
            )}
          >
            <span className="flex items-center justify-between gap-2">
              <TicketStatusBadge status={ticket.status} />
              {hasUnreadReply(ticket) && <span aria-label="New teacher reply" className="h-2 w-2 rounded-full bg-[#B74B3A]" />}
              <time dateTime={ticket.created_at} className="text-[11px] text-[#6F6F6F]">
                {formatTicketDate(ticket.created_at)}
              </time>
            </span>
            <span className="mt-1 line-clamp-2 break-words text-sm font-medium text-[#111111]">
              {ticket.question}
            </span>
            <span className="mt-0.5 text-[11.5px] text-[#5A5A5A]">
              {ticket.class_code}
              {ticket.class_status === "ARCHIVED" ? " · Archived" : ""} ·{" "}
              {ticket.replies.length} {ticket.replies.length === 1 ? "message" : "messages"}
            </span>
          </button>
        ))
      )}
      <nav
        aria-label="Ticket pagination"
        className="flex flex-wrap items-center justify-between gap-2 border-t border-[#F0F0F0] p-3"
      >
        <Button
          size="sm"
          variant="outline"
          disabled={loading || !!error || page <= 1}
          onClick={() => {
            startRequest({ soft: true });
            setPage((value) => value - 1);
          }}
        >
          Previous
        </Button>
        <span role="status" className="text-xs text-[#5A5A5A]">
          Page {page} of {totalPages}
        </span>
        <Button
          size="sm"
          variant="outline"
          disabled={loading || !!error || page >= totalPages}
          onClick={() => {
            startRequest({ soft: true });
            setPage((value) => value + 1);
          }}
        >
          Next
        </Button>
      </nav>
    </>
  );

  return (
    <TicketsInboxLayout
      title="My Tickets"
      subtitle="Questions you sent to your teacher. Replies and status updates appear here."
      titleBadge={
        !loading && !error && data ? (
          <span className="text-xs text-[#6F6F6F]">
            {data.total} {data.total === 1 ? "ticket" : "tickets"}
          </span>
        ) : undefined
      }
      headerActions={
        <label
          htmlFor="student-ticket-class"
          className="flex flex-wrap items-center gap-2 text-[13px] font-medium text-[#5A5A5A]"
        >
          Class
          <AppSelect
            id="student-ticket-class"
            value={classSelectValue}
            onValueChange={(value) => {
              startRequest({ soft: true });
              setClassId(value);
              setPage(1);
            }}
            options={classSelectOptions}
            placeholder="All my classes"
            aria-label="Filter tickets by class"
            size="sm"
            triggerClassName="w-[340px] max-w-full"
            contentClassName="min-w-[280px]"
            renderValue={(option) =>
              option ? (
                <span className="flex min-w-0 items-center gap-2">
                  <span className="truncate">{option.label}</span>
                  {option.description ? (
                    <span className="shrink-0 text-[11px] font-normal text-[#6F6F6F]">
                      {option.description}
                    </span>
                  ) : null}
                </span>
              ) : undefined
            }
          />
        </label>
      }
      searchValue={search}
      searchPlaceholder="Search your tickets"
      onSearchChange={setSearch}
      filters={FILTERS}
      activeFilter={filter}
      onFilterChange={(value) => {
        if (value === filter) return;
        startRequest({ soft: true });
        setFilter(value as Ticket["status"] | "all");
        setPage(1);
      }}
      leftListContent={leftContent}
      rightDetailContent={
        selected ? (
          <article className="flex h-full min-h-0 flex-col">
            <header
              className={cn(
                "border-b px-5 py-4",
                getTicketStatusTheme(selected.status).headerClassName,
              )}
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <TicketStatusBadge status={selected.status} />
                <span className="text-xs text-[#5A5A5A]">
                  {selected.class_code} · {selected.class_name}
                </span>
                {selected.class_status === "ARCHIVED" && <ArchivedClassBadge />}
                <time
                  dateTime={selected.created_at}
                  className="text-xs text-[#6F6F6F]"
                >
                  {formatTicketDate(selected.created_at)}
                </time>
              </div>
              <h2
                className={cn(
                  "mt-2 text-lg font-semibold leading-snug",
                  getTicketStatusTheme(selected.status).titleClassName,
                )}
              >
                {selected.question}
              </h2>
              <p className="mt-1 break-all font-mono text-[10px] text-[#6F6F6F]">
                Ticket {selected.id}
              </p>
            </header>

            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
              {selected.original_question && (
                <section className="space-y-1.5">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wide text-[#6F6F6F]">
                    Your original question
                  </h3>
                  <p className="whitespace-pre-wrap break-words rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] p-3 text-sm text-[#333333]">
                    {selected.original_question}
                  </p>
                </section>
              )}

              <TicketCitations citations={selected.citations} />
              {selected.agent_answer && (
                <section className="space-y-1.5">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wide text-[#6F6F6F]">
                    AI answer you asked about
                  </h3>
                  <blockquote className="max-h-44 overflow-y-auto whitespace-pre-wrap break-words rounded-lg border border-[#E5E5E5] bg-white p-3 text-sm text-[#5A5A5A]">
                    {selected.agent_answer}
                  </blockquote>
                </section>
              )}

              <section className="space-y-3">
                <h3 className="text-[11px] font-semibold uppercase tracking-wide text-[#6F6F6F]">
                  Conversation
                </h3>
                {selected.replies.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-[#DADADA] p-3 text-sm text-[#6F6F6F]">
                    No messages yet. Your teacher will reply here.
                  </p>
                ) : (
                  selected.replies.map((item) => {
                    const fromStudent = item.user_id === selected.student_id;
                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "max-w-[85%] rounded-lg border px-3.5 py-2.5 text-sm",
                          fromStudent
                            ? "ml-auto border-[#DADADA] bg-[#F7F7F7]"
                            : "border-[#CFE0F7] bg-[#F5F9FF]",
                        )}
                      >
                        <p className="mb-1 text-[11px] font-semibold text-[#5A5A5A]">
                          {fromStudent ? "You" : "Teacher"}
                        </p>
                        <p className="whitespace-pre-wrap break-words text-[#111111]">
                          {item.message}
                        </p>
                        <time
                          dateTime={item.created_at}
                          className="mt-1 block text-[10px] text-[#6F6F6F]"
                        >
                          {formatTicketDate(item.created_at)}
                        </time>
                      </div>
                    );
                  })
                )}

                {(selected.status === "OPEN" || selected.status === "ANSWERED") && (
                  <form
                    onSubmit={sendFollowUp}
                    className="space-y-2 rounded-lg border border-[#DADADA] p-3"
                  >
                    <label
                      className="block space-y-1 text-sm font-medium text-[#111111]"
                      htmlFor="student-ticket-follow-up"
                    >
                      Add details or a follow-up
                      <textarea
                        id="student-ticket-follow-up"
                        rows={3}
                        maxLength={10000}
                        value={followUp}
                        onChange={(event) => setFollowUp(event.target.value)}
                        className="mt-1 w-full resize-y rounded-md border border-[#DADADA] bg-white px-3 py-2 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                      />
                    </label>
                    {replyError && (
                      <p role="alert" className="text-sm text-red-700">
                        {replyError}
                      </p>
                    )}
                    <div className="flex justify-end">
                      <Button type="submit" disabled={replyBusy || !followUp.trim()}>
                        {replyBusy ? "Sending…" : "Send follow-up"}
                      </Button>
                    </div>
                  </form>
                )}
              </section>
            </div>

            <footer className="border-t border-[#E5E5E5] bg-white px-5 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-[#6F6F6F]">
                  {selected.status === "OPEN" && "Waiting for your teacher to reply."}
                  {selected.status === "ANSWERED" &&
                    "Your teacher replied. Add a follow-up below or confirm it is resolved."}
                  {selected.status === "RESOLVED" && "This ticket is marked as resolved."}
                  {selected.status === "EXPIRED" &&
                    "This ticket expired after seven days without an answer."}
                </p>
                <div className="flex items-center gap-2">
                  {selected.status === "ANSWERED" && (
                    <Button
                      type="button"
                      disabled={actionBusy}
                      onClick={() => void updateStatus("resolve")}
                    >
                      {actionBusy ? "Saving…" : "Confirm resolved"}
                    </Button>
                  )}
                  {selected.status === "RESOLVED" && (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={actionBusy}
                      onClick={() => void updateStatus("reopen")}
                    >
                      {actionBusy ? "Saving…" : "Reopen ticket"}
                    </Button>
                  )}
                </div>
              </div>
              {actionError && (
                <p role="alert" className="mt-2 text-sm text-red-700">
                  {actionError}
                </p>
              )}
            </footer>
          </article>
        ) : (
          <div className="p-6 text-sm text-[#6F6F6F]">
            Select a ticket from the list to read the conversation.
          </div>
        )
      }
    />
  );
}
