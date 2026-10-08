"use client";

import * as React from "react";
import { AuthGuard } from "@/components/ui/auth-guard";
import { Navbar } from "@/components/ui/navbar";
import { Sidebar } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";

/**
 * Chrome for every authenticated route: navbar + role-based sidebar + main.
 * Routes rendered outside the shell (e.g. /login) simply do not use it.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      {({ role, signOut }) => (
        <div className="flex min-h-screen flex-col bg-background">
          <Navbar role={role} signOut={signOut} />
          <div className="flex min-h-0 flex-1">
            <Sidebar role={role} />
            <main className="min-w-0 flex-1 overflow-y-auto">
              <div className="mx-auto w-full max-w-6xl px-4 py-6 lg:px-8 lg:py-8">
                {children}
              </div>
            </main>
          </div>
          <Toaster position="top-right" richColors />
        </div>
      )}
    </AuthGuard>
  );
}
