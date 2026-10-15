"use client";

import * as React from "react";
import Link from "next/link";
import { adminApi, type AdminSettings, type EmailConfig } from "@/lib/admin-api";
import { AdminPageShell, ADMIN_CARD } from "@/components/shared/AdminPageShell";

export default function AdminSettingsPage() {
  const [settings, setSettings] = React.useState<AdminSettings | null>(null);
  const [config, setConfig] = React.useState<EmailConfig | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [testingLlm, setTestingLlm] = React.useState(false);
  const [testingEmail, setTestingEmail] = React.useState(false);

  const [host, setHost] = React.useState("");
  const [port, setPort] = React.useState("");
  const [sender, setSender] = React.useState("");
  const [appPassword, setAppPassword] = React.useState("");
  const [rate, setRate] = React.useState("");
  const [dryRun, setDryRun] = React.useState(true);
  const [testTo, setTestTo] = React.useState("");

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [s, c] = await Promise.all([adminApi.adminSettings(), adminApi.emailConfig()]);
      setSettings(s);
      setConfig(c);
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
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 text-rose-700 text-[13px]">
          {error}
          <button onClick={() => void load()} className="ml-2 underline">Retry</button>
        </div>
      )}
      {notice && <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-emerald-700 text-[13px]">{notice}</div>}

      {loading ? (
        <div className={`${ADMIN_CARD} p-8 text-center text-[#64748B] text-[13px]`}>Loading settings…</div>
      ) : (
        <div className="space-y-6">
          {/* AI / LLM */}
          <div className={`${ADMIN_CARD} p-6`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[16px] font-bold text-[#172033]">AI connection</h2>
              <span className={`px-2.5 py-1 rounded-full text-[12px] font-semibold border ${settings?.llm.api_key_configured ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                {settings?.llm.api_key_configured ? "API key configured" : "No API key"}
              </span>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-semibold text-[#334155] mb-1.5">Model (read-only, from server env)</label>
                <input value={settings?.llm.model ?? ""} readOnly
                  className="w-full bg-slate-50 border border-[#E2E8F0] rounded-md px-3 py-2 text-[13.5px] text-[#172033] outline-none" />
              </div>
              <div className="flex items-end">
                <button onClick={() => void testLlm()} disabled={testingLlm}
                  className="px-4 py-2 border border-[#E2E8F0] bg-white text-[13px] font-semibold rounded-md hover:bg-slate-50 shadow-sm disabled:opacity-50">
                  {testingLlm ? "Checking…" : "Test LLM connection"}
                </button>
              </div>
            </div>
            <p className="text-[12.5px] text-[#64748B] mt-3">Key rotation happens on the server (.env). UI never displays stored secrets.</p>
          </div>

          {/* Email sender */}
          <div className={`${ADMIN_CARD} p-6`}>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-[16px] font-bold text-[#172033]">Email sender</h2>
              <Link href="/admin/email" className="text-[13px] font-semibold text-[#2563EB] hover:underline">Open queue →</Link>
            </div>
            <p className="text-[13px] text-[#64748B] mb-4">
              {config?.has_app_password ? "App password stored (masked). Leave blank to keep it." : "No app password yet — dry-run only."}
              {settings && <span className="ml-1">Limit: {settings.email.rate_limit_per_minute}/min · {settings.email.smtp_security} · {settings.email.smtp_host}:{settings.email.smtp_port}</span>}
            </p>
            <form onSubmit={(e) => void saveEmail(e)} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <label className="col-span-2 block text-[13px] font-semibold text-[#334155]">
                  SMTP host
                  <input value={host} onChange={(e) => setHost(e.target.value)}
                    className="mt-1.5 w-full bg-slate-50 border border-[#E2E8F0] rounded-md px-3 py-2 text-[13.5px] outline-none focus:border-[#2563EB]" />
                </label>
                <label className="block text-[13px] font-semibold text-[#334155]">
                  Port
                  <input value={port} onChange={(e) => setPort(e.target.value)} inputMode="numeric"
                    className="mt-1.5 w-full bg-slate-50 border border-[#E2E8F0] rounded-md px-3 py-2 text-[13.5px] outline-none focus:border-[#2563EB]" />
                </label>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="block text-[13px] font-semibold text-[#334155]">
                  Sender address
                  <input type="email" value={sender} onChange={(e) => setSender(e.target.value)}
                    className="mt-1.5 w-full bg-slate-50 border border-[#E2E8F0] rounded-md px-3 py-2 text-[13.5px] outline-none focus:border-[#2563EB]" />
                </label>
                <label className="block text-[13px] font-semibold text-[#334155]">
                  App password <span className="font-normal text-[#64748B]">(blank = keep)</span>
                  <input type="password" autoComplete="new-password" value={appPassword} onChange={(e) => setAppPassword(e.target.value)}
                    placeholder="xxxx xxxx xxxx xxxx"
                    className="mt-1.5 w-full bg-slate-50 border border-[#E2E8F0] rounded-md px-3 py-2 text-[13.5px] outline-none focus:border-[#2563EB]" />
                </label>
              </div>
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
              <div className="flex flex-wrap gap-3">
                <button type="submit" disabled={saving}
                  className="px-4 py-2 bg-[#2563EB] text-white text-[13px] font-semibold rounded-md hover:bg-blue-700 disabled:opacity-50 shadow-sm">
                  {saving ? "Saving…" : "Save sender"}</button>
              </div>
            </form>
            <form onSubmit={(e) => void testEmail(e)} className="flex gap-2 mt-4">
              <input type="email" required value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="you@gmail.com"
                className="flex-1 bg-slate-50 border border-[#E2E8F0] rounded-md px-3 py-2 text-[13.5px] outline-none focus:border-[#2563EB]" aria-label="Test recipient" />
              <button type="submit" disabled={testingEmail}
                className="px-4 py-2 border border-[#E2E8F0] bg-white text-[13px] font-semibold rounded-md hover:bg-slate-50 disabled:opacity-50 shadow-sm">
                {testingEmail ? "Sending…" : "Send test mail"}</button>
            </form>
          </div>

          {/* Role overview (static info) */}
          <div className={`${ADMIN_CARD} p-6`}>
            <h2 className="text-[16px] font-bold text-[#172033] mb-4">Role overview</h2>
            <div className="space-y-3">
              <div className="flex gap-4 p-3 bg-slate-50 border border-slate-100 rounded-md">
                <span className="text-[12px] font-bold text-[#2563EB] uppercase tracking-wider w-24 shrink-0">Student</span>
                <span className="text-[13px] text-[#64748B]">access class materials, use Q&A Agent, manage own proposals</span>
              </div>
              <div className="flex gap-4 p-3 bg-slate-50 border border-slate-100 rounded-md">
                <span className="text-[12px] font-bold text-[#16A34A] uppercase tracking-wider w-24 shrink-0">Trainer</span>
                <span className="text-[13px] text-[#64748B]">create and manage classes, syllabus, resources, tickets, and members</span>
              </div>
              <div className="flex gap-4 p-3 bg-slate-50 border border-slate-100 rounded-md">
                <span className="text-[12px] font-bold text-[#9333EA] uppercase tracking-wider w-24 shrink-0">Admin</span>
                <span className="text-[13px] text-[#64748B]">manage users, view basic class information, review reports, configure platform settings</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminPageShell>
  );
}
