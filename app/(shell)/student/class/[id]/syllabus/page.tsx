"use client";

import * as React from "react";
import { Search, FileText, Link2, Download } from "lucide-react";
import { SyllabusTable, SyllabusRow } from "@/components/shared/SyllabusTable";

export default function StudentClassSyllabusPage() {
  const [search, setSearch] = React.useState("");

  const toolbar = (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-1">
      <div>
        <h2 className="text-xl font-bold font-[family-name:var(--font-lora)] text-[#172033]">Syllabus</h2>
        <p className="text-[13px] text-[#64748B] mt-0.5">View course units, descriptions, and learning materials.</p>
      </div>
      <div className="flex items-center gap-2.5 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2.5 top-1.5 h-4 w-4 text-[#64748B]" />
          <input
            type="text"
            placeholder="Search syllabus"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56 bg-slate-50 border border-[#E2E8F0] rounded pl-8 pr-3 py-1.5 text-[12.5px] outline-none focus:border-[#2563EB]"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-full">
      <SyllabusTable toolbar={toolbar}>
        <SyllabusRow
          unitNumber="01"
          unitName="Introduction to Artificial Intelligence"
          description="Course overview, learning outcomes, assessments, and core AI concepts."
          content={
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 p-2 rounded bg-slate-50 hover:bg-[#EAF2FF] border border-[#E2E8F0] text-[12.5px] group/item">
                <FileText className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="uppercase text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 shrink-0">PDF</span>
                <span className="truncate flex-1 font-medium text-[#172033] cursor-pointer hover:underline">Lecture 01 — Introduction.pdf</span>
                <button className="opacity-0 group-hover/item:opacity-100 p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors" title="Download">
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-slate-50 hover:bg-[#EAF2FF] border border-[#E2E8F0] text-[12.5px] group/item">
                <Link2 className="w-4 h-4 text-[#2563EB] shrink-0" />
                <span className="uppercase text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 shrink-0">LINK</span>
                <span className="truncate flex-1 font-medium text-[#172033] cursor-pointer hover:underline">Required reading: What is AI?</span>
              </div>
            </div>
          }
        />
        <SyllabusRow
          unitNumber="02"
          unitName="Search and Planning"
          description="Uninformed search, heuristic search, A* algorithm, and adversarial search (minimax)."
          content={
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 p-2 rounded bg-slate-50 hover:bg-[#EAF2FF] border border-[#E2E8F0] text-[12.5px] group/item">
                <FileText className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="uppercase text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 shrink-0">PDF</span>
                <span className="truncate flex-1 font-medium text-[#172033] cursor-pointer hover:underline">Lecture 02 — Search.pdf</span>
                <button className="opacity-0 group-hover/item:opacity-100 p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors" title="Download">
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          }
        />
      </SyllabusTable>
    </div>
  );
}
