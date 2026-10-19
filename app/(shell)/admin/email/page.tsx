"use client";

import * as React from "react";
import { adminApi, type EmailConfig, type EmailEntry, type EmailStats } from "@/lib/admin-api";
import { AdminPageShell, ADMIN_CARD } from "@/components/shared/AdminPageShell";

const STATUS_DOT: Record<string, string> = {
  sent: "bg-[#4B9E76]",
  pending: "bg-[#B4881F]",
  failed: "bg-[#C4644C]",
};

type DrainState = { running: boolean; done: number; total: number; sent: number; failed: number };

/** Drain progress comes from the server, so a reload still shows "running". */
function drainFromStats(stats: EmailStats): DrainState {
  return {
    running: Boolean(stats.draining),
    done: stats.drain_done ?? 0,
    total: stats.drain_total ?? 0,
    sent: stats.drain_sent ?? 0,
    failed: stats.drain_failed ?? 0,
  };
}

/**
 * Email sender (AC-08, AC-09, AI-105) — canonical admin surface.
 * Same 960 container + table grammar as Users/Classes.
 */
export default function AdminEmailPage() {
  const [config, setConfig] = React.useState<EmailConfig | null>(null);
  const [stats, setStats] = React.useState<EmailStats | null>(null);
  const [queue, setQueue] = React.useState<EmailEntry[]>([]);
  const [queueFilter, setQueueFilter] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  const [host, setHost] = React.useState("");
  const [port, setPort] = React.useState("");
  const [sender, setSender] = React.useState("");
  const [appPassword, setAppPassword] = React.useState("");
  const [rate, setRate] = React.useState("");
  const [dryRun, setDryRun] = React.useState(true);
  const [testTo, setTestTo] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [testing, setTesting] = React.useState(false);
  const [processing, setProcessing] = React.useState(false);
  const [drain, setDrain] = React.useState<DrainState | null>(null);
  const draining = drain?.running ?? false;

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [cfg, st, q] = await Promise.all([
        adminApi.emailConfig(),
        adminApi.emailStats(),
        adminApi.emailQueue(queueFilter || undefined),
      ]);
      setConfig(cfg);
      setStats(st);
      setDrain(drainFromStats(st));
      setQueue(q);
      setHost(cfg.smtp_host);
      setPort(String(cfg.smtp_port));
      setSender(cfg.smtp_sender);
      setRate(String(cfg.smtp_rate_per_minute));
      setDryRun(cfg.email_dry_run);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed.");
    } finally {
      setLoading(false);
    }
  }, [queueFilter]);

  React.useEffect(() => {
    void load();
  }, [load]);

  // While a drain is going, follow it: the button stays disabled and the counts
  // tick up until the server reports it finished.
  React.useEffect(() => {
    if (!draining) return;
    let cancelled = false;
    const timer = setInterval(async () => {
      try {
        const st = await adminApi.emailStats();
        if (cancelled) return;
        setDrain(drainFromStats(st));
        setStats((prev) =>
          prev ? { ...prev, pending: st.pending, sent: st.sent, failed: st.failed } : prev,
        );
        if (!st.draining) await load();
      } catch {
        // Transient poll failure — keep the running state, retry on the next tick.
      }
    }, 2000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [draining, load]);

  async function saveConfig(event: React.FormEvent) {
    event.preventDefault();
    setNotice(null);
    setError(null);
    setSaving(true);
    try {
      await adminApi.updateEmailConfig({
        smtp_host: host,
        smtp_port: Number(port),
        smtp_sender: sender,
        ...(appPassword ? { smtp_app_password: appPassword } : {}),
        smtp_rate_per_minute: Number(rate),
        email_dry_run: dryRun,
      });
      setAppPassword("");
      setNotice("Email sender saved. App password is stored, never shown.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function sendTest(event: React.FormEvent) {
    event.preventDefault();
    setNotice(null);
    setError(null);
    setTesting(true);
    try {
      const res = await adminApi.sendTestEmail(testTo.trim());
      setNotice(`Test email sent to ${res.sent_to} — credentials emailed via queue.`);
      setTestTo("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Test email failed.");
    } finally {
      setTesting(false);
    }
  }

  async function processNow() {
    if (processing || draining) return;
    setProcessing(true);
    setNotice(null);
    setError(null);
    // Show the running state right away; the poll picks up real progress.
    setDrain({ running: true, done: 0, total: 0, sent: 0, failed: 0 });
    try {
      const r = await adminApi.processQueue();
      setNotice(
        r.busy
          ? "A drain is already running — the button stays disabled until it finishes."
          : `Queue drained: ${r.sent} sent, ${r.failed} failed (${r.processed} processed).`,
      );
      await load();
    } catch (err) {
      setDrain(null);
      setError(err instanceof Error ? err.message : "Process failed.");
    } finally {
      setProcessing(false);
    }
  }

  async function retryOne(id: number) {
    setError(null);
    try {
      await adminApi.retryEmail(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Retry failed.");
    }
  }

  return (
    <AdminPageShell
      title="Email"
      subtitle="Gmail / Workspace app password — never a personal password, never shown (AC-08)."
      actions={
        stats ? (
          <div className="flex items-center gap-2 text-[12px] font-semibold">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white text-[#5A5A5A] border border-[#CFCFCF]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B4881F]" />
              {stats.pending} pending
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white text-[#111111] border border-[#CFCFCF]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4B9E76]" />
              {stats.sent} sent
            </span>
            {stats.failed > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white text-[#9D4C38] border border-[#DFB2A6]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C4644C]" />
                {stats.failed} failed
              </span>
            )}
          </div>
        ) : undefined
      }
    >
      {error && (
        <div className="bg-white border border-[#DFB2A6] rounded-xl p-4 text-[#9D4C38] text-[13px]">
          {error}
          <button onClick={() => void load()} className="ml-2 underline">Retry</button>
        </div>
      )}
      {notice && (
        <div className="bg-[#F7F7F7] border border-[#CFCFCF] rounded-xl p-4 text-[#111111] text-[13px]">{notice}</div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className={`${ADMIN_CARD} p-6`}>
          <h2 className="text-[16px] font-bold text-[#111111]">Sender configuration</h2>
          <p className="text-[13px] text-[#5A5A5A] mt-1 mb-4">
            {config?.has_app_password
              ? "An app password is stored (masked). Leave blank to keep it."
              : "No app password stored yet — dry-run mode only."}
          </p>
          <form onSubmit={(e) => void saveConfig(e)} className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <label className="col-span-2 block text-[13px] font-semibold text-[#111111]">
                SMTP host
                <input value={host} onChange={(e) => setHost(e.target.value)} placeholder="smtp.gmail.com"
                  className="mt-1.5 w-full bg-slate-50 border border-[#DADADA] rounded-md px-3 py-2 text-[13.5px] outline-none focus:border-[#111111]" />
              </label>
              <label className="block text-[13px] font-semibold text-[#111111]">
                Port
                <input value={port} onChange={(e) => setPort(e.target.value)} inputMode="numeric"
                  className="mt-1.5 w-full bg-slate-50 border border-[#DADADA] rounded-md px-3 py-2 text-[13.5px] outline-none focus:border-[#111111]" />
              </label>
            </div>
            <label className="block text-[13px] font-semibold text-[#111111]">
              Sender address
              <input type="email" value={sender} onChange={(e) => setSender(e.target.value)} placeholder="noreply@school.edu"
                className="mt-1.5 w-full bg-slate-50 border border-[#DADADA] rounded-md px-3 py-2 text-[13.5px] outline-none focus:border-[#111111]" />
            </label>
            <label className="block text-[13px] font-semibold text-[#111111]">
              App password <span className="font-normal text-[#5A5A5A]">(write-only, blank = keep)</span>
              <input type="password" autoComplete="new-password" value={appPassword}
                onChange={(e) => setAppPassword(e.target.value)} placeholder="xxxx xxxx xxxx xxxx"
                className="mt-1.5 w-full bg-slate-50 border border-[#DADADA] rounded-md px-3 py-2 text-[13.5px] outline-none focus:border-[#111111]" />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-[13px] font-semibold text-[#111111]">
                Max emails / minute
                <input value={rate} onChange={(e) => setRate(e.target.value)} inputMode="numeric"
                  className="mt-1.5 w-full bg-slate-50 border border-[#DADADA] rounded-md px-3 py-2 text-[13.5px] outline-none focus:border-[#111111]" />
              </label>
              <label className="flex items-end gap-2 pb-2 text-[13px] text-[#111111]">
                <input type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} className="w-4 h-4 rounded" />
                Dry-run (no real sending)
              </label>
            </div>
            <button type="submit" disabled={saving}
              className="w-full px-4 py-2 border border-[#CFCFCF] bg-white text-[#111111] shadow-xs text-[13px] font-semibold rounded-md hover:bg-[#F7F7F7] disabled:opacity-50 shadow-sm">
              {saving ? "Saving…" : "Save sender"}
            </button>
          </form>
        </div>

        <div className={`${ADMIN_CARD} p-6`}>
          <h2 className="text-[16px] font-bold text-[#111111]">Test &amp; queue</h2>
          <p className="text-[13px] text-[#5A5A5A] mt-1 mb-4">Verify the sender, then drain pending emails at the limited rate (AC-09).</p>
          <form onSubmit={(e) => void sendTest(e)} className="flex gap-2 mb-4">
            <input type="email" value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="you@gmail.com" required aria-label="Test recipient"
              className="flex-1 bg-slate-50 border border-[#DADADA] rounded-md px-3 py-2 text-[13.5px] outline-none focus:border-[#111111]" />
            <button type="submit" disabled={testing}
              className="px-4 py-2 border border-[#DADADA] bg-white text-[13px] font-semibold rounded-md hover:bg-slate-50 disabled:opacity-50 shadow-sm">
              {testing ? "Sending…" : "Send test"}
            </button>
          </form>
          <div className="flex items-center gap-2 mb-2">
            <button onClick={() => void processNow()} disabled={processing || draining}
              className="px-4 py-2 border border-[#DADADA] bg-white text-[13px] font-semibold rounded-md hover:bg-slate-50 disabled:opacity-50 shadow-sm">
              {draining
                ? drain && drain.total > 0
                  ? `Running… ${drain.done}/${drain.total}`
                  : "Running…"
                : processing
                  ? "Processing…"
                  : "Process queue now"}
            </button>
            <select value={queueFilter} onChange={(e) => setQueueFilter(e.target.value)} aria-label="Filter queue by status"
              className="bg-white border border-[#DADADA] rounded-md px-3 py-1.5 text-[12.5px] outline-none focus:border-[#111111] shadow-sm">
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          {draining && (
            <p role="status" className="text-[12px] text-[#5A5A5A] mb-4">
              Draining at the configured rate —{" "}
              {drain && drain.total > 0 ? `${drain.done}/${drain.total} processed` : "starting"}
              {drain && drain.failed > 0 ? `, ${drain.failed} failed` : ""}. The button unlocks when it finishes.
            </p>
          )}
          <p className="text-[12px] text-[#5A5A5A]">Queue shows latest 200. Failures stay here with the error — retry without re-importing.</p>
        </div>
      </div>

      <div className={`${ADMIN_CARD} overflow-hidden`}>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white border-b border-[#DADADA] text-[12px] font-medium text-[#6F6F6F]">
              <th className="px-5 py-3">To</th>
              <th className="px-5 py-3">Subject</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Error</th>
              <th className="px-5 py-3 w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#DADADA]">
            {loading ? (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-[#5A5A5A] text-[13px]">Loading queue…</td></tr>
            ) : queue.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-[#5A5A5A] text-[13px]">Queue is empty.</td></tr>
            ) : (
              queue.map((e) => (
                <tr key={e.id} className="hover:bg-[#FAFAFA]">
                  <td className="px-5 py-3 text-[13px] text-[#111111]">{e.to_email}</td>
                  <td className="px-5 py-3 text-[13px] text-[#5A5A5A] max-w-[220px] truncate">{e.subject}</td>
                  <td className="px-5 py-3">
                    <span className="flex items-center gap-2 text-[12.5px] text-[#111111]">
                      <span className={`w-2 h-2 rounded-full ${STATUS_DOT[e.status] ?? "bg-slate-400"}`} />
                      {e.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[12.5px] text-[#5A5A5A] max-w-[220px] truncate" title={e.last_error}>{e.last_error || "—"}</td>
                  <td className="px-5 py-3 text-right">
                    {e.status === "failed" && (
                      <button onClick={() => void retryOne(e.id)}
                        className="px-3 py-1.5 text-[12px] font-semibold border border-[#DADADA] rounded-md hover:bg-slate-50">Retry</button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AdminPageShell>
  );
}
