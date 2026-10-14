"use client";

import * as React from "react";
import { Search, MoreVertical, X, UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle, Trash2, RefreshCw, UserPlus } from "lucide-react";
import { adminApi, type AdminUser, type ImportRow, type ImportBatch } from "@/lib/admin-api";

export default function AdminUsersPage() {
  const [search, setSearch] = React.useState("");
  const [users, setUsers] = React.useState<AdminUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [roleFilter, setRoleFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [isImportOpen, setIsImportOpen] = React.useState(false);
  const [importStep, setImportStep] = React.useState(1);
  const [importFile, setImportFile] = React.useState<File | null>(null);
  const [importBatch, setImportBatch] = React.useState<ImportBatch | null>(null);
  const [importRows, setImportRows] = React.useState<ImportRow[]>([]);
  const [importing, setImporting] = React.useState(false);

  const loadUsers = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.users();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await adminApi.users();
        if (!cancelled) {
          setUsers(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load users");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
      alert(`Password reset. New credentials sent to: ${result.emailed_to}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to reset password");
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Delete this user? This action cannot be undone.")) return;
    try {
      await adminApi.deleteUser(userId);
      await loadUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete user");
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

  const handleImportSuccess = () => {
    alert(`Imported ${importBatch?.imported_count ?? 0} users successfully.`);
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
    <div className="max-w-[960px] mx-auto pb-12 space-y-6 bg-[#F8FAFC]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-[28px] font-bold text-[#172033] font-heading tracking-tight">Users</h1>
          <p className="text-[14px] text-[#64748B] mt-1">Manage user accounts and platform access.</p>
        </div>
        <div className="flex gap-2">
          <a
            href={adminApi.templateUrl()}
            download="account-import-template.xlsx"
            className="flex items-center gap-1.5 px-4 py-2 border border-[#E2E8F0] bg-white hover:bg-slate-50 text-[#334155] rounded-[8px] text-[13px] font-semibold transition-colors shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Template
          </a>
          <button
            onClick={() => setIsImportOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-[8px] text-[13px] font-semibold transition-colors shadow-sm"
          >
            <UploadCloud className="w-4 h-4" />
            Import Users
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 text-rose-700 text-[13px]">
          {error}
          <button onClick={loadUsers} className="ml-2 underline">Retry</button>
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
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-8 text-center text-[#64748B] text-[13px]">Loading users...</div>
      ) : (
        <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden shadow-sm">
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
                filteredUsers.map((user) => (
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
                    <td className="px-5 py-3.5 text-center relative group">
                      <button className="p-1.5 text-slate-400 hover:text-[#172033] hover:bg-slate-100 rounded-md transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      <div className="absolute right-6 top-full mt-1 w-44 bg-white border border-[#E2E8F0] rounded-md shadow-lg z-50 py-1 hidden group-hover:block">
                        <button
                          onClick={() => handleResetPassword(String(user.id))}
                          className="w-full text-left px-4 py-2 text-[12.5px] text-[#172033] hover:bg-slate-50 flex items-center gap-2"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Reset password
                        </button>
                        <hr className="my-1 border-[#E2E8F0]" />
                        {user.is_active ? (
                          <button
                            onClick={() => handleActivate(String(user.id), false)}
                            className="w-full text-left px-4 py-2 text-[12.5px] text-rose-600 hover:bg-rose-50"
                          >
                            Deactivate account
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivate(String(user.id), true)}
                            className="w-full text-left px-4 py-2 text-[12.5px] text-emerald-600 hover:bg-emerald-50"
                          >
                            Activate account
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(String(user.id))}
                          className="w-full text-left px-4 py-2 text-[12.5px] text-rose-600 hover:bg-rose-50"
                        >
                          Delete account
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Import Drawer */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/20">
          <div className="w-full max-w-[600px] bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
              <h2 className="text-[18px] font-bold text-[#172033]">Import users from Excel</h2>
              <button
                onClick={() => {
                  setIsImportOpen(false);
                  setImportStep(1);
                  setImportFile(null);
                  setImportBatch(null);
                  setImportRows([]);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {importStep === 1 && (
                <div className="space-y-6">
                  <p className="text-[13.5px] text-[#64748B]">
                    Upload an Excel file containing user information. Download the template to ensure correct format.
                  </p>

                  <label
                    className="border-2 border-dashed border-[#E2E8F0] rounded-xl p-10 flex flex-col items-center justify-center text-center hover:border-blue-300 hover:bg-[#EFF6FF]/50 transition-colors cursor-pointer"
                  >
                    <input type="file" accept=".xlsx" className="hidden" onChange={handleFileSelect} disabled={importing} />
                    <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <h3 className="text-[15px] font-bold text-[#172033]">
                      {importing ? "Uploading..." : "Click to browse or drag file here"}
                    </h3>
                    <p className="text-[13px] text-[#64748B] mt-1">Accepts only .xlsx files</p>
                  </label>

                  <div className="text-center">
                    <a
                      href={adminApi.templateUrl()}
                      download="account-import-template.xlsx"
                      className="text-[13px] font-semibold text-[#2563EB] hover:underline"
                    >
                      Download template
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
                                  <div className="flex items-center gap-1.5 text-emerald-600 text-[12.5px] font-medium">
                                    <CheckCircle2 className="w-4 h-4" /> Imported
                                  </div>
                                ) : row.status === "skipped" ? (
                                  <div className="flex items-center gap-1.5 text-amber-600 text-[12.5px] font-medium">
                                    <AlertCircle className="w-4 h-4" /> Skipped
                                  </div>
                                ) : (
                                  <div className="flex flex-col gap-0.5">
                                    <div className="flex items-center gap-1.5 text-rose-600 text-[12.5px] font-medium">
                                      <AlertCircle className="w-4 h-4" /> Failed
                                    </div>
                                    <span className="text-[11px] text-rose-500">{row.message}</span>
                                  </div>
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
                onClick={() => {
                  setIsImportOpen(false);
                  setImportStep(1);
                  setImportFile(null);
                  setImportBatch(null);
                  setImportRows([]);
                }}
                className="px-4 py-2 text-[13px] font-semibold text-[#334155] bg-white border border-[#E2E8F0] rounded-md hover:bg-slate-50 transition-colors shadow-sm"
              >
                Close
              </button>
              {importStep === 2 && (
                <button
                  onClick={handleImportSuccess}
                  className="px-4 py-2 text-[13px] font-semibold text-white bg-[#2563EB] rounded-md hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Done
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
