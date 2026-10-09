"use client";

import * as React from "react";
import { Search } from "lucide-react";

export default function StudentMembersPage() {
  const [search, setSearch] = React.useState("");

  const members = [
    { name: "Minh", role: "Teacher", email: "minh@university.edu" },
    { name: "Trần Gia Linh", role: "Student", email: "linh.tran@student.edu" },
    { name: "Nguyễn Văn Nam", role: "Student", email: "nam.nguyen@student.edu" },
    { name: "Lê Hoàng Tuấn", role: "Student", email: "tuan.le@student.edu" },
  ];

  // Ô search lọc thật theo tên / email (trước đây gõ không lọc gì).
  const q = search.trim().toLowerCase();
  const filteredMembers = q
    ? members.filter((m) =>
        [m.name, m.email, m.role].some((f) => f.toLowerCase().includes(q)),
      )
    : members;

  return (
    <div className="max-w-[920px] space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h2 className="text-xl font-bold font-[family-name:var(--font-lora)] text-[#172033]">Class Members</h2>
          <p className="text-[13px] text-[#64748B] mt-0.5">View your teachers and classmates.</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2 h-4 w-4 text-[#64748B]" />
          <input
            type="text"
            placeholder="Search members"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-[#E2E8F0] rounded-[6px] pl-8 pr-3 py-1.5 text-[13px] outline-none focus:border-[#2563EB]"
          />
        </div>
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-[#E2E8F0] text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3 hidden sm:table-cell">Email</th>
              <th className="px-4 py-3">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {filteredMembers.map((member, i) => (
              <tr key={i} className="hover:bg-[#F8FAFC] transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[12px] font-bold text-slate-600 shrink-0">
                      {member.name.charAt(0)}
                    </div>
                    <span className="text-[13.5px] font-semibold text-[#172033]">{member.name} {member.name === "Trần Gia Linh" && "(You)"}</span>
                  </div>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <span className="text-[13px] text-[#64748B]">{member.email}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                    member.role === "Teacher" 
                      ? "bg-blue-50 text-blue-700 border border-blue-200" 
                      : "bg-slate-100 text-slate-600 border border-slate-200"
                  }`}>
                    {member.role}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
