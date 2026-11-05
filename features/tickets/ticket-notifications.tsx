"use client";

import * as React from "react";
import { Bell, RefreshCw, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { listMyTickets, listTickets, type TicketInboxItem } from "./api";
import { latestUnreadReply } from "./unread-replies";

type Audience = "trainer" | "student" | null;

type TicketNotificationsValue = {
  audience: Audience;
  newReplyVersion: number;
  tickets: TicketInboxItem[];
  total: number;
  loading: boolean;
  error: string | null;
  open: boolean;
  setOpen: (open: boolean) => void;
  noticeCount: number | null;
  noticeVisible: boolean;
  dismissNotice: () => void;
  refresh: () => Promise<number>;
};

const TicketNotificationsContext = React.createContext<TicketNotificationsValue | null>(null);
const AUTO_DISMISS_MS = 4_000;

export function ticketNotificationHref(ticket: Pick<TicketInboxItem, "id" | "class_id">, audience: "trainer" | "student" = "trainer"): string {
  return `/${audience === "student" ? "student" : "teacher"}/class/${ticket.class_id}/tickets?ticket_id=${encodeURIComponent(ticket.id)}`;
}

export function TicketNotificationsProvider({
  children,
  audience,
}: {
  children: React.ReactNode;
  audience: Audience;
}) {
  const pathname = usePathname();
  const [tickets, setTickets] = React.useState<TicketInboxItem[]>([]);
  const [total, setTotal] = React.useState(0);
  const [newReplyVersion, setNewReplyVersion] = React.useState(0);
  const previousReplies = React.useRef<Map<string, string>>(new Map());
  const homeNoticeShown = React.useRef(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [openPath, setOpenPath] = React.useState<string | null>(null);
  const [noticeCount, setNoticeCount] = React.useState<number | null>(null);
  const [noticeVisible, setNoticeVisible] = React.useState(false);
  const open = openPath !== null && openPath === pathname;
  const noticeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const noticeRemovalTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const setOpen = React.useCallback((value: boolean) => {
    setOpenPath(value ? pathname : null);
  }, [pathname]);
  const showNotice = React.useCallback((count: number) => {
    if (noticeTimer.current !== null) clearTimeout(noticeTimer.current);
    if (noticeRemovalTimer.current !== null) clearTimeout(noticeRemovalTimer.current);
    setNoticeCount(count);
    setNoticeVisible(false);
    requestAnimationFrame(() => setNoticeVisible(true));
    const hideNotice = () => {
      setNoticeVisible(false);
      noticeTimer.current = null;
      noticeRemovalTimer.current = setTimeout(() => {
        setNoticeCount(null);
        noticeRemovalTimer.current = null;
      }, 200);
    };
    noticeTimer.current = setTimeout(hideNotice, AUTO_DISMISS_MS);
  }, []);
  const dismissNotice = React.useCallback(() => {
    if (noticeTimer.current === null && noticeRemovalTimer.current === null) return;
    if (noticeTimer.current !== null) clearTimeout(noticeTimer.current);
    noticeTimer.current = null;
    setNoticeVisible(false);
    noticeRemovalTimer.current = setTimeout(() => {
      setNoticeCount(null);
      noticeRemovalTimer.current = null;
    }, 200);
  }, []);
  const requestId = React.useRef(0);

  const refresh = React.useCallback(async () => {
    if (!audience) return 0;
    const currentRequest = ++requestId.current;
    setLoading(true);
    try {
      const result = audience === "student"
        ? await listMyTickets({ unread: true, page: 1, page_size: 5 })
        : await listTickets({ status: "OPEN", page: 1, page_size: 5 });
      if (currentRequest === requestId.current) {
        if (audience === "student") {
          const latest = new Map(result.items.map((ticket) => [ticket.id, latestUnreadReply(ticket)?.id ?? ""]));
          const changed = [...latest].filter(([id, replyId]) => replyId && previousReplies.current.get(id) !== replyId);
          previousReplies.current = latest;
          if (changed.length > 0) {
            setNewReplyVersion((value) => value + 1);
          }
        }
        setTickets(result.items);
        setTotal(result.total);
        setError(null);
      }
      return result.total;
    } catch (cause) {
      if (currentRequest === requestId.current) {
        setError(cause instanceof Error ? cause.message : "Could not load unanswered tickets.");
      }
      return 0;
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [audience]);

  React.useEffect(() => {
    if (!audience) return;
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- refresh reads the trainer inbox after route entry.
    void refresh().then((count) => {
      const homePath = audience === "student" ? "/student/home" : "/teacher/home";
      const isHomeEntry = pathname === homePath || (audience === "student" && pathname === "/student");
      if (active && !homeNoticeShown.current && isHomeEntry && count > 0) {
        homeNoticeShown.current = true;
        showNotice(count);
      }
    });
    const onFocus = () => { void refresh(); };
    window.addEventListener("focus", onFocus);
    const interval = audience === "student" ? window.setInterval(onFocus, 30_000) : null;
    return () => {
      active = false;
      window.removeEventListener("focus", onFocus);
      if (interval !== null) window.clearInterval(interval);
    };
  }, [audience, pathname, refresh, showNotice]);

  React.useEffect(() => () => {
    if (noticeTimer.current !== null) clearTimeout(noticeTimer.current);
    if (noticeRemovalTimer.current !== null) clearTimeout(noticeRemovalTimer.current);
  }, []);

  const value = React.useMemo(
    () => ({ audience, newReplyVersion, tickets, total, loading, error, open, setOpen, noticeCount, noticeVisible, dismissNotice, refresh }),
    [audience, newReplyVersion, tickets, total, loading, error, open, refresh, setOpen, noticeCount, noticeVisible, dismissNotice],
  );

  return (
    <TicketNotificationsContext.Provider value={value}>
      {children}
    </TicketNotificationsContext.Provider>
  );
}

export function useTicketNotifications() {
  return React.useContext(TicketNotificationsContext);
}

export function TicketNotificationBell({ placement = "up" }: { placement?: "up" | "down" }) {
  const notifications = React.useContext(TicketNotificationsContext);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const panelId = React.useId();

  React.useEffect(() => {
    if (!notifications?.open) return;
    const closeOnOutside = (event: PointerEvent) => {
      if (!rootRef.current || rootRef.current.getClientRects().length === 0) return;
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) {
        notifications.setOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") notifications.setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [notifications]);

  if (!notifications) return null;

  const panelPosition = placement === "up" ? "bottom-full left-0 mb-2" : "right-0 top-full mt-2";

  return (
    <div ref={rootRef} className="relative shrink-0">
      {notifications.noticeCount !== null && (
        <aside
          role="status"
          style={{ animation: "ticket-notification-pop 420ms cubic-bezier(0.16,1,0.3,1)" }}
          className={`absolute z-[100] flex w-max max-w-[min(280px,calc(100vw-2rem))] items-center gap-3 rounded-lg border border-[#DADADA] bg-white px-4 py-3 text-[13px] text-[#111111] shadow-lg transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ticket-notification-motion ${panelPosition} ${notifications.noticeVisible ? "translate-y-0 scale-100 opacity-100" : placement === "up" ? "translate-y-1 scale-[0.97] opacity-0" : "-translate-y-1 scale-[0.97] opacity-0"}`}
        >
          <Bell className="h-4 w-4 shrink-0 text-[#5A5A5A]" aria-hidden="true" />
          <span>{notifications.audience === "student"
            ? `You have ${notifications.noticeCount} new ${notifications.noticeCount === 1 ? "reply" : "replies"} from your instructor.`
            : `You have ${notifications.noticeCount} unanswered ${notifications.noticeCount === 1 ? "ticket" : "tickets"}.`}</span>
          <button
            type="button"
            aria-label="Dismiss ticket notification"
            onClick={notifications.dismissNotice}
            className="ml-1 flex h-6 w-6 shrink-0 items-center justify-center rounded text-[#6F6F6F] hover:bg-[#F7F7F7]"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </aside>
      )}
      <button
        type="button"
        aria-label={notifications.total ? `${notifications.audience === "student" ? "New teacher replies" : "Unanswered tickets"}: ${notifications.total}` : "Ticket notifications"}
        aria-haspopup="dialog"
        aria-expanded={notifications.open}
        aria-controls={panelId}
        onClick={() => {
          notifications.dismissNotice();
          notifications.setOpen(!notifications.open);
        }}
        className="relative flex h-9 w-9 items-center justify-center rounded-md text-[#5A5A5A] transition-colors hover:bg-[#F7F7F7] hover:text-[#111111] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111111]"
      >
        <Bell className="h-4 w-4" aria-hidden="true" />
        {notifications.total > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-[#B74B3A] px-1 text-[9px] font-bold leading-none text-white">
            {notifications.total > 99 ? "99+" : notifications.total}
          </span>
        )}
      </button>

      {notifications.open && (
        <section
          id={panelId}
          role="dialog"
          aria-label={notifications.audience === "student" ? "New teacher replies" : "Unanswered tickets"}
          className={`absolute z-[70] w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-[#DADADA] bg-white shadow-lg ticket-notification-motion ${panelPosition}`}
          style={{ animation: "ticket-notification-pop 420ms cubic-bezier(0.16,1,0.3,1)" }}
        >
          <header className="flex items-center justify-between border-b border-[#EDEDED] px-4 py-3">
            <div>
              <h2 className="text-[13px] font-bold text-[#111111]">{notifications.audience === "student" ? "New teacher replies" : "Unanswered tickets"}</h2>
              <p className="mt-0.5 text-[11px] text-[#6F6F6F]">
                {notifications.audience === "student" ? `${notifications.total} tickets with new replies` : `${notifications.total} waiting for your reply`}
              </p>
            </div>
            <button
              type="button"
              aria-label={notifications.audience === "student" ? "Refresh new replies" : "Refresh unanswered tickets"}
              onClick={() => void notifications.refresh()}
              disabled={notifications.loading}
              className="flex h-8 w-8 items-center justify-center rounded-md text-[#6F6F6F] hover:bg-[#F7F7F7] disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${notifications.loading ? "animate-spin" : ""}`} />
            </button>
          </header>

          {notifications.error ? (
            <div className="p-4 text-[12px] text-[#9D4C38]" role="alert">
              <p>{notifications.error}</p>
              <button type="button" onClick={() => void notifications.refresh()} className="mt-2 font-semibold text-[#111111] underline">
                Try again
              </button>
            </div>
          ) : notifications.loading && notifications.tickets.length === 0 ? (
            <p className="p-4 text-[12px] text-[#6F6F6F]" role="status">Loading tickets…</p>
          ) : notifications.tickets.length === 0 ? (
            <p className="p-4 text-[12px] text-[#6F6F6F]" role="status">{notifications.audience === "student" ? "No new replies." : "No unanswered tickets."}</p>
          ) : (
            <ul className="max-h-[min(420px,65vh)] overflow-y-auto">
              {(notifications.audience === "student"
                ? [...notifications.tickets].sort((a, b) =>
                    Date.parse(latestUnreadReply(b)?.created_at ?? b.created_at)
                    - Date.parse(latestUnreadReply(a)?.created_at ?? a.created_at),
                  )
                : notifications.tickets).map((ticket) => (
                <li key={ticket.id} className="border-b border-[#F0F0F0] last:border-b-0">
                  <a
                    href={ticketNotificationHref(ticket, notifications.audience === "student" ? "student" : "trainer")}
                    onClick={() => {
                      notifications.dismissNotice();
                      notifications.setOpen(false);
                    }}
                    className="block px-4 py-3 transition-colors hover:bg-[#FAFAFA] focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#111111]"
                  >
                    <span className="block truncate text-[11px] font-semibold text-[#5A5A5A]">
                      {notifications.audience === "student" ? ticket.class_code : `${ticket.student_name} · ${ticket.class_code}`}
                    </span>
                    <span className="mt-1 block line-clamp-2 break-words text-[12.5px] font-semibold text-[#111111]">
                      {ticket.question}
                    </span>
                    <time dateTime={notifications.audience === "student" ? latestUnreadReply(ticket)?.created_at ?? ticket.created_at : ticket.created_at} className="mt-1 block text-[10.5px] text-[#6F6F6F]">
                      {new Date(notifications.audience === "student" ? latestUnreadReply(ticket)?.created_at ?? ticket.created_at : ticket.created_at).toLocaleString()}
                    </time>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
