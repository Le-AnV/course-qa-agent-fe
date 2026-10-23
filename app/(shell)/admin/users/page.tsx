"use client";

import * as React from "react";
import Link from "next/link";
import { Search, X, UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle, RefreshCw, Plus, Eye, Trash2, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";
import { adminApi, type AdminUser, type ImportRow, type ImportBatch } from "@/lib/admin-api";
import { ActionMenu } from "@/components/shared/ActionMenu";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Modal } from "@/components/shared/Modal";
import { AdminPageShell, ADMIN_CARD } from "@/components/shared/AdminPageShell";

export default function AdminUsersPage() {
  const [search, setSearch] = React.useState("");
  const [users, setUsers] = React.useState<AdminUser[]>([]);
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
  const [form, setForm] = React.useState({ username: "", email: "", role: "student", code: "" });
  const [confirmAction, setConfirmAction] = React.useState<{ kind: "reset" | "delete"; userId: string; username: string } | null>(null);
  // Row selection + bulk actions + details drawer
  const [selected, setSelected] = React.useState<string[]>([]);
  const [detailsUser, setDetailsUser] = React.useState<AdminUser | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = React.useState(false);
  const [bulkBusy, setBulkBusy] = React.useState(false);

  const loadUsers = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setUsers(await adminApi.users());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-time fetch; loadUsers() only sets state after await, never synchronously.
    void loadUsers();
  }, [loadUsers]);

  const handleActivate = async (userId: string, activate: boolean) => {
    try {
      await adminApi.setActive(userId, activate);
      await loadUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update user");
    }
  };

  const handleResetPassword = (userId: string, username: string) => {
    setConfirmAction({ kind: "reset", userId, username });
  };

  const handleDelete = (userId: string, username: string) => {
    setConfirmAction({ kind: "delete", userId, username });
  };

  const runConfirmedAction = async () => {
    if (!confirmAction) return;
    try {
      if (confirmAction.kind === "reset") {
        const result = await adminApi.resetPassword(confirmAction.userId);
        setNotice(`Password reset. New credentials emailed to: ${result.emailed_to}`);
      } else {
        await adminApi.deleteUser(confirmAction.userId);
        setNotice(`Account ${confirmAction.username} deleted.`);
      }
      setConfirmAction(null);
      await loadUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
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
        undefined,
        form.role === "student" ? form.code.trim() || undefined : undefined,
        form.role !== "student" ? form.code.trim() || undefined : undefined,
      );
      setNotice(`Account ${created.email} created - credentials emailed via queue.`);
      setIsCreateOpen(false);
      setForm({ username: "", email: "", role: "student", code: "" });
      await loadUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setCreating(false);
    }
  };

  const toggleSelected = (userId: string) => {
    setSelected((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };

  const runBulkAction = async (kind: "activate" | "deactivate" | "delete") => {
    setBulkBusy(true);
    const ids = [...selected];
    let ok = 0;
    let failed = 0;
    for (const id of ids) {
      try {
        if (kind === "delete") await adminApi.deleteUser(id);
        else await adminApi.setActive(id, kind === "activate");
        ok += 1;
      } catch {
        failed += 1;
      }
    }
    setBulkBusy(false);
    setConfirmBulkDelete(false);
    setSelected([]);
    await loadUsers();
    const verb = kind === "delete" ? "deleted" : kind === "activate" ? "activated" : "deactivated";
    setNotice(
      failed === 0
        ? `${ok} account${ok === 1 ? "" : "s"} ${verb}.`
        : `${ok} account${ok === 1 ? "" : "s"} ${verb}, ${failed} failed — refresh and retry those.`,
    );
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
      toast.error(err instanceof Error ? err.message : "Template download failed");
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
      toast.error(err instanceof Error ? err.message : "Import failed");
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
      toast.error(err instanceof Error ? err.message : "Retry failed");
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
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      (user.student_code ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (user.staff_code ?? "").toLowerCase().includes(search.toLowerCase());
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
          <button onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 border border-[#DADADA] bg-white hover:bg-slate-50 text-[#111111] rounded-[8px] text-[13px] font-semibold transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
            New user
          </button>
          <button onClick={() => setIsImportOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 border border-[#CFCFCF] bg-white text-[#111111] shadow-xs hover:bg-[#F7F7F7] rounded-[8px] text-[13px] font-semibold transition-colors shadow-sm">
            <UploadCloud className="w-4 h-4" />
            Import Users
          </button>
        </>
      }
    >
      {error && (
        <div className="bg-white border border-[#DFB2A6] rounded-xl p-4 text-[#9D4C38] text-[13px]">
          {error}
          <button onClick={() => void loadUsers()} className="ml-2 underline">Retry</button>
        </div>
      )}
      {notice && (
        <div className="flex items-start gap-2.5 bg-white border border-[#DADADA] rounded-xl p-4 text-[13px] text-[#111111]">
          <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-[#4B9E76] shrink-0" />
          <p className="flex-1">
            {notice}
            <span className="ml-2 text-[#4D4D4D]">Check <Link href="/admin/email" className="underline font-semibold">Email queue</Link> for delivery status.</span>
          </p>
          <button
            type="button"
            onClick={() => setNotice(null)}
            aria-label="Dismiss notification"
            className="p-0.5 text-[#6F6F6F] hover:text-[#111111] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#5A5A5A]" />
          <input
            type="text"
            placeholder="Search users"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-[#DADADA] rounded-lg pl-9 pr-4 py-2 text-[13.5px] outline-none focus:border-[#111111] shadow-sm transition-shadow"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-white border border-[#DADADA] rounded-md px-3 py-1.5 text-[12.5px] text-[#111111] outline-none focus:border-[#111111] shadow-sm"
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
            className="bg-white border border-[#DADADA] rounded-md px-3 py-1.5 text-[12.5px] text-[#111111] outline-none focus:border-[#111111] shadow-sm"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className={`${ADMIN_CARD} p-8 text-center text-[#5A5A5A] text-[13px]`}>Loading users...</div>
      ) : (
        <>
        {selected.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#DADADA] bg-white px-4 py-3">
            <p className="text-[13px] font-semibold text-[#111111]">
              {selected.length} account{selected.length === 1 ? "" : "s"} selected
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => void runBulkAction("activate")}
                disabled={bulkBusy}
                className="flex items-center gap-1.5 rounded-md border border-[#DADADA] bg-white px-3 py-1.5 text-[12.5px] font-semibold text-[#111111] transition-colors hover:bg-[#F7F7F7] disabled:opacity-50"
              >
                <UserCheck className="w-3.5 h-3.5" /> Activate
              </button>
              <button
                onClick={() => void runBulkAction("deactivate")}
                disabled={bulkBusy}
                className="flex items-center gap-1.5 rounded-md border border-[#DADADA] bg-white px-3 py-1.5 text-[12.5px] font-semibold text-[#111111] transition-colors hover:bg-[#F7F7F7] disabled:opacity-50"
              >
                <UserX className="w-3.5 h-3.5" /> Deactivate
              </button>
              <button
                onClick={() => setConfirmBulkDelete(true)}
                disabled={bulkBusy}
                className="flex items-center gap-1.5 rounded-md border border-[#DFB2A6] bg-white px-3 py-1.5 text-[12.5px] font-semibold text-[#9D4C38] transition-colors hover:bg-[#F7F7F7] disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
              <button
                onClick={() => setSelected([])}
                className="px-2 py-1.5 text-[12.5px] font-semibold text-[#5A5A5A] hover:text-[#111111]"
              >
                Clear
              </button>
            </div>
          </div>
        )}
        <div className={`${ADMIN_CARD} overflow-hidden`}>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-[#DADADA] text-[12px] font-medium text-[#6F6F6F]">
                <th className="w-10 px-5 py-3">
                  <input
                    type="checkbox"
                    aria-label="Select all listed accounts"
                    checked={selected.length > 0 && selected.length === filteredUsers.length}
                    onChange={(e) =>
                      setSelected(e.target.checked ? filteredUsers.map((u) => String(u.id)) : [])
                    }
                    className="h-3.5 w-3.5 accent-[#111111]"
                  />
                </th>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">MSSV / MSNV</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 w-12 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DADADA]">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-[#5A5A5A] text-[13px]">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, idx) => (
                  <tr key={user.id} className="hover:bg-[#FAFAFA] transition-colors">
                    <td className="px-5 py-3.5">
                      <input
                        type="checkbox"
                        aria-label={`Select ${user.username}`}
                        checked={selected.includes(String(user.id))}
                        onChange={() => toggleSelected(String(user.id))}
                        className="h-3.5 w-3.5 accent-[#111111]"
                      />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#F7F7F7] border border-[#DADADA] flex items-center justify-center text-[12px] font-bold text-[#5A5A5A] shrink-0">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-[13.5px] font-semibold text-[#111111]">{user.username}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-[13px] text-[#5A5A5A]">{user.email}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-[12.5px] font-mono text-[#111111]">{(user.role === "student" ? user.student_code : user.staff_code) || "-"}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-[12.5px] text-[#111111] capitalize">{user.role.replace("_", " ")}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${user.is_active ? "bg-[#4B9E76]" : "bg-[#C4644C]"}`} />
                        <span className="text-[12.5px] text-[#111111]">{user.is_active ? "Active" : "Inactive"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-center relative">
                      <ActionMenu
                        label={`Actions for ${user.username}`}
                        direction={idx === filteredUsers.length - 1 ? "up" : "down"}
                        items={[
                          { label: "View details", icon: <Eye className="w-3.5 h-3.5" />, onSelect: () => setDetailsUser(user) },
                          ...(user.is_active
                            ? [{ label: "Deactivate account", danger: true, onSelect: () => void handleActivate(String(user.id), false) }]
                            : [{ label: "Activate account", onSelect: () => void handleActivate(String(user.id), true) }]),
                          { label: "Reset password", icon: <RefreshCw className="w-3.5 h-3.5" />, onSelect: () => handleResetPassword(String(user.id), user.username) },
                          { label: "Delete account", danger: true, onSelect: () => handleDelete(String(user.id), user.username) },
                        ]}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        </>
      )}

      {/* Create User Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="New account"
        subtitle="Password is generated and emailed — you never see it."
        widthClass="max-w-[480px]"
      >
        <form onSubmit={(e) => void handleCreate(e)} className="space-y-4">
          <div>
            <label htmlFor="new-user-name" className="block text-[13px] font-medium text-[#111111] mb-1.5">Full name *</label>
            <input id="new-user-name" required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="Nguyen Van A"
              className="w-full bg-white border border-[#DADADA] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#111111]" />
          </div>
          <div>
            <label htmlFor="new-user-email" className="block text-[13px] font-medium text-[#111111] mb-1.5">Gmail *</label>
            <input id="new-user-email" required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="user@gmail.com"
              className="w-full bg-white border border-[#DADADA] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#111111]" />
          </div>
          <div>
            <label htmlFor="new-user-role" className="block text-[13px] font-medium text-[#111111] mb-1.5">Role *</label>
            <select id="new-user-role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value, code: "" })}
              className="w-full bg-white border border-[#DADADA] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#111111]">
              <option value="student">Student</option>
              <option value="trainer">Trainer</option>
              <option value="teaching_assistant">Teaching assistant</option>
            </select>
          </div>
          <div>
            <label htmlFor="new-user-code" className="block text-[13px] font-medium text-[#111111] mb-1.5">
              {form.role === "student" ? "MSSV" : "MSNV"} <span className="font-normal text-[#5A5A5A]">(optional)</span>
            </label>
            <input id="new-user-code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder={form.role === "student" ? "TVA_4821" : "FPT01234"}
              className="w-full bg-white border border-[#DADADA] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#111111]" />
            <p className="mt-1 text-[11.5px] text-[#5A5A5A]">
              {form.role === "student"
                ? "Blank auto-generates INITIALS_NNNN."
                : "Employee ID shown in the users table and searchable."}
            </p>
          </div>
          <p className="text-[12px] text-[#5A5A5A]">
            Accounts are created class-less. Students join a class by request; trainers get classes when an
            admin creates one.
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-[#DADADA]">
            <button type="button" onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 text-[13px] font-semibold text-[#111111] bg-white border border-[#DADADA] rounded-md hover:bg-[#F7F7F7]">Cancel</button>
            <button type="submit" disabled={creating}
              className="px-4 py-2 text-[13px] font-semibold border border-[#CFCFCF] bg-white text-[#111111] shadow-xs rounded-md hover:bg-[#F7F7F7] disabled:opacity-50">
              {creating ? "Creating…" : "Create & email credentials"}</button>
          </div>
        </form>
      </Modal>

      {/* Import Drawer */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/20">
          <div className="w-full max-w-[600px] bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#DADADA]">
              <h2 className="text-[18px] font-bold text-[#111111]">Import users from Excel</h2>
              <button
                onClick={() => { setIsImportOpen(false); setImportStep(1); setImportFile(null); setImportBatch(null); setImportRows([]); }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {importStep === 1 && (
                <div className="space-y-6">
                  <p className="text-[13.5px] text-[#5A5A5A]">
                    Upload an Excel file containing user information. Columns exactly:{" "}
                    <code className="px-1.5 py-0.5 bg-slate-100 rounded text-[12px] font-mono">fullname, email, type, mssv</code>.
                    Leave mssv blank to auto-generate (initials + 4 random digits, e.g. TVA_4821).
                    Accounts are created class-less — students request classes afterwards.
                    Full history + retry live at <Link href="/admin/history" className="text-[#111111] font-semibold hover:underline">History page</Link>.
                  </p>
                  <label className="border-2 border-dashed border-[#DADADA] rounded-xl p-10 flex flex-col items-center justify-center text-center hover:border-[var(--brand)] hover:bg-[#F7F7F7]/50 transition-colors cursor-pointer">
                    <input type="file" accept=".xlsx" className="hidden" onChange={(e) => void handleFileSelect(e)} disabled={importing} />
                    <div className="w-12 h-12 rounded-full bg-[var(--brand-soft)] text-[var(--brand-ink)] flex items-center justify-center mb-4">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <h3 className="text-[15px] font-bold text-[#111111]">{importing ? "Uploading..." : "Click to browse or drag file here"}</h3>
                    <p className="text-[13px] text-[#5A5A5A] mt-1">Accepts only .xlsx files</p>
                  </label>
                  <div className="text-center">
                    <button onClick={() => void downloadTemplate()} className="text-[13px] font-semibold text-[#111111] hover:underline">
                      Download template
                    </button>
                  </div>
                </div>
              )}

              {importStep === 2 && importBatch && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="w-6 h-6 text-[#4D4D4D]" />
                    <div>
                      <h3 className="text-[15px] font-bold text-[#111111]">
                        Import complete: {importBatch.imported_count} imported, {importBatch.skipped_count} skipped, {importBatch.failed_count} failed
                      </h3>
                      <p className="text-[13px] text-[#5A5A5A]">{importFile?.name}</p>
                    </div>
                  </div>
                  {importRows.length > 0 && (
                    <div className="border border-[#DADADA] rounded-lg overflow-hidden">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-white border-b border-[#DADADA] text-[12px] font-medium text-[#6F6F6F]">
                            <th className="px-4 py-3">Row</th>
                            <th className="px-4 py-3">Full Name</th>
                            <th className="px-4 py-3">Email</th>
                            <th className="px-4 py-3">MSSV</th>
                            <th className="px-4 py-3">Role</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#DADADA]">
                          {importRows.map((row) => (
                            <tr key={row.id} className="hover:bg-slate-50">
                              <td className="px-4 py-3 text-[13px] text-[#5A5A5A]">{row.row_number}</td>
                              <td className="px-4 py-3 text-[13px] text-[#111111]">{row.username || "—"}</td>
                              <td className="px-4 py-3 text-[13px] text-[#5A5A5A]">{row.email}</td>
                              <td className="px-4 py-3 text-[12.5px] font-mono text-[#111111]">{row.student_code || "—"}</td>
                              <td className="px-4 py-3 text-[13px] text-[#5A5A5A] capitalize">{row.role_raw}</td>
                              <td className="px-4 py-3">
                                {row.status === "imported" ? (
                    <div className="flex items-center gap-1.5 text-[#3B7D5D] text-[12.5px] font-medium"><CheckCircle2 className="w-4 h-4" /> Imported</div>
                  ) : row.status === "skipped" ? (
                    <div className="flex items-center gap-1.5 text-[#8F6B16] text-[12.5px] font-medium"><AlertCircle className="w-4 h-4" /> Skipped</div>
                                ) : (
                                  <div className="flex flex-col gap-0.5">
                                    <div className="flex items-center gap-1.5 text-[#C4644C] text-[12.5px] font-medium"><AlertCircle className="w-4 h-4" /> Failed</div>
                                    <span className="text-[11px] text-[#C4644C]">{row.message}</span>
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {row.status === "failed" && (
                                  <button disabled={retryingId === row.id} onClick={() => void handleRetryRow(row.id)}
                                    className="px-2.5 py-1 text-[11.5px] font-semibold border border-[#DADADA] rounded-md hover:bg-slate-50 disabled:opacity-50">
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

            <div className="p-6 border-t border-[#DADADA] flex justify-end gap-3 bg-slate-50">
              <button
                onClick={() => { setIsImportOpen(false); setImportStep(1); setImportFile(null); setImportBatch(null); setImportRows([]); }}
                className="px-4 py-2 text-[13px] font-semibold text-[#111111] bg-white border border-[#DADADA] rounded-md hover:bg-slate-50 transition-colors shadow-sm">
                Close
              </button>
              {importStep === 2 && (
                <button onClick={handleImportSuccess}
                  className="px-4 py-2 text-[13px] font-semibold border border-[#CFCFCF] bg-white text-[#111111] shadow-xs rounded-md hover:bg-[#F7F7F7] transition-colors shadow-sm">Done</button>
              )}
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog
        isOpen={confirmAction !== null}
        title={confirmAction?.kind === "delete" ? "Delete this account?" : "Reset this password?"}
        tone={confirmAction?.kind === "delete" ? "danger" : "default"}
        confirmLabel={confirmAction?.kind === "delete" ? "Delete account" : "Reset password"}
        busyLabel={confirmAction?.kind === "delete" ? "Deleting..." : "Resetting..."}
        description={
          confirmAction?.kind === "delete"
            ? `Account ${confirmAction.username} will be removed permanently. The last remaining admin is protected. This cannot be undone.`
            : `${confirmAction?.username ?? "This user"} will receive a new password by email. This cannot be undone.`
        }
        onConfirm={runConfirmedAction}
        onCancel={() => setConfirmAction(null)}
      />

      <ConfirmDialog
        isOpen={confirmBulkDelete}
        title={`Delete ${selected.length} account${selected.length === 1 ? "" : "s"}?`}
        tone="danger"
        confirmLabel={`Delete ${selected.length} account${selected.length === 1 ? "" : "s"}`}
        busyLabel="Deleting..."
        description={`${selected.length} selected account${selected.length === 1 ? "" : "s"} will be removed permanently, one by one. The last remaining admin is protected. This cannot be undone.`}
        onConfirm={() => void runBulkAction("delete")}
        onCancel={() => setConfirmBulkDelete(false)}
      />

      <Modal
        isOpen={detailsUser !== null}
        onClose={() => setDetailsUser(null)}
        title={detailsUser?.username ?? "Account details"}
        subtitle="Account as stored by the backend."
        widthClass="max-w-lg"
      >
        {detailsUser && (
          <dl className="space-y-3 text-[13px]">
            {(
              [
                ["Full name", detailsUser.username, ""],
                ["Email", detailsUser.email, ""],
                ["MSSV / MSNV", (detailsUser.role === "student" ? detailsUser.student_code : detailsUser.staff_code) || "-", "font-mono"],
                ["Role", detailsUser.role.replace("_", " "), "capitalize"],
                ["Status", detailsUser.is_active ? "Active" : "Inactive", ""],
                ["Class", detailsUser.class_code || "No class", "font-mono"],
              ] as const
            ).map(([label, value, valueClass]) => (
              <div key={label} className="flex items-start justify-between gap-6 border-b border-[#F0F0F0] pb-2 last:border-b-0">
                <dt className="text-[12.5px] font-semibold text-[#5A5A5A]">{label}</dt>
                <dd className={`text-right text-[13px] text-[#111111] ${valueClass}`}>{value}</dd>
              </div>
            ))}
            <p className="pt-1 text-[12px] leading-relaxed text-[#6F6F6F]">
              A student can belong to several classes through join requests; the backend exposes one class per
              account here, so use the class roster for the full list.
            </p>
          </dl>
        )}
      </Modal>
    </AdminPageShell>
  );
}
