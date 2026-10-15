"use client";

import * as React from "react";
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle } from "lucide-react";
import { adminApi, type ImportBatch, type ImportBatchDetail } from "@/lib/admin-api";
import { AdminPageShell, ADMIN_CARD } from "@/components/shared/AdminPageShell";

/**
 * Bulk import (AC-05..AC-10) — canonical admin surface.
 * Template has NO password column; passwords are generated + emailed.
 */
export default function AdminImportPage() {
  const [batches, setBatches] = React.useState<ImportBatch[]>([]);
  const [selected, setSelected] = React.useState<ImportBatchDetail | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [uploading, setUploading] = React.useState(false);
  const [retryingId, setRetryingId] = React.useState<number | null>(null);
  const [pickedName, setPickedName] = React.useState<string | null>(null);
  const [dragging, setDragging] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setBatches(await adminApi.imports());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function downloadTemplate() {
    setError(null);
    try {
      const blob = await adminApi.downloadTemplate();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "account-import-template.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Template download failed.");
    }
  }

  async function openDetail(batch: ImportBatch) {
    setError(null);
    try {
      setSelected(await adminApi.importDetail(batch.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed.");
    }
  }

  async function upload(event: React.FormEvent) {
    event.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Choose an .xlsx file first — download the template, fill rows, then upload.");
      return;
    }
    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      setError("Only .xlsx files are accepted.");
      return;
    }
    setUploading(true);
    setError(null);
    setNotice(null);
    try {
      const batch = await adminApi.uploadImport(file);
      if (fileRef.current) fileRef.current.value = "";
      setPickedName(null);
      setNotice(`Imported file “${batch.filename}”: ${batch.imported_count} imported, ${batch.skipped_count} skipped, ${batch.failed_count} failed. Passwords are queued in Email — open Email and press “Process queue now”.`);
      await load();
      setSelected(await adminApi.importDetail(batch.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setUploading(false);
    }
  }

  async function retryRow(rowId: number) {
    setRetryingId(rowId);
    setError(null);
    try {
      await adminApi.retryImportRow(rowId);
      if (selected) setSelected(await adminApi.importDetail(selected.id));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Retry failed.");
    } finally {
      setRetryingId(null);
    }
  }

  return (
    <AdminPageShell
      title="Import"
      subtitle="Columns are exactly: username, gmail, type — accounts are created class-less, students request classes afterwards."
      actions={
        <button onClick={() => void downloadTemplate()}
          className="flex items-center gap-1.5 px-4 py-2 border border-[#E2E8F0] bg-white hover:bg-slate-50 text-[#334155] rounded-[8px] text-[13px] font-semibold transition-colors shadow-sm">
          <FileSpreadsheet className="w-4 h-4" />
          Template
        </button>
      }
    >
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 text-rose-700 text-[13px]">
          {error}
          <button onClick={() => void load()} className="ml-2 underline">Retry</button>
        </div>
      )}
      {notice && <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-emerald-700 text-[13px]">{notice}</div>}

      <div className="grid gap-6 md:grid-cols-2">
        <div className={`${ADMIN_CARD} p-6`}>
          <h2 className="text-[16px] font-bold text-[#172033]">1. Get the template</h2>
          <p className="text-[13px] text-[#64748B] mt-1 mb-2">Exact columns: <code className="px-1.5 py-0.5 bg-slate-100 rounded text-[12px] font-mono">username, gmail, type</code> — no password column.</p>
          <p className="text-[13px] text-[#64748B] mb-4">Type is <b>student / trainer / teaching_assistant</b>. Accounts are created without a class — students browse the catalog and request to join, a TA approves.</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => void downloadTemplate()}
              className="px-4 py-2 border border-[#E2E8F0] bg-white text-[13px] font-semibold rounded-md hover:bg-slate-50 shadow-sm">
              Download .xlsx template
            </button>
            <a href="/samples/account-import-sample.xlsx" download="account-import-sample.xlsx"
              className="px-4 py-2 text-[13px] font-semibold text-[#2563EB] hover:underline">
              Or get a filled sample
            </a>
          </div>
        </div>
        <div className={`${ADMIN_CARD} p-6`}>
          <h2 className="text-[16px] font-bold text-[#172033]">2. Upload a filled file</h2>
          <p className="text-[13px] text-[#64748B] mt-1 mb-4">Each account gets a random password, emailed to its gmail (AC-07).</p>
          <form onSubmit={(e) => void upload(e)} className="flex flex-col gap-3">
            <label
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                const f = e.dataTransfer.files?.[0];
                if (f && fileRef.current) {
                  const dt = new DataTransfer();
                  dt.items.add(f);
                  fileRef.current.files = dt.files;
                  setPickedName(f.name);
                }
              }}
              className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-colors cursor-pointer ${dragging ? "border-blue-400 bg-[#EFF6FF]/60" : "border-[#E2E8F0] hover:border-blue-300 hover:bg-[#EFF6FF]/50"}`}>
              <input ref={fileRef} type="file" accept=".xlsx" className="hidden" aria-label="Import file"
                onChange={(e) => setPickedName(e.target.files?.[0]?.name ?? null)} />
              <UploadCloud className="w-6 h-6 text-blue-600 mb-2" />
              <span className="text-[13.5px] font-semibold text-[#172033]">{uploading ? "Uploading…" : pickedName ?? "Click to browse or drag file here"}</span>
              <span className="text-[12px] text-[#64748B] mt-1">Accepts only .xlsx files</span>
            </label>
            <button type="submit" disabled={uploading}
              className="px-4 py-2 bg-[#2563EB] text-white text-[13px] font-semibold rounded-md hover:bg-blue-700 disabled:opacity-50 shadow-sm">
              {uploading ? "Importing…" : "Import accounts"}
            </button>
          </form>
        </div>
      </div>

      <div className={`${ADMIN_CARD} overflow-hidden`}>
        <div className="px-5 py-4 border-b border-[#E2E8F0]">
          <h2 className="text-[15px] font-bold text-[#172033]">Import history</h2>
          <p className="text-[12.5px] text-[#64748B]">Every row is reported: imported, skipped (email exists), or failed (AC-10).</p>
        </div>
        {loading ? (
          <p className="px-5 py-8 text-center text-[#64748B] text-[13px]">Loading imports…</p>
        ) : batches.length === 0 ? (
          <p className="px-5 py-8 text-center text-[#64748B] text-[13px]">No imports yet — upload a filled template to onboard a whole class at once.</p>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-[#E2E8F0] text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                <th className="px-5 py-3">File</th>
                <th className="px-5 py-3">Total</th>
                <th className="px-5 py-3">Imported</th>
                <th className="px-5 py-3">Skipped</th>
                <th className="px-5 py-3">Failed</th>
                <th className="px-5 py-3 w-28"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {batches.map((b) => (
                <tr key={b.id} className={`hover:bg-[#F8FAFC] ${selected?.id === b.id ? "bg-[#EFF6FF]/50" : ""}`}>
                  <td className="px-5 py-3 text-[13px] font-semibold text-[#172033]">{b.filename}</td>
                  <td className="px-5 py-3 text-[13px]">{b.total_rows}</td>
                  <td className="px-5 py-3 text-[13px] text-emerald-700 font-semibold">{b.imported_count}</td>
                  <td className="px-5 py-3 text-[13px]">{b.skipped_count}</td>
                  <td className="px-5 py-3 text-[13px]">{b.failed_count}</td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => void openDetail(b)}
                      className="px-3 py-1.5 text-[12px] font-semibold border border-[#E2E8F0] rounded-md hover:bg-slate-50">View rows</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {selected && (
          <div className="border-t border-[#E2E8F0] px-5 py-4">
            <h3 className="text-[13.5px] font-bold text-[#172033] mb-3">{selected.filename} — row report</h3>
            <div className="border border-[#E2E8F0] rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-[#E2E8F0] text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                    <th className="px-4 py-2.5">Row</th>
                    <th className="px-4 py-2.5">Name</th>
                    <th className="px-4 py-2.5">Email</th>
                    <th className="px-4 py-2.5">Type</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5 w-28"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {selected.rows.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 text-[13px] text-[#64748B]">{r.row_number}</td>
                      <td className="px-4 py-2.5 text-[13px]">{r.username || "—"}</td>
                      <td className="px-4 py-2.5 text-[13px] text-[#64748B]">{r.email}</td>
                      <td className="px-4 py-2.5 text-[13px] capitalize">{r.role_raw}</td>
                      <td className="px-4 py-2.5">
                        {r.status === "imported" ? (
                          <span className="flex items-center gap-1.5 text-emerald-600 text-[12.5px] font-medium"><CheckCircle2 className="w-4 h-4" /> Imported</span>
                        ) : r.status === "skipped" ? (
                          <span className="flex items-center gap-1.5 text-amber-600 text-[12.5px] font-medium"><AlertCircle className="w-4 h-4" /> Skipped</span>
                        ) : (
                          <span className="flex flex-col gap-0.5">
                            <span className="flex items-center gap-1.5 text-rose-600 text-[12.5px] font-medium"><AlertCircle className="w-4 h-4" /> Failed</span>
                            <span className="text-[11px] text-rose-500">{r.message}</span>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {r.status === "failed" && (
                          <button disabled={retryingId === r.id} onClick={() => void retryRow(r.id)}
                            className="px-3 py-1 text-[12px] font-semibold border border-[#E2E8F0] rounded-md hover:bg-slate-50 disabled:opacity-50">
                            {retryingId === r.id ? "Retrying…" : "Retry"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[12px] text-[#64748B] mt-2">Passwords are generated and emailed per account — they never appear here (AC-07).</p>
          </div>
        )}
      </div>
    </AdminPageShell>
  );
}
