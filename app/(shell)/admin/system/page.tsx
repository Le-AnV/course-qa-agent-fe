"use client";

import * as React from "react";
import { Activity, Database, RefreshCw, Server, Sparkles } from "lucide-react";
import { adminApi, type HealthComponent, type SystemHealth } from "@/lib/admin-api";
import { AdminPageShell, ADMIN_CARD } from "@/components/shared/AdminPageShell";

const COMPONENT_META: Record<string, { label: string; blurb: string; icon: React.ReactNode }> = {
  db: {
    label: "Database",
    blurb: "PostgreSQL — accounts, classes, documents",
    icon: <Database className="h-4 w-4" />,
  },
  qdrant: {
    label: "Vector store",
    blurb: "Qdrant — document embeddings for retrieval",
    icon: <Server className="h-4 w-4" />,
  },
  llm: {
    label: "AI model",
    blurb: "Google Gemini — answer generation",
    icon: <Sparkles className="h-4 w-4" />,
  },
};

function metaFor(name: string) {
  return COMPONENT_META[name] ?? { label: name, blurb: "", icon: <Server className="h-4 w-4" /> };
}

function StatusBadge({ component }: { component: HealthComponent }) {
  const label = component.healthy
    ? component.status === "configured"
      ? "Configured"
      : "Healthy"
    : component.status === "unconfigured"
      ? "Not configured"
      : "Down";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold border ${
        component.healthy
          ? "bg-white text-[#111111] border-[#CFCFCF]"
          : "bg-white text-[#9D4C38] border-[#DFB2A6]"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${component.healthy ? "bg-[#4B9E76]" : "bg-[#C4644C]"}`} />
      {label}
    </span>
  );
}

export default function AdminSystemPage() {
  const [health, setHealth] = React.useState<SystemHealth | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [checkedAt, setCheckedAt] = React.useState<string | null>(null);
  const [auto, setAuto] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.systemHealth();
      setHealth(data);
      setCheckedAt(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load system health");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => void load(), 30000);
    return () => clearInterval(id);
  }, [auto, load]);

  const allHealthy = health?.status === "ok";

  return (
    <AdminPageShell
      title="System Health"
      subtitle="Live status of the database, vector store and AI model."
      actions={
        <>
          <label className="flex items-center gap-2 px-3 py-2 text-[13px] text-[#111111]">
            <input
              type="checkbox"
              checked={auto}
              onChange={(e) => setAuto(e.target.checked)}
              className="h-4 w-4 rounded"
            />
            Auto every 30s
          </label>
          <button
            onClick={() => void load()}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 border border-[#CFCFCF] bg-white text-[#111111] shadow-xs hover:bg-[#F7F7F7] rounded-[8px] text-[13px] font-semibold transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </>
      }
    >
      {error && (
        <div className="bg-white border border-[#DFB2A6] rounded-xl p-4 text-[#9D4C38] text-[13px]">
          {error}
          <button onClick={() => void load()} className="ml-2 underline">Retry</button>
        </div>
      )}

      {/* Overall roll-up */}
      <div className={`${ADMIN_CARD} p-5 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full ${
              allHealthy ? "bg-[#F7F7F7]" : "bg-[#F7F7F7]"
            }`}
          >
            <Activity className={`h-5 w-5 ${allHealthy ? "text-[#3B7D5D]" : "text-[#C4644C]"}`} />
          </div>
          <div>
            <p className="text-[15px] font-bold text-[#111111]">
              {loading && !health ? "Checking…" : allHealthy ? "All systems operational" : "Degraded"}
            </p>
            <p className="text-[12.5px] text-[#5A5A5A]">
              {checkedAt ? `Last checked ${checkedAt}` : "—"}
            </p>
          </div>
        </div>
        {health && (
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold border ${
              allHealthy
                ? "bg-white text-[#3B7D5D] border-[#C8E2D5]"
                : "bg-white text-[#9D4C38] border-[#DFB2A6]"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${allHealthy ? "bg-[#4B9E76]" : "bg-[#C4644C]"}`} />
            {health.status === "ok" ? "OK" : "DEGRADED"}
          </span>
        )}
      </div>

      {/* Per-component cards */}
      {loading && !health ? (
        <div className={`${ADMIN_CARD} p-8 text-center text-[#5A5A5A] text-[13px]`}>
          Loading system health…
        </div>
      ) : (
        <div className="grid gap-3">
          {health?.components.map((component) => {
            const meta = metaFor(component.name);
            return (
              <div key={component.name} className={`${ADMIN_CARD} p-5 flex items-center justify-between gap-4`}>
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                      component.healthy
                        ? "bg-[#F7F7F7] text-[#111111]"
                        : "bg-white text-[#C4644C]"
                    }`}
                  >
                    {meta.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] font-bold text-[#111111]">{meta.label}</p>
                    <p className="text-[12.5px] text-[#5A5A5A] truncate">
                      {component.detail || meta.blurb}
                    </p>
                  </div>
                </div>
                <StatusBadge component={component} />
              </div>
            );
          })}
        </div>
      )}

      <p className="text-[12px] text-[#6F6F6F]">
        Health checks run server-side; secrets are never returned to the browser.
      </p>
    </AdminPageShell>
  );
}
