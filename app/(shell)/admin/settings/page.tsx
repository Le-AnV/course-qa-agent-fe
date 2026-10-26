"use client";

import * as React from "react";
import Link from "next/link";
import { adminApi, type AdminSettings, type EmailConfig, type RetrievalConfig, type RetrievalTestResult, type ClassSection } from "@/lib/admin-api";
import { AdminPageShell, ADMIN_CARD } from "@/components/shared/AdminPageShell";
import { GeminiKeyPool } from "@/components/shared/GeminiKeyPool";
import { DecisionsKeyPool } from "@/components/shared/DecisionsKeyPool";

export default function AdminSettingsPage() {
  const [settings, setSettings] = React.useState<AdminSettings | null>(null);
  const [config, setConfig] = React.useState<EmailConfig | null>(null);
  const [retrieval, setRetrieval] = React.useState<RetrievalConfig | null>(null);
  const [classes, setClasses] = React.useState<ClassSection[]>([]);
  const [selectedClassId, setSelectedClassId] = React.useState<string>("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [savingRetrieval, setSavingRetrieval] = React.useState(false);

  const [host, setHost] = React.useState("");
  const [port, setPort] = React.useState("");
  const [sender, setSender] = React.useState("");
  const [appPassword, setAppPassword] = React.useState("");
  const [rate, setRate] = React.useState("");
  const [threshold, setThreshold] = React.useState("0.80");
  const [unrelatedThreshold, setUnrelatedThreshold] = React.useState("0.45");

  // Testing playground state (Problem 1)
  const [testQuery, setTestQuery] = React.useState("");
  const [testingQuery, setTestingQuery] = React.useState(false);
  const [testResult, setTestResult] = React.useState<RetrievalTestResult | null>(null);
  const [testError, setTestError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      const [s, c, r, cls] = await Promise.all([
        adminApi.adminSettings(),
        adminApi.emailConfig(),
        adminApi.retrievalConfig(),
        adminApi.classes().catch(() => [] as ClassSection[]),
      ]);
      setSettings(s);
      setConfig(c);
      setRetrieval(r);
      setClasses(cls);
      if (cls.length > 0) {
        setSelectedClassId(cls[0].id);
      }
      setThreshold(String(r.threshold ?? 0.8));
      setUnrelatedThreshold(String(r.unrelated_threshold ?? 0.45));
      setHost(c.smtp_host);
      setPort(String(c.smtp_port));
      setSender(c.smtp_sender);
      setRate(String(c.smtp_rate_per_minute));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  async function saveRetrieval(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const high = Number(threshold);
    const low = Number(unrelatedThreshold);
    if (!Number.isFinite(high) || high < 0 || high > 1) {
      setError("Upper threshold (course materials) must be a number between 0.0 and 1.0.");
      return;
    }
    if (!Number.isFinite(low) || low < 0 || low > 1) {
      setError("Lower threshold (unrelated/out of scope) must be a number between 0.0 and 1.0.");
      return;
    }
    if (low > high) {
      setError("Constraint: Upper threshold cannot be lower than lower threshold.");
      return;
    }
    setSavingRetrieval(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await adminApi.updateRetrievalConfig(high, low);
      setRetrieval(updated);
      setThreshold(String(updated.threshold ?? high));
      setUnrelatedThreshold(String(updated.unrelated_threshold ?? low));
      setNotice(
        `Routing thresholds saved: Out of scope [0.00 - ${(updated.unrelated_threshold ?? low).toFixed(2)}] · Web Search [${(updated.unrelated_threshold ?? low).toFixed(2)} - ${(updated.threshold ?? high).toFixed(2)}] · Course materials [${(updated.threshold ?? high).toFixed(2)} - 1.00]. Applies to the next question.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save routing thresholds.");
    } finally {
      setSavingRetrieval(false);
    }
  }

  function resetRetrievalDefaults() {
    setThreshold("0.80");
    setUnrelatedThreshold("0.45");
  }

  async function handleTestQuery(e?: React.FormEvent, customQ?: string, customClassId?: string) {
    if (e) e.preventDefault();
    const q = (customQ ?? testQuery).trim();
    if (!q) return;
    if (customQ) setTestQuery(customQ);
    const targetClassId = customClassId ?? selectedClassId;
    setTestingQuery(true);
    setTestError(null);
    setTestResult(null);
    try {
      const res = await adminApi.testRetrievalQuery(q, targetClassId || undefined);
      setTestResult(res);
    } catch (err) {
      setTestError(err instanceof Error ? err.message : "Test query failed.");
    } finally {
      setTestingQuery(false);
    }
  }

  return (
    <AdminPageShell title="Settings" subtitle="Platform rules, AI connection and email sender. Secrets are write-only.">
      {error && (
        <div className="bg-white border border-[#DFB2A6] rounded-xl p-4 text-[#9D4C38] text-[13px]">
          {error}
          <button onClick={() => { setLoading(true); setError(null); void load(); }} className="ml-2 underline">Retry</button>
        </div>
      )}
      {notice && <div className="bg-[#F7F7F7] border border-[#CFCFCF] rounded-xl p-4 text-[#111111] text-[13px]">{notice}</div>}

      {loading ? (
        <div className={`${ADMIN_CARD} p-8 text-center text-[#5A5A5A] text-[13px]`}>Loading settings…</div>
      ) : (
        <div className="space-y-6">
          <GeminiKeyPool />

          <DecisionsKeyPool />

          {/* AI-65 / 3-Tier Answer Routing Dual Slider */}
          <div className={`${ADMIN_CARD} p-6`}>
            <style jsx>{`
              .dual-range-slider::-webkit-slider-thumb {
                pointer-events: auto;
                appearance: none;
                width: 22px;
                height: 22px;
                border-radius: 9999px;
                background-color: #ffffff;
                border: 3px solid #0f172a;
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
                cursor: grab;
              }
              .dual-range-slider::-webkit-slider-thumb:active {
                cursor: grabbing;
                transform: scale(1.15);
              }
              .dual-range-slider::-moz-range-thumb {
                pointer-events: auto;
                appearance: none;
                width: 22px;
                height: 22px;
                border-radius: 9999px;
                background-color: #ffffff;
                border: 3px solid #0f172a;
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
                cursor: grab;
              }
              .dual-range-slider::-moz-range-thumb:active {
                cursor: grabbing;
                transform: scale(1.15);
              }
            `}</style>

            {(() => {
              const lowNum = Number(unrelatedThreshold) || 0;
              const highNum = Number(threshold) || 0;
              const lowPct = Math.max(0, Math.min(100, lowNum * 100));
              const highPct = Math.max(0, Math.min(100, highNum * 100));
              const band2Width = Math.max(0, highPct - lowPct);
              const band3Width = Math.max(0, 100 - highPct);
              const isInvalid = lowNum > highNum || lowNum < 0 || lowNum > 1 || highNum < 0 || highNum > 1;

              const PRESETS = [
                {
                  id: "balanced",
                  label: "Balanced",
                  hint: "Recommended for daily learning",
                  low: "0.55",
                  high: "0.70",
                },
                {
                  id: "strict",
                  label: "Strict",
                  hint: "High precision, exam mode",
                  low: "0.65",
                  high: "0.80",
                },
                {
                  id: "exploratory",
                  label: "Exploratory",
                  hint: "Allows more web discovery",
                  low: "0.45",
                  high: "0.65",
                },
              ];

              const currentPreset = PRESETS.find(
                (p) => p.low === lowNum.toFixed(2) && p.high === highNum.toFixed(2)
              );

              // Dynamically evaluate test query zone against live slider values
              const testScore = testResult?.top_score;
              let predictedZone: "curriculum" | "internet" | "unrelated" | null = null;
              if (testScore !== undefined && testScore !== null) {
                if (testScore >= highNum) predictedZone = "curriculum";
                else if (testScore >= lowNum) predictedZone = "internet";
                else predictedZone = "unrelated";
              }

              return (
                <>
                  {/* ================= SECTION 1 (TOP): CONFIGURATION ================= */}
                  <div>
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                      <div>
                        <h2 className="text-[16px] font-bold text-slate-900">
                          Knowledge Routing Thresholds
                        </h2>
                        <p className="text-[13px] text-slate-500">
                          Route student questions between course materials, web search, or out-of-scope rejection.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {retrieval &&
                          (Number(threshold) !== retrieval.threshold ||
                            Number(unrelatedThreshold) !== retrieval.unrelated_threshold) ? (
                          <span className="px-2.5 py-1 rounded-md text-[12px] font-medium bg-amber-50 text-amber-800 border border-amber-300">
                            Unsaved changes
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-md text-[12px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-300">
                            Active in database
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Presets Row */}
                    <div className="mb-4">
                      <span className="text-[12px] font-semibold text-slate-600 block mb-1.5">
                        Quick Presets:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {PRESETS.map((p) => {
                          const isActive = currentPreset?.id === p.id;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setThreshold(p.high);
                                setUnrelatedThreshold(p.low);
                              }}
                              className={`p-2.5 rounded-lg border text-left transition-all ${isActive
                                  ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                                  : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                                }`}
                            >
                              <div className="flex items-center justify-between text-[12.5px] font-bold">
                                <span>{p.label}</span>
                                <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded ${isActive ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-600"}`}>
                                  {p.low} – {p.high}
                                </span>
                              </div>
                              <p className={`text-[11px] mt-0.5 ${isActive ? "text-slate-300" : "text-slate-400"}`}>
                                {p.hint}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Dual Range Slider */}
                    <div className="mb-4">
                      <div className="relative w-full h-10 flex items-center select-none">
                        {/* 3 Color Track */}
                        <div className="relative w-full h-3 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className="absolute top-0 bottom-0 left-0 bg-rose-400"
                            style={{ width: `${lowPct}%` }}
                          />
                          <div
                            className="absolute top-0 bottom-0 bg-amber-400"
                            style={{ left: `${lowPct}%`, width: `${band2Width}%` }}
                          />
                          <div
                            className="absolute top-0 bottom-0 bg-emerald-500"
                            style={{ left: `${highPct}%`, width: `${band3Width}%` }}
                          />
                        </div>

                        {/* Slider Inputs */}
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={lowNum}
                          aria-label="Lower threshold"
                          onChange={(e) => {
                            const v = Math.min(Number(e.target.value), highNum);
                            setUnrelatedThreshold(v.toFixed(2));
                          }}
                          className="absolute w-full pointer-events-none appearance-none bg-transparent z-30 dual-range-slider"
                        />
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={highNum}
                          aria-label="Upper threshold"
                          onChange={(e) => {
                            const v = Math.max(Number(e.target.value), lowNum);
                            setThreshold(v.toFixed(2));
                          }}
                          className="absolute w-full pointer-events-none appearance-none bg-transparent z-30 dual-range-slider"
                        />
                      </div>

                      {/* 3 Zone Labels under Slider */}
                      <div className="grid grid-cols-3 gap-2 text-center text-[11.5px] mt-1">
                        <div className="p-1.5 rounded bg-rose-50 border border-rose-200 text-rose-800">
                          <span className="font-semibold block">Out of Scope</span>
                          <span className="font-mono text-[11px]">0.00 – {lowNum.toFixed(2)}</span>
                        </div>
                        <div className="p-1.5 rounded bg-amber-50 border border-amber-200 text-amber-800">
                          <span className="font-semibold block">Web Search</span>
                          <span className="font-mono text-[11px]">{lowNum.toFixed(2)} – {highNum.toFixed(2)}</span>
                        </div>
                        <div className="p-1.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800">
                          <span className="font-semibold block">Course Materials</span>
                          <span className="font-mono text-[11px]">{highNum.toFixed(2)} – 1.00</span>
                        </div>
                      </div>
                    </div>

                    {/* Numeric Inputs & Save Actions */}
                    <form onSubmit={(e) => void saveRetrieval(e)} className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-200">
                      <div className="flex items-center gap-4 text-[13px]">
                        <label className="flex items-center gap-1.5">
                          <span className="text-slate-600 font-medium">Lower (T<sub>low</sub>):</span>
                          <input
                            type="number"
                            min="0"
                            max={highNum}
                            step="0.01"
                            required
                            value={unrelatedThreshold}
                            onChange={(e) => setUnrelatedThreshold(e.target.value)}
                            className="w-16 bg-white border border-slate-300 rounded px-2 py-1 text-center font-bold text-slate-800 outline-none focus:border-slate-800"
                          />
                        </label>
                        <label className="flex items-center gap-1.5">
                          <span className="text-slate-600 font-medium">Upper (T<sub>high</sub>):</span>
                          <input
                            type="number"
                            min={lowNum}
                            max="1"
                            step="0.01"
                            required
                            value={threshold}
                            onChange={(e) => setThreshold(e.target.value)}
                            className="w-16 bg-white border border-slate-300 rounded px-2 py-1 text-center font-bold text-slate-800 outline-none focus:border-slate-800"
                          />
                        </label>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={resetRetrievalDefaults}
                          className="px-3 py-1.5 text-[12.5px] font-medium text-slate-500 hover:text-slate-800 hover:underline"
                        >
                          Reset defaults (0.45 / 0.80)
                        </button>
                        <button
                          type="submit"
                          disabled={savingRetrieval || isInvalid}
                          className="px-4 py-1.5 bg-slate-900 text-white text-[13px] font-semibold rounded-md hover:bg-black disabled:opacity-40 transition-colors shadow-sm"
                        >
                          {savingRetrieval ? "Saving…" : "Save Thresholds"}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* ================= SECTION 2 (BOTTOM): TEST QUERY SANDBOX ================= */}
                  <div className="border-t border-slate-200 mt-6 pt-5">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                      <div>
                        <h3 className="text-[14px] font-bold text-slate-800">
                          Test Query Sandbox
                        </h3>
                        <p className="text-[12.5px] text-slate-500">
                          Test a sample question against a class knowledge base to preview its similarity score and routing zone.
                        </p>
                      </div>

                      {classes.length > 0 && (
                        <div className="flex items-center gap-1.5 text-[12.5px]">
                          <span className="text-slate-500 font-medium">Test against:</span>
                          <select
                            value={selectedClassId}
                            onChange={(e) => {
                              setSelectedClassId(e.target.value);
                              if (testQuery.trim()) {
                                void handleTestQuery(undefined, testQuery, e.target.value);
                              }
                            }}
                            className="bg-white border border-slate-300 rounded px-2 py-1 text-[12px] font-semibold text-slate-800 outline-none focus:border-slate-800 cursor-pointer shadow-2xs"
                          >
                            {classes.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.code} {c.document_count !== undefined ? `(${c.document_count} doc${c.document_count === 1 ? "" : "s"})` : ""}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Input Bar */}
                    <form onSubmit={(e) => void handleTestQuery(e)} className="flex items-center gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Type a sample question (e.g., What is the syllabus? or AI in SDLC)..."
                        value={testQuery}
                        onChange={(e) => setTestQuery(e.target.value)}
                        className="flex-1 bg-white border border-slate-300 rounded-md px-3 py-1.5 text-[13px] outline-none focus:border-slate-800"
                      />
                      <button
                        type="submit"
                        disabled={testingQuery || !testQuery.trim()}
                        className="px-4 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold text-[13px] rounded-md disabled:opacity-50 transition-colors shrink-0 shadow-xs"
                      >
                        {testingQuery ? "Testing…" : "Test Query"}
                      </button>
                    </form>

                    {/* Sample Clickable Chips */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[11.5px] text-slate-500 mb-3">
                      <span className="text-slate-400 font-medium">Quick examples:</span>
                      <button
                        type="button"
                        onClick={() => void handleTestQuery(undefined, "What is the syllabus of this course?")}
                        className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200"
                      >
                        Syllabus
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleTestQuery(undefined, "What are the prerequisites or software requirements for AL AAE course?")}
                        className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200"
                      >
                        Prerequisites
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleTestQuery(undefined, "AI in SDLC software development life cycle")}
                        className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200"
                      >
                        AI in SDLC
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleTestQuery(undefined, "How to bake a chocolate cake?")}
                        className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200"
                      >
                        Chocolate cake
                      </button>
                    </div>

                    {/* Error */}
                    {testError && (
                      <div className="p-2.5 text-[12.5px] rounded bg-rose-50 border border-rose-200 text-rose-700 mb-2">
                        {testError}
                      </div>
                    )}

                    {/* Result Card */}
                    {testResult && (
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-[12.5px]">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-600">Similarity Score:</span>
                            <span className="font-mono font-bold text-[13px] px-2 py-0.5 rounded bg-white border border-slate-300 text-slate-900">
                              {testResult.top_score !== null ? testResult.top_score.toFixed(4) : "Not found"}
                            </span>
                          </div>

                          {/* Dynamic Zone Preview based on live sliders */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-500">Routing Zone:</span>
                            {predictedZone === "curriculum" && (
                              <span className="px-2.5 py-0.5 rounded-full text-[11.5px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                Course Materials (Curriculum)
                              </span>
                            )}
                            {predictedZone === "internet" && (
                              <span className="px-2.5 py-0.5 rounded-full text-[11.5px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                Web Search (Tavily)
                              </span>
                            )}
                            {predictedZone === "unrelated" && (
                              <span className="px-2.5 py-0.5 rounded-full text-[11.5px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                Out of Scope (Refused)
                              </span>
                            )}
                          </div>
                        </div>

                        {testResult.matched_document && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-slate-700">
                              <span className="font-semibold">Top Matched Document:</span>
                              <span className="font-mono text-[12px] px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-800">
                                {testResult.matched_document}
                              </span>
                              {testResult.class_name && (
                                <span className="text-slate-400 text-[11.5px]">({testResult.class_name})</span>
                              )}
                            </div>
                            {testResult.matched_snippet && (
                              <p className="text-slate-600 bg-white p-2 rounded border border-slate-200 text-[12px] italic line-clamp-2">
                                {'"'}{testResult.matched_snippet}{'"'}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
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
              </div>
              {config?.email_dry_run && (
                <p role="status" className="text-[12px] text-[#9D4C38]">
                  Dry-run is still enabled in system config: emails are marked sent without being delivered.
                </p>
              )}
              <div className="flex flex-wrap gap-3">
                <button type="submit" disabled={saving}
                  className="px-4 py-2 border border-[#CFCFCF] bg-white text-[#111111] shadow-xs text-[13px] font-semibold rounded-md hover:bg-[#F7F7F7] disabled:opacity-50 shadow-sm">
                  {saving ? "Saving…" : "Save sender"}</button>
              </div>
            </form>
            <p className="text-[12px] text-[#5A5A5A] mt-4">
              Send pending mail and review delivery history in{" "}
              <Link href="/admin/email" className="font-semibold text-[#111111] hover:underline">
                Email
              </Link>
              .
            </p>
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
