"use client";

import * as React from "react";
import { adminApi, type EmailConfig, type EmailEntry, type EmailStats } from "@/lib/admin-api";
import { AdminPageShell, ADMIN_CARD } from "@/components/shared/AdminPageShell";

const STATUS_DOT: Record<string, string> = {
  sent: "bg-[#16A34A]",
  pending: "bg-amber-500",
  failed: "bg-rose-500",
};

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
    if (processing) return;
    setProcessing(true);
    setNotice(null);
    setError(null);
    try {
      const r = await adminApi.processQueue();
      setNotice(
        r.busy
          ? "Another drain is already running — wait a few seconds and reload to see results."
          : `Queue drained: ${r.sent} sent, ${r.failed} failed (${r.processed} processed).`,
      );
      await load();
    } catch (err) {
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
            <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">{stats.pending} pending</span>
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">{stats.sent} sent</span>
            {stats.failed > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">{stats.failed} failed</span>
            )}
          </div>
        ) : undefined
      }
    >
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 text-rose-700 text-[13px]">
          {error}
          <button onClick={() => void load()} className="ml-2 underline">Retry</button>
        </div>
      )}
      {notice && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-emerald-700 text-[13px]">{notice}</div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className={`${ADMIN_CARD} p-6`}>
          <h2 className="text-[16px] font-bold text-[#172033]">Sender configuration</h2>
          <p className="text-[13px] text-[#64748B] mt-1 mb-4">
            {config?.has_app_password
              ? "An app password is stored (masked). Leave blank to keep it."
              : "No app password stored yet — dry-run mode only."}
          </p>
          <form onSubmit={(e) => void saveConfig(e)} className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <label className="col-span-2 block text-[13px] font-semibold text-[#334155]">
                SMTP host
                <input value={host} onChange={(e) => setHost(e.target.value)} placeholder="smtp.gmail.com"
                  className="mt-1.5 w-full bg-slate-50 border border-[#E2E8F0] rounded-md px-3 py-2 text-[13.5px] outline-none focus:border-[#2563EB]" />
              </label>
              <label className="block text-[13px] font-semibold text-[#334155]">
                Port
                <input value={port} onChange={(e) => setPort(e.target.value)} inputMode="numeric"
                  className="mt-1.5 w-full bg-slate-50 border border-[#E2E8F0] rounded-md px-3 py-2 text-[13.5px] outline-none focus:border-[#2563EB]" />
              </label>
            </div>
            <label className="block text-[13px] font-semibold text-[#334155]">
              Sender address
              <input type="email" value={sender} onChange={(e) => setSender(e.target.value)} placeholder="noreply@school.edu"
                className="mt-1.5 w-full bg-slate-50 border border-[#E2E8F0] rounded-md px-3 py-2 text-[13.5px] outline-none focus:border-[#2563EB]" />
            </label>
            <label className="block text-[13px] font-semibold text-[#334155]">
              App password <span className="font-normal text-[#64748B]">(write-only, blank = keep)</span>
              <input type="password" autoComplete="new-password" value={appPassword}
                onChange={(e) => setAppPassword(e.target.value)} placeholder="xxxx xxxx xxxx xxxx"
                className="mt-1.5 w-full bg-slate-50 border border-[#E2E8F0] rounded-md px-3 py-2 text-[13.5px] outline-none focus:border-[#2563EB]" />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-[13px] font-semibold text-[#334155]">
                Max emails / minute
                <input value={rate} onChange={(e) => setRate(e.target.value)} inputMode="numeric"
                  className="mt-1.5 w-full bg-slate-50 border border-[#E2E8F0] rounded-md px-3 py-2 text-[13.5px] outline-none focus:border-[#2563EB]" />
              </label>
              <label className="flex items-end gap-2 pb-2 text-[13px] text-[#334155]">
                <input type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} className="w-4 h-4 rounded" />
                Dry-run (no real sending)
              </label>
            </div>
            <button type="submit" disabled={saving}
              className="w-full px-4 py-2 bg-[#2563EB] text-white text-[13px] font-semibold rounded-md hover:bg-blue-700 disabled:opacity-50 shadow-sm">
              {saving ? "Saving…" : "Save sender"}
            </button>
          </form>
        </div>

        <div className={`${ADMIN_CARD} p-6`}>
          <h2 className="text-[16px] font-bold text-[#172033]">Test &amp; queue</h2>
          <p className="text-[13px] text-[#64748B] mt-1 mb-4">Verify the sender, then drain pending emails at the limited rate (AC-09).</p>
          <form onSubmit={(e) => void sendTest(e)} className="flex gap-2 mb-4">
            <input type="email" value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="you@gmail.com" required aria-label="Test recipient"
              className="flex-1 bg-slate-50 border border-[#E2E8F0] rounded-md px-3 py-2 text-[13.5px] outline-none focus:border-[#2563EB]" />
            <button type="submit" disabled={testing}
              className="px-4 py-2 border border-[#E2E8F0] bg-white text-[13px] font-semibold rounded-md hover:bg-slate-50 disabled:opacity-50 shadow-sm">
              {testing ? "Sending…" : "Send test"}
            </button>
          </form>
          <div className="flex items-center gap-2 mb-4">
            <button onClick={() => void processNow()} disabled={processing}
              className="px-4 py-2 border border-[#E2E8F0] bg-white text-[13px] font-semibold rounded-md hover:bg-slate-50 disabled:opacity-50 shadow-sm">
              {processing ? "Processing…" : "Process queue now"}
            </button>
            <select value={queueFilter} onChange={(e) => setQueueFilter(e.target.value)} aria-label="Filter queue by status"
              className="bg-white border border-[#E2E8F0] rounded-md px-3 py-1.5 text-[12.5px] outline-none focus:border-[#2563EB] shadow-sm">
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <p className="text-[12px] text-[#64748B]">Queue shows latest 200. Failures stay here with the error — retry without re-importing.</p>
        </div>
      </div>

      <div className={`${ADMIN_CARD} overflow-hidden`}>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-[#E2E8F0] text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
              <th className="px-5 py-3">To</th>
              <th className="px-5 py-3">Subject</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Error</th>
              <th className="px-5 py-3 w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {loading ? (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-[#64748B] text-[13px]">Loading queue…</td></tr>
            ) : queue.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-[#64748B] text-[13px]">Queue is empty.</td></tr>
            ) : (
              queue.map((e) => (
                <tr key={e.id} className="hover:bg-[#F8FAFC]">
                  <td className="px-5 py-3 text-[13px] text-[#172033]">{e.to_email}</td>
                  <td className="px-5 py-3 text-[13px] text-[#64748B] max-w-[220px] truncate">{e.subject}</td>
                  <td className="px-5 py-3">
                    <span className="flex items-center gap-2 text-[12.5px] text-[#334155]">
                      <span className={`w-2 h-2 rounded-full ${STATUS_DOT[e.status] ?? "bg-slate-400"}`} />
                      {e.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[12.5px] text-[#64748B] max-w-[220px] truncate" title={e.last_error}>{e.last_error || "—"}</td>
                  <td className="px-5 py-3 text-right">
                    {e.status === "failed" && (
                      <button onClick={() => void retryOne(e.id)}
                        className="px-3 py-1.5 text-[12px] font-semibold border border-[#E2E8F0] rounded-md hover:bg-slate-50">Retry</button>
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
