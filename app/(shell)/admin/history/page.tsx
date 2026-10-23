"use client";

import * as React from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import {
  adminApi,
  type EmailEntry,
  type ImportBatch,
  type ImportBatchDetail,
} from "@/lib/admin-api";
import { paginate } from "@/lib/pagination";
import { AdminPageShell, ADMIN_CARD } from "@/components/shared/AdminPageShell";
import { AppSelect } from "@/components/ui/app-select";

const PAGE_SIZE = 10;

const STATUS_DOT: Record<string, string> = {
  sent: "bg-[#4B9E76]",
  pending: "bg-[#B4881F]",
  failed: "bg-[#C4644C]",
};

type Tab = "imports" | "emails";

function Pager({
  page,
  pageCount,
  total,
  onChange,
}: {
  page: number;
  pageCount: number;
  total: number;
  onChange: (page: number) => void;
}) {
  if (total === 0) return null;
  return (
    <div className="flex items-center justify-between border-t border-[#DADADA] px-5 py-3 text-[12px] text-[#5A5A5A]">
      <span>
        Page {page} of {pageCount} - {total} entries
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="rounded-md border border-[#DADADA] bg-white px-3 py-1.5 font-semibold text-[#111111] hover:bg-[#F7F7F7] disabled:opacity-40"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => onChange(page + 1)}
          disabled={page >= pageCount}
          className="rounded-md border border-[#DADADA] bg-white px-3 py-1.5 font-semibold text-[#111111] hover:bg-[#F7F7F7] disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}

/**
 * History - read-only records of bulk imports and sent email.
 * Importing itself lives on the Users page; sending lives on Email.
 */
export default function AdminHistoryPage() {
  const [tab, setTab] = React.useState<Tab>("imports");

  const [batches, setBatches] = React.useState<ImportBatch[]>([]);
  const [importPage, setImportPage] = React.useState(1);
  const [selected, setSelected] = React.useState<ImportBatchDetail | null>(null);
  const [detailPage, setDetailPage] = React.useState(1);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  const [emails, setEmails] = React.useState<EmailEntry[]>([]);
  const [emailFilter, setEmailFilter] = React.useState("");
  const [emailPage, setEmailPage] = React.useState(1);
  const [emailError, setEmailError] = React.useState<string | null>(null);
  const [emailLoading, setEmailLoading] = React.useState(false);
  const [emailReload, setEmailReload] = React.useState(0);

  const loadImports = React.useCallback(async () => {
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-time fetch; loadImports() only sets state after await.
    void loadImports();
  }, [loadImports]);

  React.useEffect(() => {
    if (tab !== "emails") return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- tab/filter fetch; rows land after await.
    setEmailLoading(true);
    setEmailError(null);
    adminApi
      .emailQueue(emailFilter || undefined)
      .then((rows) => {
        if (!cancelled) setEmails(rows);
      })
      .catch((err: unknown) => {
        if (!cancelled) setEmailError(err instanceof Error ? err.message : "Load failed.");
      })
      .finally(() => {
        if (!cancelled) setEmailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tab, emailFilter, emailReload]);

  async function openDetail(batch: ImportBatch) {
    setError(null);
    try {
      setSelected(await adminApi.importDetail(batch.id));
      setDetailPage(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed.");
    }
  }

  async function retryEmail(id: number) {
    setEmailError(null);
    try {
      await adminApi.retryEmail(id);
      setEmails(await adminApi.emailQueue(emailFilter || undefined));
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : "Retry failed.");
    }
  }

  const importList = paginate(batches, importPage, PAGE_SIZE);
  const importRows = paginate(selected?.rows ?? [], detailPage, PAGE_SIZE);
  const emailList = paginate(emails, emailPage, PAGE_SIZE);

  return (
    <AdminPageShell
      title="History"
      subtitle="Past bulk imports and email delivery records. Sending and importing live on their own pages."
    >
      <div className="flex gap-1 border-b border-[#DADADA]">
        {([
          ["imports", "Imports"],
          ["emails", "Email history"],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-[13px] font-semibold ${
              tab === id
                ? "border-[#111111] text-[#111111]"
                : "border-transparent text-[#5A5A5A] hover:text-[#111111]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "imports" && (
        <>
          {error && (
            <div className="bg-white border border-[#DFB2A6] rounded-xl p-4 text-[#9D4C38] text-[13px]">
              {error}
              <button onClick={() => void loadImports()} className="ml-2 underline">Retry</button>
            </div>
          )}

          <div className={`${ADMIN_CARD} overflow-hidden`}>
            <div className="px-5 py-4 border-b border-[#DADADA]">
              <h2 className="text-[15px] font-bold text-[#111111]">Imports</h2>
              <p className="text-[12.5px] text-[#5A5A5A]">Every row is reported: imported, skipped (email exists), or failed (AC-10).</p>
            </div>
            {loading ? (
              <p className="px-5 py-8 text-center text-[#5A5A5A] text-[13px]">Loading history...</p>
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
                  {importList.items.map((b) => (
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
            <Pager page={importList.page} pageCount={importList.pageCount} total={batches.length} onChange={setImportPage} />
            {selected && (
              <div className="border-t border-[#DADADA] px-5 py-4">
                <h3 className="text-[13.5px] font-bold text-[#111111] mb-3">{selected.filename} - row report</h3>
                <div className="border border-[#DADADA] rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white border-b border-[#DADADA] text-[12px] font-medium text-[#6F6F6F]">
                        <th className="px-4 py-2.5">Row</th>
                        <th className="px-4 py-2.5">Name</th>
                        <th className="px-4 py-2.5">Email</th>
                        <th className="px-4 py-2.5">MSSV / MSNV</th>
                        <th className="px-4 py-2.5">Type</th>
                        <th className="px-4 py-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DADADA]">
                      {importRows.items.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50">
                          <td className="px-4 py-2.5 text-[13px] text-[#5A5A5A]">{r.row_number}</td>
                          <td className="px-4 py-2.5 text-[13px]">{r.username || "-"}</td>
                          <td className="px-4 py-2.5 text-[13px] text-[#5A5A5A]">{r.email}</td>
                          <td className="px-4 py-2.5 text-[12.5px] font-mono">{r.student_code || r.staff_code || "-"}</td>
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
                  <Pager page={importRows.page} pageCount={importRows.pageCount} total={selected.rows.length} onChange={setDetailPage} />
                </div>
                <p className="text-[12px] text-[#5A5A5A] mt-2">Passwords are generated and emailed per account - they never appear here (AC-07).</p>
              </div>
            )}
          </div>
        </>
      )}

      {tab === "emails" && (
        <>
          {emailError && (
            <div className="bg-white border border-[#DFB2A6] rounded-xl p-4 text-[#9D4C38] text-[13px]">
              {emailError}
              <button onClick={() => setEmailReload((n) => n + 1)} className="ml-2 underline">Retry</button>
            </div>
          )}

          <div className={`${ADMIN_CARD} overflow-hidden`}>
            <div className="flex items-center justify-between gap-4 border-b border-[#DADADA] px-5 py-4">
              <div>
                <h2 className="text-[15px] font-bold text-[#111111]">Email history</h2>
                <p className="text-[12.5px] text-[#5A5A5A]">Latest 200 delivery attempts. Sending and queue processing live on Email.</p>
              </div>
              <AppSelect
                value={emailFilter}
                onValueChange={(value) => {
                  setEmailFilter(value);
                  setEmailPage(1);
                }}
                aria-label="Filter email history by status"
                options={[
                  { value: "", label: "All statuses" },
                  { value: "pending", label: "Pending" },
                  { value: "sent", label: "Sent" },
                  { value: "failed", label: "Failed" },
                ]}
                size="sm"
                triggerClassName="w-auto"
              />
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-[#DADADA] text-[12px] font-medium text-[#6F6F6F]">
                  <th className="px-5 py-3">To</th>
                  <th className="px-5 py-3">Subject</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Error</th>
                  <th className="px-5 py-3">Created</th>
                  <th className="px-5 py-3 w-24"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DADADA]">
                {emailLoading ? (
                  <tr><td colSpan={6} className="px-5 py-8 text-center text-[#5A5A5A] text-[13px]">Loading email history...</td></tr>
                ) : emailList.items.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-8 text-center text-[#5A5A5A] text-[13px]">No email history yet.</td></tr>
                ) : (
                  emailList.items.map((e) => (
                    <tr key={e.id} className="hover:bg-[#FAFAFA]">
                      <td className="px-5 py-3 text-[13px] text-[#111111]">{e.to_email}</td>
                      <td className="px-5 py-3 text-[13px] text-[#5A5A5A] max-w-[220px] truncate">{e.subject}</td>
                      <td className="px-5 py-3">
                        <span className="flex items-center gap-2 text-[12.5px] text-[#111111]">
                          <span className={`w-2 h-2 rounded-full ${STATUS_DOT[e.status] ?? "bg-slate-400"}`} />
                          {e.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-[12.5px] text-[#5A5A5A] max-w-[220px] truncate" title={e.last_error}>{e.last_error || "-"}</td>
                      <td className="px-5 py-3 text-[12.5px] text-[#5A5A5A]">{new Date(e.created_at).toLocaleString("en-GB")}</td>
                      <td className="px-5 py-3 text-right">
                        {e.status === "failed" && (
                          <button onClick={() => void retryEmail(e.id)}
                            className="px-3 py-1.5 text-[12px] font-semibold border border-[#DADADA] rounded-md hover:bg-slate-50">Retry</button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <Pager page={emailList.page} pageCount={emailList.pageCount} total={emails.length} onChange={setEmailPage} />
          </div>
        </>
      )}
    </AdminPageShell>
  );
}
