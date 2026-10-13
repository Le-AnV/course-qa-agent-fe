"use client";

import * as React from "react";
import { Search, Plus, Users, BookOpen, Ticket } from "lucide-react";
import { useRouter } from "next/navigation";

export default function TeacherClassesPage() {
  const router = useRouter();
  const [search, setSearch] = React.useState("");

  const classes = [
    {
      id: "cs-401",
      title: "Introduction to Artificial Intelligence",
      code: "CS 401",
      term: "Fall 2026",
      dept: "Computer Science",
      stats: "12 units · 28 resources",
      tickets: 8,
      members: 34,
      accentColor: "#2563EB",
    },
    {
      id: "se-301",
      title: "Software Engineering",
      code: "SE 301",
      term: "Fall 2026",
      dept: "Software Engineering",
      stats: "10 units · 22 resources",
      tickets: 3,
      members: 42,
      accentColor: "#0EA5E9",
    },
    {
      id: "cs-310",
      title: "Machine Learning Foundations",
      code: "CS 310",
      term: "Spring 2026",
      dept: "Computer Science",
      stats: "8 units · 15 resources",
      tickets: 1,
      members: 28,
      accentColor: "#6366F1",
    }
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderClassCard = (cls: any) => (
    <div key={cls.id} className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all hover:-translate-y-0.5 flex flex-col overflow-hidden group cursor-pointer" onClick={() => router.push(`/teacher/class/${cls.id}/overview`)}>
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
            <Ticket className="w-3.5 h-3.5 text-amber-500" />
            <span className={cls.tickets > 0 ? "text-amber-700 font-bold" : ""}>{cls.tickets}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            <span>{cls.members}</span>
          </div>
        </div>
        
        <button 
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/teacher/class/${cls.id}/overview`);
          }}
          className="w-full py-2.5 bg-[#f8fafc] group-hover:bg-[#EFF6FF] group-hover:text-[#2563EB] group-hover:border-blue-200 text-[#334155] rounded-lg text-[13px] font-semibold transition-colors border border-slate-100 flex items-center justify-center gap-2"
        >
          Manage class &rarr;
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-[920px] mx-auto pb-12 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-[28px] font-bold text-[#172033] font-heading tracking-tight">My Classes</h1>
          <p className="text-[14px] text-[#64748B] mt-1">Manage your active and past courses.</p>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-[8px] text-[13px] font-semibold transition-colors shadow-sm w-fit">
          <Plus className="w-4 h-4" />
          Create a class
        </button>
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
