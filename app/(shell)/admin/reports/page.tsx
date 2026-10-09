"use client";

import * as React from "react";
import { Search } from "lucide-react";

export default function AdminReportsPage() {
  const [search, setSearch] = React.useState("");

  const reports = [
    { id: 1, type: "Ticket", content: "Please do my assignment for me", context: "Introduction to AI", status: "Open" },
    { id: 2, type: "Resource", content: "lecture-notes.pdf", context: "Software Engineering", status: "Open" },
    { id: 3, type: "User", content: "Trần Gia Linh", context: "User profile", status: "Open" },
  ];

  return (
    <div className="max-w-[960px] mx-auto pb-12 space-y-6 bg-[#F8FAFC]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-[28px] font-bold text-[#172033] font-[family-name:var(--font-lora)] tracking-tight">Reports</h1>
          <p className="text-[14px] text-[#64748B] mt-1">System moderation and review.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#64748B]" />
          <input
            type="text"
            placeholder="Search reports"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-[#E2E8F0] rounded-lg pl-9 pr-4 py-2 text-[13.5px] outline-none focus:border-[#2563EB] shadow-sm transition-shadow"
          />
        </div>
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          <button className="px-3.5 py-1.5 text-[13px] font-semibold bg-white text-[#2563EB] shadow-sm rounded-md transition-all">Open</button>
          <button className="px-3.5 py-1.5 text-[13px] font-medium text-[#64748B] hover:text-[#172033] rounded-md transition-all">Resolved</button>
          <button className="px-3.5 py-1.5 text-[13px] font-medium text-[#64748B] hover:text-[#172033] rounded-md transition-all">Dismissed</button>
        </div>
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-[#E2E8F0] text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
              <th className="px-5 py-3">Type</th>
              <th className="px-5 py-3">Reported Content</th>
              <th className="px-5 py-3">Context</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {reports.map((report) => (
              <tr key={report.id} className="hover:bg-[#F8FAFC] transition-colors">
                <td className="px-5 py-3.5">
                  <span className="text-[12.5px] font-semibold text-[#172033]">{report.type}</span>
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-[13px] text-[#334155]">&quot;{report.content}&quot;</span>
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-[13px] text-[#64748B]">{report.context}</span>
                </td>
                <td className="px-5 py-3.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    {report.status}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <button className="text-[12.5px] font-semibold text-[#2563EB] hover:underline">
                    Review
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
