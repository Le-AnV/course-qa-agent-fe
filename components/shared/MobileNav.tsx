"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, Menu, X } from "lucide-react";
import { Role } from "@/components/ui/nav-config";
import { useAuth } from "@/components/ui/auth-guard";
import { useProfile } from "@/features/profile/profile-context";
import { initialsFor, roleBadgeLabel } from "@/features/profile/validation";
import { SidebarNavBody } from "@/components/shared/Sidebar";
import { TicketNotificationBell } from "@/features/tickets/ticket-notifications";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Below-lg companion to AppSidebar: the desktop rail is `hidden lg:flex`, so
 * without this the authenticated app has no navigation at all under 1024px.
 * Reuses SidebarNavBody so both containers stay in sync.
 */
export function MobileNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  // `leaving` keeps the panel mounted for one transition so the drawer slides
  // out instead of vanishing. Cleared by a timer (never synchronously in an
  // effect) so reduced-motion users, who get no transition, still unmount.
  const [leaving, setLeaving] = React.useState(false);
  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const auth = useAuth();
  const { profile, loading } = useProfile();
  const displayName = profile?.username ?? (loading ? "Loading…" : "Account");
  const roleLabel = roleBadgeLabel(profile?.role ?? role);
  const homeHref = role === "admin" ? "/admin/home" : role === "student" ? "/student/home" : "/teacher/home";

  const close = React.useCallback(() => {
    setOpen(false);
    setLeaving(true);
    window.setTimeout(() => setLeaving(false), 260);
  }, []);

  // Close on route change (browser back/forward included) without an effect:
  // adjusting state during render is React's sanctioned pattern for "state
  // must follow a prop that just changed".
  const [openedAt, setOpenedAt] = React.useState(pathname);
  if (open && openedAt !== pathname) {
    setOpenedAt(pathname);
    setOpen(false);
  }

  React.useEffect(() => {
    if (!open) return;
    const restoreTo = document.activeElement as HTMLElement | null;
    panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        close();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      const inside = panelRef.current.contains(active);
      if (event.shiftKey && (active === first || !inside)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !inside)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      restoreTo?.focus?.();
    };
  }, [open, close]);

  const handleLogout = () => {
    close();
    if (auth.status === "authed") {
      auth.signOut();
    }
  };

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-[#DADADA] bg-white px-4 lg:hidden">
        <button
          type="button"
          onClick={() => {
            setOpenedAt(pathname);
            setOpen(true);
          }}
          aria-label="Open navigation"
          aria-expanded={open}
          aria-controls="mobile-nav-panel"
          className="-ml-1 flex h-9 w-9 items-center justify-center rounded-md text-[#111111] transition-colors hover:bg-[#F7F7F7]"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link href={homeHref} aria-label="Go to Home" className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-[#CFCFCF] bg-white text-[#111111] shadow-xs">
            <GraduationCap className="h-4 w-4" />
          </div>
          <span className="truncate font-heading text-[14px] font-bold text-[#111111]">Course Q&amp;A</span>
        </Link>
        {role === "trainer" ? (
          <div className="ml-auto flex items-center gap-1">
            <TicketNotificationBell placement="down" />
            <Link
              href="/account"
              aria-label="Account"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F7F7F7] text-[11px] font-semibold text-[#111111]"
            >
              {initialsFor(displayName)}
            </Link>
          </div>
        ) : (
          <Link
            href="/account"
            aria-label="Account"
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-full bg-[#F7F7F7] text-[11px] font-semibold text-[#111111]"
          >
            {initialsFor(displayName)}
          </Link>
        )}
      </header>

      {(open || leaving) && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className={
              "absolute inset-0 bg-[#111111]/40 transition-opacity duration-200 motion-reduce:transition-none " +
              (open ? "opacity-100" : "opacity-0")
            }
            onClick={close}
            aria-hidden="true"
          />
          <div
            ref={panelRef}
            id="mobile-nav-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className={
              "absolute inset-y-0 left-0 flex w-[280px] max-w-[85vw] flex-col border-r border-[#DADADA] bg-white shadow-xl " +
              "transition-transform duration-200 ease-out motion-reduce:transition-none " +
              "starting:-translate-x-full " +
              (open ? "translate-x-0" : "-translate-x-full")
            }
          >
            <div className="flex items-center gap-2.5 border-b border-[#DADADA] px-4 py-4">
              <Link
                href={homeHref}
                onClick={close}
                aria-label="Go to Home"
                className="flex min-w-0 flex-1 items-center gap-2.5"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-[#CFCFCF] bg-white text-[#111111] shadow-xs">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div className="flex flex-1 flex-col justify-center overflow-hidden">
                  <span className="font-heading text-[15px] font-bold leading-none text-[#111111] mb-1">
                    Course Q&amp;A
                  </span>
                  <span className="text-[11px] font-medium leading-none text-[#5A5A5A]">
                    Syllabus Agent
                  </span>
                </div>
              </Link>
              <button
                type="button"
                onClick={close}
                aria-label="Close navigation"
                className="flex h-8 w-8 items-center justify-center rounded-md text-[#6F6F6F] transition-colors hover:bg-[#F7F7F7] hover:text-[#111111]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <SidebarNavBody
              role={role}
              onNavigate={close}
            />

            <div className="border-t border-[#DADADA] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F7F7F7] text-[11px] font-semibold text-[#111111]">
                  {initialsFor(displayName)}
                </div>
                <div className="flex flex-1 flex-col overflow-hidden">
                  <span className="truncate text-[12.5px] font-bold text-[#111111]">
                    {displayName}
                  </span>
                  <span className="text-[11px] text-[#5A5A5A]">{roleLabel}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="mt-3 w-full rounded-[8px] border border-[#CFCFCF] bg-white px-3 py-2 text-[12.5px] font-semibold text-[#9D4C38] shadow-xs transition-colors hover:bg-[#F7F7F7]"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
