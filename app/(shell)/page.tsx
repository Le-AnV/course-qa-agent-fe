"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type HealthState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ok"; payload: unknown }
  | { status: "error"; message: string };

export default function Home() {
  const [health, setHealth] = useState<HealthState>({ status: "idle" });

  async function checkHealth() {
    setHealth({ status: "loading" });
    try {
      const res = await fetch(`${API_URL}/health`);
      if (!res.ok) {
        throw new Error(`Backend responded with ${res.status}`);
      }
      setHealth({ status: "ok", payload: await res.json() });
    } catch (err) {
      setHealth({
        status: "error",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-16">
      <h1 className="text-2xl font-semibold">Course QA Agent</h1>
      <p className="text-sm text-muted-foreground">
        Project skeleton — AI-112. Backend:{" "}
        <code className="rounded bg-muted px-1 py-0.5">{API_URL}</code>
      </p>
      <Button type="button" onClick={checkHealth}>
        Check backend health
      </Button>
      {health.status === "loading" && <p>Checking…</p>}
      {health.status === "ok" && (
        <pre className="rounded-lg border border-border bg-muted p-4 text-sm">
          {JSON.stringify(health.payload, null, 2)}
        </pre>
      )}
      {health.status === "error" && (
        <p className="text-sm text-destructive">Failed: {health.message}</p>
      )}
    </div>
  );
}
