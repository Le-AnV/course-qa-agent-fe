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
  getTicketCounts,
  listTickets,
  reopenTicket,
  resolveTicket,
  type Ticket,
  type TicketCounts,
  type TicketList,
} from "./api";
import { formatTicketDate, TicketStatusBadge, ArchivedClassBadge } from "./ticket-status-badge";

const FILTERS = [
  { id: "OPEN", label: "Open" },
  { id: "ANSWERED", label: "Answered" },
  { id: "RESOLVED", label: "Resolved" },
  { id: "EXPIRED", label: "Expired" },
  { id: "all", label: "All" },
];

type ClassOption = {
  id: string;
  code: string;
  name: string;
  status?: string;
  openCount?: number;
  completedCount?: number;
};

function classCountText(option: ClassOption): string | undefined {
  const parts: string[] = [];
  if (option.status === "ARCHIVED") parts.push("Archived");
  if (option.openCount !== undefined) {
    parts.push(`${option.openCount} open · ${option.completedCount ?? 0} completed`);
  }
  return parts.length > 0 ? parts.join(" · ") : undefined;
}

export function TicketInbox({ initialClassId }: { initialClassId: string }) {
  const [classes, setClasses] = React.useState<StudentClass[]>([]);
  const [classId, setClassId] = React.useState(initialClassId);
  const [classesLoaded, setClassesLoaded] = React.useState(false);
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
  const [counts, setCounts] = React.useState<TicketCounts | null>(null);
  const [countsError, setCountsError] = React.useState<string | null>(null);
  const [statusBusy, setStatusBusy] = React.useState(false);
  const [statusError, setStatusError] = React.useState<string | null>(null);
  const [selectedId, setSelectedId] = React.useState<string | null>(() =>
    typeof window === "undefined"
      ? null
      : new URLSearchParams(window.location.search).get("ticket_id"),
  );

  React.useEffect(() => {
    let cancelled = false;
    studentApi
      .classes()
      .then((result) => {
        if (!cancelled) {
          setClasses(result);
          setClassError(null);
          // An archived class is no longer selectable; keep the picker on a
          // live class (or "all") instead of showing a stale URL class.
          setClassId((current) =>
            result.some((item) => item.id === current && item.status !== "ARCHIVED")
              ? current
              : "",
          );
        }
      })
      .catch((cause) => {
        if (!cancelled) {
          setClassError(cause instanceof Error ? cause.message : "Could not load classes.");
        }
      })
      .finally(() => {
        if (!cancelled) setClassesLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [retry]);

  React.useEffect(() => {
    // Wait until archived classes have been filtered out of the URL state so
    // we never request the inbox for a class the trainer can no longer see.
    if (!classesLoaded) return;
    let cancelled = false;
    listTickets({
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
          setError(cause instanceof Error ? cause.message : "Could not load tickets.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [classId, filter, page, retry, classesLoaded]);

  React.useEffect(() => {
    let cancelled = false;
    getTicketCounts()
      .then((result) => {
        if (!cancelled) {
          setCounts(result);
          setCountsError(null);
        }
      })
      .catch((cause) => {
        if (!cancelled) {
          setCountsError(
            cause instanceof Error ? cause.message : "Could not load ticket counts.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [retry]);

  function startRequest({ soft = false }: { soft?: boolean } = {}) {
    // Filter/search refreshes keep the previous rows on screen so switching
    // tabs does not flash a skeleton. Only error retries reload from scratch.
    if (!soft) setLoading(true);
    setError(null);
    setSelectedId(null);
    setSearch("");
    setStatusError(null);
  }

  const classOptions: ClassOption[] = React.useMemo(() => {
    if (counts?.items.length) {
      return counts.items.map((item) => ({
        id: item.class_id,
        code: item.class_code,
        name: item.class_name,
        status: item.class_status,
        openCount: item.open_count,
        completedCount: item.completed_count,
      }));
    }
    return classes
      .filter((item) => item.status !== "ARCHIVED")
      .map((item) => ({
        id: item.id,
        code: item.code,
        name: item.name,
        status: item.status,
      }));
  }, [counts, classes]);

  const query = search.trim().toLowerCase();
  const visible = error
    ? []
    : (data?.items ?? []).filter(
        (ticket) =>
          !query ||
          [ticket.id, ticket.question, ticket.student_name, ticket.class_code].some((value) =>
            value.toLowerCase().includes(query),
          ),
      );
  const selected = visible.find((ticket) => ticket.id === selectedId) ?? visible[0];
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / (data?.page_size ?? 20)));
  const classSelectOptions: AppSelectOption[] = React.useMemo(
    () => [
      {
        value: "",
        label: "All assigned classes",
        description: counts
          ? `${counts.open_total} open · ${counts.completed_total} completed`
          : undefined,
      },
      ...classOptions.map((item) => ({
        value: item.id,
        label: `${item.code} · ${item.name}`,
        description: classCountText(item),
      })),
    ],
    [classOptions, counts],
  );
  // Archived classes are removed from the picker; fall back to "all" if the
  // current URL still points at one.
  const classSelectValue = classSelectOptions.some((item) => item.value === classId)
    ? classId
    : "";

  async function changeStatus(action: "resolve" | "reopen") {
    if (!selected) return;
    setStatusBusy(true);
    setStatusError(null);
    try {
      if (action === "resolve") await resolveTicket(selected.id);
      else await reopenTicket(selected.id);
      // Keep the ticket in view after its status changes.
      if (filter !== "all") setFilter(action === "resolve" ? "RESOLVED" : "ANSWERED");
      setRetry((value) => value + 1);
    } catch (cause) {
      setStatusError(cause instanceof Error ? cause.message : "Could not update the ticket.");
    } finally {
      setStatusBusy(false);
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
        <p role="status" className="p-4 text-sm text-[#6F6F6F]">
          {query ? "No tickets match this search on this page." : "No tickets match these filters."}
        </p>
      ) : (
        visible.map((ticket) => (
          <button
            key={ticket.id}
            type="button"
            aria-pressed={selected?.id === ticket.id}
            onClick={() => {
              setSelectedId(ticket.id);
              setReply("");
              setReplyError(null);
              setStatusError(null);
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
              <time dateTime={ticket.created_at} className="text-[11px] text-[#6F6F6F]">
                {formatTicketDate(ticket.created_at)}
              </time>
            </span>
            <span className="mt-1 line-clamp-2 break-words text-sm font-medium text-[#111111]">
              {ticket.question}
            </span>
            <span className="mt-0.5 text-[11.5px] text-[#5A5A5A]">
              {ticket.student_name} · {ticket.class_code}
              {ticket.class_status === "ARCHIVED" ? " · Archived" : ""} ·{" "}
              {ticket.replies.length} {ticket.replies.length === 1 ? "message" : "messages"}
            </span>
            {ticket.escalated_to_name && (
              <span className="mt-0.5 text-[11px] font-semibold text-amber-700">
                Escalated to {ticket.escalated_to_name}
              </span>
            )}
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
    <div className="space-y-4">
      {(classError || countsError) && (
        <div role="alert" className="flex flex-wrap items-center gap-2 text-sm text-red-700">
          {classError || countsError}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              startRequest();
              setRetry((value) => value + 1);
            }}
          >
            Retry
          </Button>
        </div>
      )}
      <TicketsInboxLayout
        title="Class Tickets"
        subtitle="Student questions for your assigned classes. Newest first."
        titleBadge={
          !loading && !error && data ? (
            <span className="text-xs text-[#6F6F6F]">
              {data.total} {data.total === 1 ? "ticket" : "tickets"}
            </span>
          ) : undefined
        }
        headerActions={
          <label
            htmlFor="inbox-class"
            className="flex flex-wrap items-center gap-2 text-[13px] font-medium text-[#5A5A5A]"
          >
            Class
            <AppSelect
              id="inbox-class"
              value={classSelectValue}
              onValueChange={(value) => {
                startRequest({ soft: true });
                setClassId(value);
                setPage(1);
              }}
              options={classSelectOptions}
              placeholder="All assigned classes"
              aria-label="Filter tickets by class"
              size="sm"
              triggerClassName="w-[380px] max-w-full"
              contentClassName="min-w-[340px]"
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
        searchPlaceholder="Search this page"
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
              <header className="border-b border-[#E5E5E5] bg-[#FAFAFA] px-5 py-4">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <TicketStatusBadge status={selected.status} />
                  <span className="text-xs text-[#5A5A5A]">
                    {selected.class_code} · {selected.class_name}
                  </span>
                  {selected.class_status === "ARCHIVED" && <ArchivedClassBadge />}
                  <span className="text-xs text-[#6F6F6F]">by {selected.student_name}</span>
                  <time dateTime={selected.created_at} className="text-xs text-[#6F6F6F]">
                    {formatTicketDate(selected.created_at)}
                  </time>
                </div>
                <h2 className="mt-2 text-lg font-semibold leading-snug text-[#111111]">
                  {selected.question}
                </h2>
                <p className="mt-1 break-all font-mono text-[10px] text-[#6F6F6F]">
                  Ticket {selected.id}
                </p>
                {selected.escalated_to_name && (
                  <p className="mt-2 text-xs font-semibold text-amber-700">
                    Escalated to {selected.escalated_to_name}
                    {selected.escalated_at && (
                      <span className="font-normal text-[#6F6F6F]">
                        {" · "}
                        <time dateTime={selected.escalated_at}>
                          {formatTicketDate(selected.escalated_at)}
                        </time>
                      </span>
                    )}
                  </p>
                )}
              </header>

              <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
                {selected.original_question && (
                  <section className="space-y-1.5">
                    <h3 className="text-[11px] font-semibold uppercase tracking-wide text-[#6F6F6F]">
                      Student&apos;s original question
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
                      Agent answer
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
                      No replies yet. Write the first answer below.
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
                              ? "border-[#E5E5E5] bg-[#F7F7F7]"
                              : "ml-auto border-[#CFE0F7] bg-[#F5F9FF]",
                          )}
                        >
                          <p className="mb-1 text-[11px] font-semibold text-[#5A5A5A]">
                            {fromStudent ? "Student" : "You (trainer)"}
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

                  {selected.status === "OPEN" && (
                    <form
                      className="space-y-2 rounded-lg border border-[#DADADA] p-3"
                      onSubmit={async (event) => {
                        event.preventDefault();
                        if (!reply.trim()) return;
                        setReplyBusy(true);
                        setReplyError(null);
                        try {
                          await addTicketReply(selected.id, reply.trim());
                          setReply("");
                          // Keep the answered ticket visible in the inbox.
                          if (filter === "OPEN") setFilter("ANSWERED");
                          setRetry((value) => value + 1);
                        } catch (cause) {
                          setReplyError(
                            cause instanceof Error ? cause.message : "Could not send your answer.",
                          );
                        } finally {
                          setReplyBusy(false);
                        }
                      }}
                    >
                      <label
                        className="block space-y-1 text-sm font-medium text-[#111111]"
                        htmlFor="ticket-teacher-reply"
                      >
                        Reply to student
                        <textarea
                          id="ticket-teacher-reply"
                          rows={4}
                          maxLength={10000}
                          value={reply}
                          onChange={(event) => setReply(event.target.value)}
                          className="mt-1 w-full resize-y rounded-md border border-[#DADADA] px-3 py-2 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                        />
                      </label>
                      {replyError && (
                        <p role="alert" className="text-sm text-red-700">
                          {replyError}
                        </p>
                      )}
                      <div className="flex justify-end">
                        <Button type="submit" disabled={replyBusy || !reply.trim()}>
                          {replyBusy ? "Sending…" : "Send answer"}
                        </Button>
                      </div>
                    </form>
                  )}
                </section>
              </div>

              <footer className="border-t border-[#E5E5E5] bg-white px-5 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-[#6F6F6F]">
                    {selected.status === "OPEN" && "Waiting for your answer."}
                    {selected.status === "ANSWERED" &&
                      "Answered. Mark it resolved when the student no longer needs help."}
                    {selected.status === "RESOLVED" && "This ticket is completed."}
                    {selected.status === "EXPIRED" &&
                      "This ticket expired after seven days without an answer."}
                  </p>
                  <div className="flex items-center gap-2">
                    {(selected.status === "OPEN" || selected.status === "ANSWERED") && (
                      <Button
                        type="button"
                        disabled={statusBusy}
                        onClick={() => void changeStatus("resolve")}
                      >
                        {statusBusy ? "Saving…" : "Mark resolved"}
                      </Button>
                    )}
                    {selected.status === "RESOLVED" && (
                      <Button
                        type="button"
                        variant="outline"
                        disabled={statusBusy}
                        onClick={() => void changeStatus("reopen")}
                      >
                        {statusBusy ? "Saving…" : "Reopen ticket"}
                      </Button>
                    )}
                  </div>
                </div>
                {statusError && (
                  <p role="alert" className="mt-2 text-sm text-red-700">
                    {statusError}
                  </p>
                )}
              </footer>
            </article>
          ) : (
            <div className="p-6 text-sm text-[#6F6F6F]">
              Select a ticket from the list to read it.
            </div>
          )
        }
      />
    </div>
  );
}
