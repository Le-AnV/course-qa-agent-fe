"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  AUTH_ROLE_KEY,
  AUTH_TOKEN_KEY,
  canAccessRoute,
  homeRouteFor,
  type Role,
} from "./nav-config";

export type AuthSession = {
  role: Role;
  signOut: () => void;
};

type SessionSnapshot = {
  status: "loading" | "guest" | "authed";
  role: Role | null;
};

/** Fired in-tab (sign-out, demo sign-in) so useSyncExternalStore picks it up. */
const AUTH_EVENT = "qa-auth-changed";

const SERVER_SNAPSHOT: SessionSnapshot = { status: "loading", role: null };

function readRole(raw: string | null): Role | null {
  return raw === "student" ||
    raw === "trainer" ||
    raw === "teaching_assistant" ||
    raw === "admin"
    ? raw
    : null;
}

/**
 * Cache snapshots so getSnapshot always returns the same reference for the
 * same underlying state (required by useSyncExternalStore).
 */
let cached: SessionSnapshot = SERVER_SNAPSHOT;

function readSnapshot(): SessionSnapshot {
  if (typeof window === "undefined") return SERVER_SNAPSHOT;
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const role = readRole(localStorage.getItem(AUTH_ROLE_KEY));
  const next: SessionSnapshot =
    token && role ? { status: "authed", role } : { status: "guest", role: null };
  if (
    cached.status !== next.status ||
    cached.role !== next.role
  ) {
    cached = next;
  }
  return cached;
}

function subscribe(onStoreChange: () => void): () => void {
  const handler = () => onStoreChange();
  window.addEventListener("storage", handler);
  window.addEventListener(AUTH_EVENT, handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(AUTH_EVENT, handler);
  };
}

/**
 * Client-side auth session — UX only.
 * Reads the storage contract written by AI-25's login flow; guests are bounced
 * to /login by <AuthGuard>. The backend re-checks every request (AI-27);
 * guarding a route in the browser never replaces that.
 */
function useSession(): SessionSnapshot {
  return React.useSyncExternalStore(
    subscribe,
    readSnapshot,
    () => SERVER_SNAPSHOT,
  );
}

export function useAuth():
  | { status: "loading" }
  | { status: "guest" }
  | ({ status: "authed"; role: Role } & { signOut: () => void }) {
  const router = useRouter();
  const session = useSession();

  React.useEffect(() => {
    if (session.status === "guest") router.replace("/login");
  }, [session.status, router]);

  const signOut = React.useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_ROLE_KEY);
    window.dispatchEvent(new Event(AUTH_EVENT));
    router.replace("/login");
  }, [router]);

  if (session.status === "authed") {
    return { status: "authed", role: session.role as Role, signOut };
  }
  return { status: session.status };
}

function ShellSkeleton() {
  return (
    <div className="flex min-h-screen flex-col" aria-busy="true">
      <div className="h-14 border-b border-border bg-card" />
      <div className="flex flex-1">
        <div className="hidden w-56 border-r border-border bg-sidebar lg:block" />
        <div className="flex-1 p-6">
          <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
          <div className="mt-4 h-40 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
    </div>
  );
}

/**
 * Wraps everything that must live inside the authenticated shell.
 * Renders a skeleton while the session is read, redirects guests to /login,
 * bounces roles off routes they may not see (UX only — same rules as the
 * menu, backend re-checks in AI-27), and hands the resolved session
 * (role + signOut) to its children.
 */
export function AuthGuard({
  children,
}: {
  children: (session: AuthSession) => React.ReactNode;
}) {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const role = auth.status === "authed" ? auth.role : null;

  React.useEffect(() => {
    if (role && !canAccessRoute(role, pathname)) {
      router.replace(homeRouteFor(role));
    }
  }, [role, pathname, router]);

  if (auth.status === "loading") return <ShellSkeleton />;
  if (auth.status === "guest") return null; // redirecting to /login
  if (!canAccessRoute(auth.role, pathname)) return <ShellSkeleton />; // redirecting to role home
  return <>{children({ role: auth.role, signOut: auth.signOut })}</>;
}
