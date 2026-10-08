"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AUTH_ROLE_KEY,
  AUTH_TOKEN_KEY,
  homeRouteFor,
  type Role,
} from "@/components/ui/nav-config";

/**
 * Placeholder login page.
 * The real form (submit, error copy, JWT handling) belongs to AI-25 — this page
 * only exists so the AppShell auth guard has a target to redirect to.
 * Demo shortcut: set localStorage keys `qa.auth.token` + `qa.auth.role`
 * (student | trainer | admin) and reload.
 */
export default function LoginPage() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [notice, setNotice] = React.useState<string | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setNotice(
      "Login API is not wired yet (AI-25). For now, open DevTools and set " +
        `localStorage "${AUTH_TOKEN_KEY}" and "${AUTH_ROLE_KEY}" to preview the shell.`,
    );
  }

  async function demoSignIn(role: Role) {
    localStorage.setItem(AUTH_TOKEN_KEY, "demo-token");
    localStorage.setItem(AUTH_ROLE_KEY, role);
    window.location.assign(homeRouteFor(role));
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-lg font-semibold">Course QA Agent</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in with your course account.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Email
            <Input
              type="email"
              name="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Password
            <Input
              type="password"
              name="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          <Button type="submit">Sign in</Button>
        </form>

        {notice && (
          <p className="mt-4 rounded-md border border-border bg-muted px-3 py-2 text-xs text-muted-foreground">
            {notice}
          </p>
        )}

        <div className="mt-6 border-t border-border pt-4">
          <p className="text-xs text-muted-foreground">
            Preview the shell without the backend:
          </p>
          <div className="mt-2 flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => demoSignIn("student")}
            >
              Enter as student
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => demoSignIn("trainer")}
            >
              Enter as trainer
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => demoSignIn("admin")}
            >
              Enter as admin
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
