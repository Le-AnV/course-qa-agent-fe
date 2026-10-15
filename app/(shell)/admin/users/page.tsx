"use client";

import * as React from "react";
import Link from "next/link";
import { Search, X, UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle, RefreshCw, Plus } from "lucide-react";
import { adminApi, type AdminUser, type ClassSection, type ImportRow, type ImportBatch } from "@/lib/admin-api";
import { ActionMenu } from "@/components/shared/ActionMenu";
import { AdminPageShell, ADMIN_CARD } from "@/components/shared/AdminPageShell";

export default function AdminUsersPage() {
  const [search, setSearch] = React.useState("");
  const [users, setUsers] = React.useState<AdminUser[]>([]);
  const [classes, setClasses] = React.useState<ClassSection[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [roleFilter, setRoleFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [isImportOpen, setIsImportOpen] = React.useState(false);
  const [importStep, setImportStep] = React.useState(1);
  const [importFile, setImportFile] = React.useState<File | null>(null);
  const [importBatch, setImportBatch] = React.useState<ImportBatch | null>(null);
  const [importRows, setImportRows] = React.useState<ImportRow[]>([]);
  const [importing, setImporting] = React.useState(false);
  const [retryingId, setRetryingId] = React.useState<number | null>(null);
  // Create user modal
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [form, setForm] = React.useState({ username: "", email: "", role: "student", class_code: "" });

  const loadUsers = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [u, c] = await Promise.all([adminApi.users(), adminApi.classes()]);
      setUsers(u);
      setClasses(c);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const handleActivate = async (userId: string, activate: boolean) => {
    try {
      await adminApi.setActive(userId, activate);
      await loadUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update user");
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (!confirm("Reset this user's password? They will receive a new password via email.")) return;
    try {
      const result = await adminApi.resetPassword(userId);
      setNotice(`Password reset. New credentials emailed to: ${result.emailed_to}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to reset password");
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Delete this user? This action cannot be undone. The last admin is protected.")) return;
    try {
      await adminApi.deleteUser(userId);
      await loadUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete user");
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const created = await adminApi.createUser(
        form.username.trim(),
        form.email.trim(),
        form.role,
        form.class_code || undefined,
      );
      setNotice(`Account ${created.email} created — credentials emailed via queue.`);
      setIsCreateOpen(false);
      setForm({ username: "", email: "", role: "student", class_code: "" });
      await loadUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setCreating(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const blob = await adminApi.downloadTemplate();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "account-import-template.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Template download failed");
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    setImporting(true);
    try {
      const batch = await adminApi.uploadImport(file);
      setImportBatch(batch);
      const detail = await adminApi.importDetail(batch.id);
      setImportRows(detail.rows);
      setImportStep(2);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Import failed");
      setImportStep(1);
    } finally {
      setImporting(false);
    }
  };

  const handleRetryRow = async (rowId: number) => {
    setRetryingId(rowId);
    try {
      await adminApi.retryImportRow(rowId);
      if (importBatch) {
        const detail = await adminApi.importDetail(importBatch.id);
        setImportRows(detail.rows);
        setImportBatch({ ...importBatch, failed_count: detail.failed_count, imported_count: detail.imported_count, skipped_count: detail.skipped_count });
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Retry failed");
    } finally {
      setRetryingId(null);
    }
  };

  const handleImportSuccess = () => {
    setNotice(`Imported ${importBatch?.imported_count ?? 0} users successfully — passwords emailed via queue.`);
    setIsImportOpen(false);
    setImportStep(1);
    setImportFile(null);
    setImportBatch(null);
    setImportRows([]);
    loadUsers();
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.username.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? user.is_active : !user.is_active);
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <AdminPageShell
      title="Users"
      subtitle="Manage user accounts and platform access. Passwords are always emailed, never shown."
      actions={
        <>
          <button onClick={() => void downloadTemplate()}
            className="flex items-center gap-1.5 px-4 py-2 border border-[#E2E8F0] bg-white hover:bg-slate-50 text-[#334155] rounded-[8px] text-[13px] font-semibold transition-colors shadow-sm">
            <FileSpreadsheet className="w-4 h-4" />
            Template
          </button>
          <button onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 border border-[#E2E8F0] bg-white hover:bg-slate-50 text-[#334155] rounded-[8px] text-[13px] font-semibold transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
            New user
          </button>
          <button onClick={() => setIsImportOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-[8px] text-[13px] font-semibold transition-colors shadow-sm">
            <UploadCloud className="w-4 h-4" />
            Import Users
          </button>
        </>
      }
    >
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 text-rose-700 text-[13px]">
          {error}
          <button onClick={() => void loadUsers()} className="ml-2 underline">Retry</button>
        </div>
      )}
      {notice && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-emerald-700 text-[13px]">
          {notice}
          <span className="ml-2 text-emerald-600">Check <Link href="/admin/email" className="underline font-semibold">Email queue</Link> for delivery status.</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#64748B]" />
          <input
            type="text"
            placeholder="Search users"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-[#E2E8F0] rounded-lg pl-9 pr-4 py-2 text-[13.5px] outline-none focus:border-[#2563EB] shadow-sm transition-shadow"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-white border border-[#E2E8F0] rounded-md px-3 py-1.5 text-[12.5px] text-[#334155] outline-none focus:border-[#2563EB] shadow-sm"
          >
            <option value="all">All roles</option>
            <option value="student">Students</option>
            <option value="trainer">Trainers</option>
            <option value="teaching_assistant">Teaching Assistants</option>
            <option value="admin">Admins</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-[#E2E8F0] rounded-md px-3 py-1.5 text-[12.5px] text-[#334155] outline-none focus:border-[#2563EB] shadow-sm"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className={`${ADMIN_CARD} p-8 text-center text-[#64748B] text-[13px]`}>Loading users...</div>
      ) : (
        <div className={`${ADMIN_CARD} overflow-hidden`}>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-[#E2E8F0] text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Class</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 w-12 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-[#64748B] text-[13px]">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, idx) => (
                  <tr key={user.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[12px] font-bold text-slate-600 shrink-0">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-[13.5px] font-semibold text-[#172033]">{user.username}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-[13px] text-[#64748B]">{user.email}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-[12.5px] text-[#334155] capitalize">{user.role.replace("_", " ")}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-[12.5px] text-[#64748B]">{user.class_code || "—"}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${user.is_active ? "bg-[#16A34A]" : "bg-rose-500"}`} />
                        <span className="text-[12.5px] text-[#334155]">{user.is_active ? "Active" : "Inactive"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-center relative">
                      <ActionMenu
                        label={`Actions for ${user.username}`}
                        direction={idx === filteredUsers.length - 1 ? "up" : "down"}
                        items={[
                          ...(user.is_active
                            ? [{ label: "Deactivate account", danger: true, onSelect: () => void handleActivate(String(user.id), false) }]
                            : [{ label: "Activate account", onSelect: () => void handleActivate(String(user.id), true) }]),
                          { label: "Reset password", icon: <RefreshCw className="w-3.5 h-3.5" />, onSelect: () => void handleResetPassword(String(user.id)) },
                          { label: "Delete account", danger: true, onSelect: () => void handleDelete(String(user.id)) },
                        ]}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create User Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-[480px] p-6">
            <h2 className="text-[18px] font-bold text-[#172033] mb-1">New account</h2>
            <p className="text-[13px] text-[#64748B] mb-4">Password is generated and emailed — you never see it.</p>
            <form onSubmit={(e) => void handleCreate(e)} className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-[#334155] mb-1.5">Full name *</label>
                <input required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder="Nguyen Van A"
                  className="w-full bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#2563EB]" />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#334155] mb-1.5">Gmail *</label>
                <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="user@gmail.com"
                  className="w-full bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#2563EB]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-medium text-[#334155] mb-1.5">Role *</label>
                  <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#2563EB]">
                    <option value="student">Student</option>
                    <option value="trainer">Trainer</option>
                    <option value="teaching_assistant">Teaching assistant</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#334155] mb-1.5">Class</label>
                  <select value={form.class_code} onChange={(e) => setForm({ ...form, class_code: e.target.value })}
                    className="w-full bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#2563EB]">
                    <option value="">No class yet</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.code}>{c.code}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
                <button type="button" onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-[13px] font-semibold text-[#334155] bg-white border border-[#E2E8F0] rounded-md hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={creating}
                  className="px-4 py-2 text-[13px] font-semibold text-white bg-[#2563EB] rounded-md hover:bg-blue-700 disabled:opacity-50">
                  {creating ? "Creating…" : "Create & email credentials"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Drawer */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/20">
          <div className="w-full max-w-[600px] bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
              <h2 className="text-[18px] font-bold text-[#172033]">Import users from Excel</h2>
              <button
                onClick={() => { setIsImportOpen(false); setImportStep(1); setImportFile(null); setImportBatch(null); setImportRows([]); }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {importStep === 1 && (
                <div className="space-y-6">
                  <p className="text-[13.5px] text-[#64748B]">
                    Upload an Excel file containing user information. Columns exactly:{" "}
                    <code className="px-1.5 py-0.5 bg-slate-100 rounded text-[12px] font-mono">username, gmail, type</code>.
                    Accounts are created class-less — students request classes afterwards.
                    Full history + retry live at <Link href="/admin/import" className="text-[#2563EB] font-semibold hover:underline">Import page</Link>.
                  </p>
                  <label className="border-2 border-dashed border-[#E2E8F0] rounded-xl p-10 flex flex-col items-center justify-center text-center hover:border-blue-300 hover:bg-[#EFF6FF]/50 transition-colors cursor-pointer">
                    <input type="file" accept=".xlsx" className="hidden" onChange={(e) => void handleFileSelect(e)} disabled={importing} />
                    <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <h3 className="text-[15px] font-bold text-[#172033]">{importing ? "Uploading..." : "Click to browse or drag file here"}</h3>
                    <p className="text-[13px] text-[#64748B] mt-1">Accepts only .xlsx files</p>
                  </label>
                  <div className="text-center flex items-center justify-center gap-3">
                    <button onClick={() => void downloadTemplate()} className="text-[13px] font-semibold text-[#2563EB] hover:underline">
                      Download template
                    </button>
                    <span className="text-slate-300">·</span>
                    <a href="/samples/account-import-sample.xlsx" download="account-import-sample.xlsx" className="text-[13px] font-semibold text-[#2563EB] hover:underline">
                      Filled sample
                    </a>
                  </div>
                </div>
              )}

              {importStep === 2 && importBatch && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
                    <div>
                      <h3 className="text-[15px] font-bold text-[#172033]">
                        Import complete: {importBatch.imported_count} imported, {importBatch.skipped_count} skipped, {importBatch.failed_count} failed
                      </h3>
                      <p className="text-[13px] text-[#64748B]">{importFile?.name}</p>
                    </div>
                  </div>
                  {importRows.length > 0 && (
                    <div className="border border-[#E2E8F0] rounded-lg overflow-hidden">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-[#E2E8F0] text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                            <th className="px-4 py-3">Row</th>
                            <th className="px-4 py-3">Full Name</th>
                            <th className="px-4 py-3">Email</th>
                            <th className="px-4 py-3">Role</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E2E8F0]">
                          {importRows.map((row) => (
                            <tr key={row.id} className="hover:bg-slate-50">
                              <td className="px-4 py-3 text-[13px] text-[#64748B]">{row.row_number}</td>
                              <td className="px-4 py-3 text-[13px] text-[#172033]">{row.username || "—"}</td>
                              <td className="px-4 py-3 text-[13px] text-[#64748B]">{row.email}</td>
                              <td className="px-4 py-3 text-[13px] text-[#64748B] capitalize">{row.role_raw}</td>
                              <td className="px-4 py-3">
                                {row.status === "imported" ? (
                                  <div className="flex items-center gap-1.5 text-emerald-600 text-[12.5px] font-medium"><CheckCircle2 className="w-4 h-4" /> Imported</div>
                                ) : row.status === "skipped" ? (
                                  <div className="flex items-center gap-1.5 text-amber-600 text-[12.5px] font-medium"><AlertCircle className="w-4 h-4" /> Skipped</div>
                                ) : (
                                  <div className="flex flex-col gap-0.5">
                                    <div className="flex items-center gap-1.5 text-rose-600 text-[12.5px] font-medium"><AlertCircle className="w-4 h-4" /> Failed</div>
                                    <span className="text-[11px] text-rose-500">{row.message}</span>
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {row.status === "failed" && (
                                  <button disabled={retryingId === row.id} onClick={() => void handleRetryRow(row.id)}
                                    className="px-2.5 py-1 text-[11.5px] font-semibold border border-[#E2E8F0] rounded-md hover:bg-slate-50 disabled:opacity-50">
                                    {retryingId === row.id ? "…" : "Retry"}</button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-[#E2E8F0] flex justify-end gap-3 bg-slate-50">
              <button
                onClick={() => { setIsImportOpen(false); setImportStep(1); setImportFile(null); setImportBatch(null); setImportRows([]); }}
                className="px-4 py-2 text-[13px] font-semibold text-[#334155] bg-white border border-[#E2E8F0] rounded-md hover:bg-slate-50 transition-colors shadow-sm">
                Close
              </button>
              {importStep === 2 && (
                <button onClick={handleImportSuccess}
                  className="px-4 py-2 text-[13px] font-semibold text-white bg-[#2563EB] rounded-md hover:bg-blue-700 transition-colors shadow-sm">Done</button>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminPageShell>
  );
}
