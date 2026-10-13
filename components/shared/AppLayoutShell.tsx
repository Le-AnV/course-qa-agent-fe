"use client";

import * as React from "react";
import { AuthGuard } from "@/components/ui/auth-guard";
import { Toaster } from "@/components/ui/sonner";
import { AppSidebar } from "@/components/shared/Sidebar";
import { ProfileProvider } from "@/features/profile/profile-context";

export function AppLayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      {({ role }) => (
        <ProfileProvider>
          <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
            {/* Left Sidebar takes up space in flow */}
            <AppSidebar role={role} unreadHome={true} />

            {/* Main Content Area fills remaining space */}
            <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
              {children}
            </main>
            <Toaster position="top-right" richColors />
          </div>
        </ProfileProvider>
      )}
    </AuthGuard>
  );
}
