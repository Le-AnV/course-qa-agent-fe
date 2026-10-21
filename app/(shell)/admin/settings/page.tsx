"use client";

import * as React from "react";
import Link from "next/link";
import { adminApi, type AdminSettings, type EmailConfig, type RetrievalConfig } from "@/lib/admin-api";
import { AdminPageShell, ADMIN_CARD } from "@/components/shared/AdminPageShell";

export default function AdminSettingsPage() {
  const [settings, setSettings] = React.useState<AdminSettings | null>(null);
  const [config, setConfig] = React.useState<EmailConfig | null>(null);
  const [retrieval, setRetrieval] = React.useState<RetrievalConfig | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [savingRetrieval, setSavingRetrieval] = React.useState(false);
  const [testingLlm, setTestingLlm] = React.useState(false);
  const [testingEmail, setTestingEmail] = React.useState(false);

  const [host, setHost] = React.useState("");
  const [port, setPort] = React.useState("");
  const [sender, setSender] = React.useState("");
  const [appPassword, setAppPassword] = React.useState("");
  const [rate, setRate] = React.useState("");
  const [dryRun, setDryRun] = React.useState(true);
  const [testTo, setTestTo] = React.useState("");
  const [threshold, setThreshold] = React.useState("");

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [s, c, r] = await Promise.all([
        adminApi.adminSettings(),
        adminApi.emailConfig(),
        adminApi.retrievalConfig(),
      ]);
      setSettings(s);
      setConfig(c);
      setRetrieval(r);
      setThreshold(String(r.threshold));
      setHost(c.smtp_host);
      setPort(String(c.smtp_port));
      setSender(c.smtp_sender);
      setRate(String(c.smtp_rate_per_minute));
      setDryRun(c.email_dry_run);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function saveEmail(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await adminApi.updateEmailConfig({
        smtp_host: host,
        smtp_port: Number(port),
        smtp_sender: sender,
        ...(appPassword ? { smtp_app_password: appPassword } : {}),
        smtp_rate_per_minute: Number(rate),
        email_dry_run: dryRun,
      });
      setConfig(updated);
      setAppPassword("");
      setNotice("Email sender saved. App password is write-only, never shown.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function saveRetrieval(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(threshold);
    if (!Number.isFinite(value) || value < 0 || value > 1) {
      setError("Threshold must be a number between 0 and 1.");
      return;
    }
    setSavingRetrieval(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await adminApi.updateRetrievalConfig(value);
      setRetrieval(updated);
      setThreshold(String(updated.threshold));
      setNotice(
        `Answer routing threshold saved at ${updated.threshold}. It applies to the next question.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Threshold save failed.");
    } finally {
      setSavingRetrieval(false);
    }
  }

  async function testLlm() {
    setTestingLlm(true);
    setError(null);
    setNotice(null);
    try {
      const r = await adminApi.testLlm();
      setNotice(r.success ? `LLM OK: ${r.message}` : `LLM check failed: ${r.message}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "LLM test failed.");
    } finally {
      setTestingLlm(false);
    }
  }

  async function testEmail(e: React.FormEvent) {
    e.preventDefault();
    setTestingEmail(true);
    setError(null);
    setNotice(null);
    try {
      const r = await adminApi.sendTestEmail(testTo.trim());
      setNotice(`Test email queued & sent to ${r.sent_to}.`);
      setTestTo("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Test email failed.");
    } finally {
      setTestingEmail(false);
    }
  }

  return (
    <AdminPageShell title="Settings" subtitle="Platform rules, AI connection and email sender. Secrets are write-only.">
      {error && (
        <div className="bg-white border border-[#DFB2A6] rounded-xl p-4 text-[#9D4C38] text-[13px]">
          {error}
          <button onClick={() => void load()} className="ml-2 underline">Retry</button>
        </div>
      )}
      {notice && <div className="bg-[#F7F7F7] border border-[#CFCFCF] rounded-xl p-4 text-[#111111] text-[13px]">{notice}</div>}

      {loading ? (
        <div className={`${ADMIN_CARD} p-8 text-center text-[#5A5A5A] text-[13px]`}>Loading settings…</div>
      ) : (
        <div className="space-y-6">
          {/* AI / LLM */}
          <div className={`${ADMIN_CARD} p-6`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[16px] font-bold text-[#111111]">AI connection</h2>
              <span className={`px-2.5 py-1 rounded-full text-[12px] font-semibold border ${settings?.llm.api_key_configured ? "bg-white text-[#111111] border-[#CFCFCF]" : "bg-white text-[#5A5A5A] border-[#CFCFCF]"}`}>
                {settings?.llm.api_key_configured ? "API key configured" : "No API key"}
              </span>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-semibold text-[#111111] mb-1.5">Model (read-only, from server env)</label>
                <input value={settings?.llm.model ?? ""} readOnly
                  className="w-full bg-slate-50 border border-[#DADADA] rounded-md px-3 py-2 text-[13.5px] text-[#111111] outline-none" />
              </div>
              <div className="flex items-end">
                <button onClick={() => void testLlm()} disabled={testingLlm}
                  className="px-4 py-2 border border-[#DADADA] bg-white text-[13px] font-semibold rounded-md hover:bg-slate-50 shadow-sm disabled:opacity-50">
                  {testingLlm ? "Checking…" : "Test LLM connection"}
                </button>
              </div>
            </div>
            <p className="text-[12.5px] text-[#5A5A5A] mt-3">Key rotation happens on the server (.env). UI never displays stored secrets.</p>
          </div>

          {/* AI-65: KB vs Internet routing threshold */}
          <div className={`${ADMIN_CARD} p-6`}>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-[16px] font-bold text-[#111111]">Answer routing (materials vs Internet)</h2>
              <span className="px-2.5 py-1 rounded-full text-[12px] font-semibold border bg-white text-[#111111] border-[#CFCFCF]">
                {retrieval?.is_default ? "Default 0.80" : "Custom"}
              </span>
            </div>
            <p className="text-[13px] text-[#5A5A5A] mb-4">
              Retrieval always runs first. When the best class-material score is at least this threshold,
              the assistant answers from the materials with citations. Below it, the question goes to the
              Internet source agent — the student is never refused.
            </p>
            <form onSubmit={(e) => void saveRetrieval(e)} className="flex flex-wrap items-end gap-3">
              <label className="block text-[13px] font-semibold text-[#111111]">
                Similarity threshold
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  required
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  className="mt-1.5 w-40 bg-slate-50 border border-[#DADADA] rounded-md px-3 py-2 text-[13.5px] outline-none focus:border-[#111111]"
                />
              </label>
              <button
                type="submit"
                disabled={savingRetrieval}
                className="px-4 py-2 border border-[#CFCFCF] bg-white text-[#111111] text-[13px] font-semibold rounded-md hover:bg-[#F7F7F7] disabled:opacity-50 shadow-sm"
              >
                {savingRetrieval ? "Saving…" : "Save threshold"}
              </button>
            </form>
            <p className="text-[12.5px] text-[#5A5A5A] mt-3">
              Default {retrieval?.default_threshold?.toFixed(2) ?? "0.80"} · 0 = always prefer materials ·
              1 = only an exact match counts. Changes apply to the next question.
            </p>
          </div>

          {/* Email sender */}
          <div className={`${ADMIN_CARD} p-6`}>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-[16px] font-bold text-[#111111]">Email sender</h2>
              <Link href="/admin/email" className="text-[13px] font-semibold text-[#111111] hover:underline">Open queue →</Link>
            </div>
            <p className="text-[13px] text-[#5A5A5A] mb-4">
              {config?.has_app_password ? "App password stored (masked). Leave blank to keep it." : "No app password yet — dry-run only."}
              {settings && <span className="ml-1">Limit: {settings.email.rate_limit_per_minute}/min · {settings.email.smtp_security} · {settings.email.smtp_host}:{settings.email.smtp_port}</span>}
            </p>
            <form onSubmit={(e) => void saveEmail(e)} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <label className="col-span-2 block text-[13px] font-semibold text-[#111111]">
                  SMTP host
                  <input value={host} onChange={(e) => setHost(e.target.value)}
                    className="mt-1.5 w-full bg-slate-50 border border-[#DADADA] rounded-md px-3 py-2 text-[13.5px] outline-none focus:border-[#111111]" />
                </label>
                <label className="block text-[13px] font-semibold text-[#111111]">
                  Port
                  <input value={port} onChange={(e) => setPort(e.target.value)} inputMode="numeric"
                    className="mt-1.5 w-full bg-slate-50 border border-[#DADADA] rounded-md px-3 py-2 text-[13.5px] outline-none focus:border-[#111111]" />
                </label>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="block text-[13px] font-semibold text-[#111111]">
                  Sender address
                  <input type="email" value={sender} onChange={(e) => setSender(e.target.value)}
                    className="mt-1.5 w-full bg-slate-50 border border-[#DADADA] rounded-md px-3 py-2 text-[13.5px] outline-none focus:border-[#111111]" />
                </label>
                <label className="block text-[13px] font-semibold text-[#111111]">
                  App password <span className="font-normal text-[#5A5A5A]">(blank = keep)</span>
                  <input type="password" autoComplete="new-password" value={appPassword} onChange={(e) => setAppPassword(e.target.value)}
                    placeholder="xxxx xxxx xxxx xxxx"
                    className="mt-1.5 w-full bg-slate-50 border border-[#DADADA] rounded-md px-3 py-2 text-[13.5px] outline-none focus:border-[#111111]" />
                </label>
              </div>
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
              <div className="flex flex-wrap gap-3">
                <button type="submit" disabled={saving}
                  className="px-4 py-2 border border-[#CFCFCF] bg-white text-[#111111] shadow-xs text-[13px] font-semibold rounded-md hover:bg-[#F7F7F7] disabled:opacity-50 shadow-sm">
                  {saving ? "Saving…" : "Save sender"}</button>
              </div>
            </form>
            <form onSubmit={(e) => void testEmail(e)} className="flex gap-2 mt-4">
              <input type="email" required value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="you@gmail.com"
                className="flex-1 bg-slate-50 border border-[#DADADA] rounded-md px-3 py-2 text-[13.5px] outline-none focus:border-[#111111]" aria-label="Test recipient" />
              <button type="submit" disabled={testingEmail}
                className="px-4 py-2 border border-[#DADADA] bg-white text-[13px] font-semibold rounded-md hover:bg-slate-50 disabled:opacity-50 shadow-sm">
                {testingEmail ? "Sending…" : "Send test mail"}</button>
            </form>
          </div>

          {/* Role overview (static info) */}
          <div className={`${ADMIN_CARD} p-6`}>
            <h2 className="text-[16px] font-bold text-[#111111] mb-4">Role overview</h2>
            <div className="space-y-3">
              <div className="flex gap-4 p-3 bg-slate-50 border border-slate-100 rounded-md">
                <span className="text-[12px] font-bold text-[#111111]  w-24 shrink-0">Student</span>
                <span className="text-[13px] text-[#5A5A5A]">access class materials, use Q&A Agent, manage own proposals</span>
              </div>
              <div className="flex gap-4 p-3 bg-slate-50 border border-slate-100 rounded-md">
                <span className="text-[12px] font-bold text-[#111111] w-24 shrink-0">Trainer</span>
                <span className="text-[13px] text-[#5A5A5A]">create and manage classes, syllabus, resources, tickets, and members</span>
              </div>
              <div className="flex gap-4 p-3 bg-slate-50 border border-slate-100 rounded-md">
                <span className="text-[12px] font-bold text-[#6F6F6F]  w-24 shrink-0">Admin</span>
                <span className="text-[13px] text-[#5A5A5A]">manage users, view basic class information, review reports, configure platform settings</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminPageShell>
  );
}
