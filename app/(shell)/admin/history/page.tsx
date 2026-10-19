"use client";

import * as React from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { adminApi, type ImportBatch, type ImportBatchDetail } from "@/lib/admin-api";
import { AdminPageShell, ADMIN_CARD } from "@/components/shared/AdminPageShell";

/**
 * History — read-only record of past bulk imports (AC-10).
 * Importing itself lives on the Users page and /dashboard/import;
 * this surface only views history. More history kinds will land here later.
 */
export default function AdminHistoryPage() {
  const [batches, setBatches] = React.useState<ImportBatch[]>([]);
  const [selected, setSelected] = React.useState<ImportBatchDetail | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-time fetch; load() only sets state after await, never synchronously.
    void load();
  }, [load]);

  async function openDetail(batch: ImportBatch) {
    setError(null);
    try {
      setSelected(await adminApi.importDetail(batch.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed.");
    }
  }

  return (
    <AdminPageShell
      title="History"
      subtitle="Past bulk imports with per-row results. To import, use the Users page or Bulk import."
    >
      {error && (
        <div className="bg-white border border-[#DFB2A6] rounded-xl p-4 text-[#9D4C38] text-[13px]">
          {error}
          <button onClick={() => void load()} className="ml-2 underline">Retry</button>
        </div>
      )}

      <div className={`${ADMIN_CARD} overflow-hidden`}>
        <div className="px-5 py-4 border-b border-[#DADADA]">
          <h2 className="text-[15px] font-bold text-[#111111]">Imports</h2>
          <p className="text-[12.5px] text-[#5A5A5A]">Every row is reported: imported, skipped (email exists), or failed (AC-10).</p>
        </div>
        {loading ? (
          <p className="px-5 py-8 text-center text-[#5A5A5A] text-[13px]">Loading history…</p>
        ) : batches.length === 0 ? (
          <p className="px-5 py-8 text-center text-[#5A5A5A] text-[13px]">No imports yet.</p>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-[#DADADA] text-[12px] font-medium text-[#6F6F6F]">
                <th className="px-5 py-3">File</th>
                <th className="px-5 py-3">Total</th>
                <th className="px-5 py-3">Imported</th>
                <th className="px-5 py-3">Skipped</th>
                <th className="px-5 py-3">Failed</th>
                <th className="px-5 py-3 w-28"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DADADA]">
              {batches.map((b) => (
                <tr key={b.id} className={`hover:bg-[#FAFAFA] ${selected?.id === b.id ? "bg-[#F7F7F7]/50" : ""}`}>
                  <td className="px-5 py-3 text-[13px] font-semibold text-[#111111]">{b.filename}</td>
                  <td className="px-5 py-3 text-[13px]">{b.total_rows}</td>
                  <td className="px-5 py-3 text-[13px] text-[#3B7D5D] font-semibold">{b.imported_count}</td>
                  <td className="px-5 py-3 text-[13px]">{b.skipped_count}</td>
                  <td className="px-5 py-3 text-[13px]">{b.failed_count}</td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => void openDetail(b)}
                      className="px-3 py-1.5 text-[12px] font-semibold border border-[#DADADA] rounded-md hover:bg-slate-50">View rows</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {selected && (
          <div className="border-t border-[#DADADA] px-5 py-4">
            <h3 className="text-[13.5px] font-bold text-[#111111] mb-3">{selected.filename} — row report</h3>
            <div className="border border-[#DADADA] rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white border-b border-[#DADADA] text-[12px] font-medium text-[#6F6F6F]">
                    <th className="px-4 py-2.5">Row</th>
                    <th className="px-4 py-2.5">Name</th>
                    <th className="px-4 py-2.5">Email</th>
                    <th className="px-4 py-2.5">MSSV</th>
                    <th className="px-4 py-2.5">Type</th>
                    <th className="px-4 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DADADA]">
                  {selected.rows.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 text-[13px] text-[#5A5A5A]">{r.row_number}</td>
                      <td className="px-4 py-2.5 text-[13px]">{r.username || "—"}</td>
                      <td className="px-4 py-2.5 text-[13px] text-[#5A5A5A]">{r.email}</td>
                      <td className="px-4 py-2.5 text-[12.5px] font-mono">{r.student_code || "—"}</td>
                      <td className="px-4 py-2.5 text-[13px] capitalize">{r.role_raw}</td>
                      <td className="px-4 py-2.5">
                        {r.status === "imported" ? (
                  <span className="flex items-center gap-1.5 text-[#3B7D5D] text-[12.5px] font-medium"><CheckCircle2 className="w-4 h-4" /> Imported</span>
                ) : r.status === "skipped" ? (
                  <span className="flex items-center gap-1.5 text-[#8F6B16] text-[12.5px] font-medium"><AlertCircle className="w-4 h-4" /> Skipped</span>
                        ) : (
                          <span className="flex flex-col gap-0.5">
                            <span className="flex items-center gap-1.5 text-[#C4644C] text-[12.5px] font-medium"><AlertCircle className="w-4 h-4" /> Failed</span>
                            <span className="text-[11px] text-[#C4644C]">{r.message}</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[12px] text-[#5A5A5A] mt-2">Passwords are generated and emailed per account — they never appear here (AC-07).</p>
          </div>
        )}
      </div>
    </AdminPageShell>
  );
}
