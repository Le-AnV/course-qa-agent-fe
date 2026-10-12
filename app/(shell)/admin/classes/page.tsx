"use client";

import * as React from "react";
import { Search, MoreVertical } from "lucide-react";

export default function AdminClassesPage() {
  const [search, setSearch] = React.useState("");

  const classes = [
    { id: 1, name: "Introduction to Artificial Intelligence", teacher: "Nguyễn Văn Minh", members: 34 },
    { id: 2, name: "Software Engineering", teacher: "Lê Hoàng Nam", members: 28 },
    { id: 3, name: "Database Systems", teacher: "Trần Hoàng Nam", members: 19 },
  ];

  return (
    <div className="max-w-[960px] mx-auto pb-12 space-y-6 bg-[#F8FAFC]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-[28px] font-bold text-[#172033] font-[family-name:var(--font-lora)] tracking-tight">Classes</h1>
          <p className="text-[14px] text-[#64748B] mt-1">Oversight of all active courses.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#64748B]" />
          <input
            type="text"
            placeholder="Search classes"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-[#E2E8F0] rounded-lg pl-9 pr-4 py-2 text-[13.5px] outline-none focus:border-[#2563EB] shadow-sm transition-shadow"
          />
        </div>
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-[#E2E8F0] text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
              <th className="px-5 py-3">Class</th>
              <th className="px-5 py-3">Teacher</th>
              <th className="px-5 py-3">Members</th>
              <th className="px-5 py-3 w-12 text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {classes.map((cls) => (
              <tr key={cls.id} className="hover:bg-[#F8FAFC] transition-colors">
                <td className="px-5 py-3.5">
                  <span className="text-[13.5px] font-semibold text-[#172033]">{cls.name}</span>
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-[13px] text-[#334155]">{cls.teacher}</span>
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-[13px] text-[#334155]">{cls.members}</span>
                </td>
                <td className="px-5 py-3.5 text-center relative group">
                  <button className="p-1.5 text-slate-400 hover:text-[#172033] hover:bg-slate-100 rounded-md transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  <div className="absolute right-6 top-full mt-1 w-40 bg-white border border-[#E2E8F0] rounded-md shadow-sm z-50 py-1 hidden group-hover:block">
                    <button className="w-full text-left px-4 py-2 text-[12.5px] text-[#172033] hover:bg-slate-50">View class details</button>
                    <button className="w-full text-left px-4 py-2 text-[12.5px] text-[#172033] hover:bg-slate-50">View members</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
