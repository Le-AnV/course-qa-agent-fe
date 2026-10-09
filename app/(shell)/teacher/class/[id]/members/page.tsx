"use client";

import * as React from "react";
import { MembersTable } from "@/components/shared/MembersTable";
import { Copy, UserPlus, Search, MoreVertical } from "lucide-react";

export default function ClassMembersPage() {
  const [search, setSearch] = React.useState("");

  const toolbar = (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-1">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full mb-2">
        <div>
          <h2 className="text-xl font-bold text-[#172033]">Members</h2>
          <p className="text-[13px] text-[#64748B] mt-0.5">Manage people and class access.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E2E8F0] bg-white hover:bg-slate-50 rounded text-[12.5px] font-medium text-[#172033] transition-colors">
            <Copy className="w-3.5 h-3.5" /> Copy class code
          </button>
          <button className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded text-[12.5px] font-semibold transition-colors">
            <UserPlus className="w-4 h-4" /> Invite members
          </button>
        </div>
      </div>
      
      <div className="flex items-center justify-between gap-4 w-full">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md">
          <button className="px-3 py-1 text-[12px] font-medium bg-white text-[#2563EB] shadow-sm rounded transition-all">All</button>
          <button className="px-3 py-1 text-[12px] font-medium text-[#64748B] hover:text-[#172033] rounded transition-all">Students</button>
          <button className="px-3 py-1 text-[12px] font-medium text-[#64748B] hover:text-[#172033] rounded transition-all">Teachers</button>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1.5 h-4 w-4 text-[#64748B]" />
          <input
            type="text"
            placeholder="Search members"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 bg-white border border-[#E2E8F0] rounded pl-8 pr-3 py-1.5 text-[12.5px] outline-none focus:border-[#2563EB]"
          />
        </div>
      </div>
    </div>
  );

  return (
    <MembersTable toolbar={toolbar}>
      <tr className="hover:bg-[#F8FAFC] transition-colors group">
        <td className="py-3 px-4">
          <div className="flex items-center gap-3">
            <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&auto=format&fit=crop&q=80" alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
            <span className="font-semibold text-[13px] text-[#172033]">Trần Gia Linh</span>
          </div>
        </td>
        <td className="py-3 px-4 text-[#64748B]">linh.tg@university.edu.vn</td>
        <td className="py-3 px-4">
          <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-[#64748B]">Student</span>
        </td>
        <td className="py-3 px-4 text-right">
          <button className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors">
            <MoreVertical className="w-4 h-4" />
          </button>
        </td>
      </tr>
      <tr className="hover:bg-[#F8FAFC] transition-colors group">
        <td className="py-3 px-4">
          <div className="flex items-center gap-3">
            <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80" alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
            <span className="font-semibold text-[13px] text-[#172033]">Vũ Thị Phương</span>
          </div>
        </td>
        <td className="py-3 px-4 text-[#64748B]">phuong.vt@university.edu.vn</td>
        <td className="py-3 px-4">
          <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-purple-100 text-purple-700">TA</span>
        </td>
        <td className="py-3 px-4 text-right">
          <button className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors">
            <MoreVertical className="w-4 h-4" />
          </button>
        </td>
      </tr>
      <tr className="hover:bg-[#F8FAFC] transition-colors group">
        <td className="py-3 px-4">
          <div className="flex items-center gap-3">
            <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&auto=format&fit=crop&q=80" alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
            <span className="font-semibold text-[13px] text-[#172033]">Nguyễn Văn Minh</span>
          </div>
        </td>
        <td className="py-3 px-4 text-[#64748B]">minh.nv@university.edu.vn</td>
        <td className="py-3 px-4">
          <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-700">Teacher</span>
        </td>
        <td className="py-3 px-4 text-right">
          <button className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors">
            <MoreVertical className="w-4 h-4" />
          </button>
        </td>
      </tr>
    </MembersTable>
  );
}
