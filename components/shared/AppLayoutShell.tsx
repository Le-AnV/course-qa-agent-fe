"use client";

import * as React from "react";
import { AuthGuard } from "@/components/ui/auth-guard";
import { Toaster } from "@/components/ui/sonner";
import { AppSidebar } from "@/components/shared/Sidebar";
import { MobileNav } from "@/components/shared/MobileNav";
import { ProfileProvider } from "@/features/profile/profile-context";

export function AppLayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      {({ role }) => (
        <ProfileProvider>
          {/* Column below lg so the mobile header sits above main in flow;
              row from lg up, where the rail takes a fixed width. */}
          <div className="flex h-screen flex-col bg-[#F5F5F5] overflow-hidden lg:flex-row">
            {/* Below lg the rail is hidden, so MobileNav owns the header. */}
            <MobileNav role={role} />

            {/* Left Sidebar takes up space in flow */}
            <AppSidebar role={role} />

            {/* Main Content Area fills remaining space. Off-white canvas so white
                cards read as raised surfaces instead of melting into the page. */}
            <main className="flex-1 flex flex-col min-w-0 min-h-0 overflow-y-auto bg-[#F5F5F5]">
              {children}
            </main>
            <Toaster position="top-right" closeButton />
          </div>
        </ProfileProvider>
      )}
    </AuthGuard>
  );
}
