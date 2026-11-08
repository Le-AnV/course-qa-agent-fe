"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { AuthGuard } from "@/components/ui/auth-guard";
import { Toaster } from "@/components/ui/sonner";
import { AppSidebar } from "@/components/shared/Sidebar";
import { MobileNav } from "@/components/shared/MobileNav";
import { ProfileProvider } from "@/features/profile/profile-context";
import { TicketNotificationsProvider } from "@/features/tickets/ticket-notifications";

/**
 * Plain layout shell for the matched route.
 *
 * There is deliberately no route-level fade or slide here. The App Router
 * replaces the subtree instantly, so animating opacity from 0 paints a blank
 * frame before the new page appears (reads as a flicker), and a translate
 * changes the scrollable overflow of `main`, making the scrollbar blink. The
 * micro-interactions (pressed buttons, the tab indicator, dialogs, selects)
 * carry the motion instead.
 */
function ShellContent({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-0 w-full flex-1 flex-col">{children}</div>;
}

export function AppLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isClassWorkspace = /^\/(student|teacher)\/class\//.test(pathname ?? "");

  return (
    <AuthGuard>
      {({ role }) => (
        <ProfileProvider>
          {/* Column below lg so the mobile header sits above main in flow;
              row from lg up, where the rail takes a fixed width. */}
          <div className="flex h-screen flex-col bg-[#E7EDF5] overflow-hidden lg:flex-row">
            {/* Below lg the rail is hidden, so MobileNav owns the header. */}
            <TicketNotificationsProvider audience={role === "trainer" || role === "student" ? role : null}>
              <>
                <MobileNav role={role} />

                {/* Left Sidebar takes up space in flow */}
                <AppSidebar role={role} />
              </>

            {/* Main Content Area fills remaining space. Off-white canvas so white
                cards read as raised surfaces instead of melting into the page.
                `relative` is load-bearing: Radix Select renders a 1px absolute
                <select> at the trigger's offset, and without a positioned
                ancestor here it escapes every inner scroller and stretches the
                document, giving the whole app a second scrollbar. */}
            <main
              className={`relative flex-1 flex flex-col min-w-0 min-h-0 bg-[#E7EDF5] ${
                isClassWorkspace
                  ? "overflow-hidden"
                  : "overflow-y-auto [scrollbar-gutter:stable]"
              }`}
            >
              <ShellContent>{children}</ShellContent>
            </main>
            <Toaster position="top-right" closeButton />
            </TicketNotificationsProvider>
          </div>
        </ProfileProvider>
      )}
    </AuthGuard>
  );
}
