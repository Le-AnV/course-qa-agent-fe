"use client";

import * as React from "react";
import { Search, Users, BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import { CLASSES } from "@/lib/classes";

export default function StudentClassesPage() {
  const router = useRouter();
  const [search, setSearch] = React.useState("");

  // Ô search lọc thật theo title / mã lớp / khoa (trước đây gõ không lọc gì).
  const q = search.trim().toLowerCase();
  const classes = q
    ? CLASSES.filter((c) =>
        [c.title, c.code, c.dept].some((f) => f.toLowerCase().includes(q)),
      )
    : CLASSES;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderClassCard = (cls: any) => (
    <div key={cls.id} className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all hover:-translate-y-0.5 flex flex-col overflow-hidden group cursor-pointer" onClick={() => router.push(`/student/class/${cls.id}/overview`)}>
      <div className="h-2 w-full" style={{ backgroundColor: cls.accentColor }} />
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-center justify-between text-[11px] font-bold text-[#94a3b8] uppercase tracking-widest mb-3">
          <span className="text-[#334155] bg-slate-100 px-2 py-0.5 rounded">{cls.code}</span>
          <span>{cls.term}</span>
        </div>
        <h3 className="text-[16px] font-heading font-bold text-[#1e293b] leading-snug mb-1.5 group-hover:text-[#2563EB] transition-colors">{cls.title}</h3>
        <p className="text-[13px] text-[#64748b] mb-6">{cls.dept}</p>
        
        <div className="flex items-center gap-4 text-[12.5px] text-[#64748b] font-medium mt-auto mb-5">
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            <span>{cls.stats.split(' · ')[0]}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            <span>{cls.members}</span>
          </div>
        </div>
        
        <button 
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/student/class/${cls.id}/overview`);
          }}
          className="w-full py-2.5 bg-[#f8fafc] group-hover:bg-[#EFF6FF] group-hover:text-[#2563EB] group-hover:border-blue-200 text-[#334155] rounded-lg text-[13px] font-semibold transition-colors border border-slate-100 flex items-center justify-center gap-2"
        >
          Go to class &rarr;
        </button>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-[920px] mx-auto px-6 pt-8 pb-12 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-[28px] font-bold text-[#172033] font-heading tracking-tight">My Classes</h1>
          <p className="text-[14px] text-[#64748B] mt-1">Manage and access your enrolled courses.</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
        {classes.map(renderClassCard)}
      </div>
    </div>
  );
}
