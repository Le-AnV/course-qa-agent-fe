"use client";

import * as React from "react";
import Link from "next/link";
import { adminApi, type EmailConfig, type EmailEntry, type EmailStats } from "@/lib/admin-api";
import { AdminPageShell, ADMIN_CARD } from "@/components/shared/AdminPageShell";

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
 * Email sender (AC-08, AC-09, AI-105) - canonical admin surface.
 * Delivery history lives on /admin/history.
 */
export default function AdminEmailPage() {
  const [config, setConfig] = React.useState<EmailConfig | null>(null);
  const [stats, setStats] = React.useState<EmailStats | null>(null);
  const [pending, setPending] = React.useState<EmailEntry[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);

  const [host, setHost] = React.useState("");
  const [port, setPort] = React.useState("");
  const [sender, setSender] = React.useState("");
  const [appPassword, setAppPassword] = React.useState("");
  const [rate, setRate] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [processing, setProcessing] = React.useState(false);
  const [drain, setDrain] = React.useState<DrainState | null>(null);
  const draining = drain?.running ?? false;

  const load = React.useCallback(async () => {
    try {
      setError(null);
      const [cfg, st, pendingList] = await Promise.all([
        adminApi.emailConfig(),
        adminApi.emailStats(),
        adminApi.emailQueue("pending"),
      ]);
      setConfig(cfg);
      setStats(st);
      setPending(pendingList.slice(0, 5));
      setDrain(drainFromStats(st));
      setHost(cfg.smtp_host);
      setPort(String(cfg.smtp_port));
      setSender(cfg.smtp_sender);
      setRate(String(cfg.smtp_rate_per_minute));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed.");
    }
  }, []);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-time fetch; load() only sets state after await.
    void load();
  }, [load]);

  // While a drain is going, follow it: the button stays disabled and the counts
  // tick up until the server reports it finished.
  React.useEffect(() => {
    if (!draining) return;
    let cancelled = false;
    const timer = setInterval(async () => {
      try {
        const [st, pendingList] = await Promise.all([
          adminApi.emailStats(),
          adminApi.emailQueue("pending"),
        ]);
        if (cancelled) return;
        setDrain(drainFromStats(st));
        setPending(pendingList.slice(0, 5));
        setStats((prev) =>
          prev ? { ...prev, pending: st.pending, sent: st.sent, failed: st.failed } : prev,
        );
        if (!st.draining) await load();
      } catch {
        // Transient poll failure - keep the running state, retry on the next tick.
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
          ? "A send run is already in progress - the button stays disabled until it finishes."
          : `Queue sent: ${r.sent} delivered, ${r.failed} failed (${r.processed} processed).`,
      );
      await load();
    } catch (err) {
      setDrain(null);
      setError(err instanceof Error ? err.message : "Send failed.");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <AdminPageShell
      title="Email"
      subtitle="Gmail / Workspace app password - every queued email is delivered for real (AC-08)."
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
              : "No app password stored yet - sending will fail until one is set."}
          </p>
          {config?.email_dry_run && (
            <p role="status" className="mb-4 text-[12px] text-[#9D4C38]">
              Dry-run is still enabled in system config: emails are marked sent without being delivered.
            </p>
          )}
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
            </div>
            <button type="submit" disabled={saving}
              className="w-full px-4 py-2 border border-[#CFCFCF] bg-white text-[#111111] shadow-xs text-[13px] font-semibold rounded-md hover:bg-[#F7F7F7] disabled:opacity-50 shadow-sm">
              {saving ? "Saving..." : "Save sender"}
            </button>
          </form>
        </div>

        <div className={`${ADMIN_CARD} p-6`}>
          <h2 className="text-[16px] font-bold text-[#111111]">Send queue</h2>
          <p className="text-[13px] text-[#5A5A5A] mt-1 mb-4">
            Deliver every pending email for real, paced at the configured rate (AC-09).
          </p>
          <div className="flex items-center gap-2 mb-3">
            <button onClick={() => void processNow()} disabled={processing || draining}
              className="px-4 py-2 border border-[#DADADA] bg-white text-[13px] font-semibold rounded-md hover:bg-slate-50 disabled:opacity-50 shadow-sm">
              {draining
                ? drain && drain.total > 0
                  ? `Sending... ${drain.done}/${drain.total}`
                  : "Sending..."
                : processing
                  ? "Sending..."
                  : "Send pending emails"}
            </button>
            <Link href="/admin/history"
              className="px-4 py-2 border border-[#DADADA] bg-white text-[13px] font-semibold rounded-md hover:bg-slate-50 shadow-sm">
              View history
            </Link>
          </div>
          {draining && (
            <p role="status" className="text-[12px] text-[#5A5A5A] mb-3">
              Sending at the configured rate -{" "}
              {drain && drain.total > 0 ? `${drain.done}/${drain.total} processed` : "starting"}
              {drain && drain.failed > 0 ? `, ${drain.failed} failed` : ""}. The button unlocks when it finishes.
            </p>
          )}
          <div className="h-[210px] rounded-md border border-[#E4E4E4] bg-[#FAFAFA] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-3 py-2 border-b border-[#E4E4E4] text-[12px] font-semibold text-[#5A5A5A]">
              <span>Pending</span>
              <span>{stats?.pending ?? pending.length}</span>
            </div>
            {pending.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-[12px] text-[#8A8A8A]">
                No pending emails.
              </div>
            ) : (
              <ul className="flex-1 divide-y divide-[#ECECEC] overflow-hidden">
                {pending.map((entry) => (
                  <li key={entry.id} className="flex items-center justify-between gap-3 px-3 py-2">
                    <span className="truncate text-[12.5px] text-[#111111]">{entry.to_email}</span>
                    <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-[#E4D3A8] bg-white px-2 py-0.5 text-[11px] font-semibold text-[#8A6A1F]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#B4881F]" />
                      pending
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <p className="text-[12px] text-[#5A5A5A] mt-3">
            Sent and failed mail live in{" "}
            <Link href="/admin/history" className="font-semibold text-[#111111] hover:underline">
              History
            </Link>
            . Failures can be retried there.
          </p>
        </div>
      </div>
    </AdminPageShell>
  );
}
