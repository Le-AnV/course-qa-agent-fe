"use client";

import * as React from "react";
import { Search, MoreVertical, X, UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle, Trash2 } from "lucide-react";

export default function AdminUsersPage() {
  const [search, setSearch] = React.useState("");
  const [isImportOpen, setIsImportOpen] = React.useState(false);
  const [importStep, setImportStep] = React.useState(1); // 1: Upload, 2: Preview, 3: Confirm

  const users = [
    { id: 1, name: "Trần Gia Linh", email: "linh@example.com", role: "Student", status: "Active" },
    { id: 2, name: "Nguyễn Văn Minh", email: "minh@example.com", role: "Teacher", status: "Active" },
    { id: 3, name: "System Admin", email: "admin@example.com", role: "Admin", status: "Active" },
    { id: 4, name: "Lê Hoàng Nam", email: "nam@example.com", role: "Student", status: "Suspended" },
  ];

  const previewUsers = [
    { id: 1, name: "Nguyễn Minh Tuấn", email: "tuan@example.com", role: "Student", valid: true, error: "" },
    { id: 2, name: "Lê Thị Lan", email: "lan@example.com", role: "Teacher", valid: true, error: "" },
    { id: 3, name: "", email: "no-name@example.com", role: "Student", valid: false, error: "Missing name" },
    { id: 4, name: "Trần Bảo", email: "bao.example.com", role: "Student", valid: false, error: "Invalid email" },
  ];

  const handleImportSuccess = () => {
    alert("Users imported successfully.");
    setIsImportOpen(false);
    setImportStep(1);
  };

  return (
    <div className="max-w-[960px] mx-auto pb-12 space-y-6 bg-[#F8FAFC]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-[28px] font-bold text-[#172033] font-[family-name:var(--font-lora)] tracking-tight">Users</h1>
          <p className="text-[14px] text-[#64748B] mt-1">Manage user accounts and platform access.</p>
        </div>
        <button 
          onClick={() => setIsImportOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-[8px] text-[13px] font-semibold transition-colors shadow-sm w-fit"
        >
          Import Users
        </button>
      </div>

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
          <select className="bg-white border border-[#E2E8F0] rounded-md px-3 py-1.5 text-[12.5px] text-[#334155] outline-none focus:border-[#2563EB] shadow-sm">
            <option>All roles</option>
            <option>Students</option>
            <option>Teachers</option>
            <option>Admins</option>
          </select>
          <select className="bg-white border border-[#E2E8F0] rounded-md px-3 py-1.5 text-[12.5px] text-[#334155] outline-none focus:border-[#2563EB] shadow-sm">
            <option>All statuses</option>
            <option>Active</option>
            <option>Suspended</option>
          </select>
        </div>
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-[#E2E8F0] text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Role</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 w-12 text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-[#F8FAFC] transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[12px] font-bold text-slate-600 shrink-0">
                      {user.name.charAt(0)}
                    </div>
                    <span className="text-[13.5px] font-semibold text-[#172033]">{user.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-[13px] text-[#64748B]">{user.email}</span>
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-[12.5px] text-[#334155]">{user.role}</span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${user.status === 'Active' ? 'bg-[#16A34A]' : 'bg-rose-500'}`} />
                    <span className="text-[12.5px] text-[#334155]">{user.status}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-center relative group">
                  <button className="p-1.5 text-slate-400 hover:text-[#172033] hover:bg-slate-100 rounded-md transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  <div className="absolute right-6 top-full mt-1 w-40 bg-white border border-[#E2E8F0] rounded-md shadow-sm z-50 py-1 hidden group-hover:block">
                    <button className="w-full text-left px-4 py-2 text-[12.5px] text-[#172033] hover:bg-slate-50">View user details</button>
                    <button className="w-full text-left px-4 py-2 text-[12.5px] text-[#172033] hover:bg-slate-50">Change role</button>
                    {user.status === 'Active' ? (
                      <button className="w-full text-left px-4 py-2 text-[12.5px] text-rose-600 hover:bg-rose-50">Suspend account</button>
                    ) : (
                      <button className="w-full text-left px-4 py-2 text-[12.5px] text-emerald-600 hover:bg-emerald-50">Activate account</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Import Drawer */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/20">
          <div className="w-full max-w-[600px] bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
              <h2 className="text-[18px] font-bold text-[#172033]">Import users from Excel</h2>
              <button onClick={() => { setIsImportOpen(false); setImportStep(1); }} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {importStep === 1 && (
                <div className="space-y-6">
                  <p className="text-[13.5px] text-[#64748B]">Upload an Excel file containing user information.</p>
                  
                  <div className="border-2 border-dashed border-[#E2E8F0] rounded-xl p-10 flex flex-col items-center justify-center text-center hover:border-blue-300 hover:bg-[#EFF6FF]/50 transition-colors cursor-pointer" onClick={() => setImportStep(2)}>
                    <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <h3 className="text-[15px] font-bold text-[#172033]">Click to browse or drag file here</h3>
                    <p className="text-[13px] text-[#64748B] mt-1">Accepts only .xlsx files</p>
                  </div>
                  
                  <div className="text-center">
                    <button className="text-[13px] font-semibold text-[#2563EB] hover:underline">Download template</button>
                  </div>
                </div>
              )}

              {importStep === 2 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
                    <div>
                      <h3 className="text-[15px] font-bold text-[#172033]">We found 4 users in users.xlsx</h3>
                      <p className="text-[13px] text-[#64748B]">2 ready to import · 2 need attention</p>
                    </div>
                  </div>

                  <div className="border border-[#E2E8F0] rounded-lg overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-[#E2E8F0] text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                          <th className="px-4 py-3">Full Name</th>
                          <th className="px-4 py-3">Email</th>
                          <th className="px-4 py-3">Role</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E8F0]">
                        {previewUsers.map((u, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="px-4 py-3 text-[13px] text-[#172033]">{u.name || <span className="text-rose-500 italic">Empty</span>}</td>
                            <td className="px-4 py-3 text-[13px] text-[#64748B]">{u.email}</td>
                            <td className="px-4 py-3 text-[13px] text-[#64748B]">{u.role}</td>
                            <td className="px-4 py-3">
                              {u.valid ? (
                                <div className="flex items-center gap-1.5 text-emerald-600 text-[12.5px] font-medium">
                                  <CheckCircle2 className="w-4 h-4" /> Ready
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 text-rose-600 text-[12.5px] font-medium">
                                  <AlertCircle className="w-4 h-4" /> {u.error}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button className="text-slate-400 hover:text-rose-600 transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {importStep === 3 && (
                <div className="space-y-6">
                  <h3 className="text-[15px] font-bold text-[#172033]">Import 2 users into Course Q&A?</h3>
                  <p className="text-[13.5px] text-[#64748B]">These users will be created with default Active status. Account activation will be handled separately.</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-[#E2E8F0] flex justify-end gap-3 bg-slate-50">
              <button 
                onClick={() => { setIsImportOpen(false); setImportStep(1); }}
                className="px-4 py-2 text-[13px] font-semibold text-[#334155] bg-white border border-[#E2E8F0] rounded-md hover:bg-slate-50 transition-colors shadow-sm"
              >
                Cancel
              </button>
              {importStep === 2 && (
                <button 
                  onClick={() => setImportStep(3)}
                  className="px-4 py-2 text-[13px] font-semibold text-white bg-[#2563EB] rounded-md hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Continue
                </button>
              )}
              {importStep === 3 && (
                <button 
                  onClick={handleImportSuccess}
                  className="px-4 py-2 text-[13px] font-semibold text-white bg-[#2563EB] rounded-md hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Import 2 users
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
