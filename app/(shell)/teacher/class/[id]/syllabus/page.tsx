"use client";

import * as React from "react";
import { Search, Upload, Plus, FileText, Link2, MoreVertical, MoreHorizontal } from "lucide-react";
import { SyllabusTable, SyllabusRow } from "@/components/shared/SyllabusTable";

export default function ClassSyllabusPage() {
  const [search, setSearch] = React.useState("");

  const toolbar = (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-1">
      <div>
        <h2 className="text-xl font-bold text-[#172033]">Syllabus</h2>
        <p className="text-[13px] text-[#64748B] mt-0.5">Manage course units, descriptions, and learning materials.</p>
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
        <button className="text-[12.5px] font-medium text-[#64748B] hover:text-[#2563EB] hover:underline">
          Download template
        </button>
        <button className="border border-[#E2E8F0] bg-white hover:bg-slate-50 text-[#172033] rounded text-[13px] font-semibold px-3 py-1.5 transition-colors">
          + Add unit
        </button>
        <button className="flex items-center gap-1.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded text-[13px] font-semibold px-3.5 py-1.5 transition-colors">
          <Upload className="w-4 h-4" />
          Import Excel
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-full">
      <div className="flex justify-end mb-2">
        <span className="text-[12px] text-[#64748B] italic">Saved just now</span>
      </div>
      <SyllabusTable toolbar={toolbar}>
        <SyllabusRow
          unitNumber="01"
          unitName="Introduction to Artificial Intelligence"
          description="Course overview, learning outcomes, assessments, and core AI concepts."
          rowActions={
            <button className="p-1 hover:bg-slate-200 rounded text-slate-500 bg-white shadow-sm border border-slate-200 transition-colors">
              <MoreVertical className="w-4 h-4" />
            </button>
          }
          content={
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 p-2 rounded bg-slate-50 hover:bg-[#EAF2FF] border border-[#E2E8F0] text-[12.5px] group/item">
                <FileText className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="uppercase text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 shrink-0">PDF</span>
                <span className="truncate flex-1 font-medium text-[#172033] cursor-pointer hover:underline">Lecture 01 — Introduction.pdf</span>
                <button className="opacity-0 group-hover/item:opacity-100 p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors">
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-slate-50 hover:bg-[#EAF2FF] border border-[#E2E8F0] text-[12.5px] group/item">
                <Link2 className="w-4 h-4 text-[#2563EB] shrink-0" />
                <span className="uppercase text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 shrink-0">LINK</span>
                <span className="truncate flex-1 font-medium text-[#172033] cursor-pointer hover:underline">Required reading: What is AI?</span>
                <button className="opacity-0 group-hover/item:opacity-100 p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors">
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </button>
              </div>
              
              <button className="w-full flex items-center justify-center gap-1 py-1.5 border border-dashed border-[#E2E8F0] hover:border-[#2563EB] hover:bg-[#EAF2FF]/50 rounded text-[12px] font-semibold text-[#64748B] hover:text-[#2563EB] transition-colors mt-2">
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          }
        />
        <SyllabusRow
          unitNumber="02"
          unitName="Search and Planning"
          isDraft={true}
          description="Uninformed search, heuristic search, A* algorithm, and adversarial search (minimax)."
          rowActions={
            <button className="p-1 hover:bg-slate-200 rounded text-slate-500 bg-white shadow-sm border border-slate-200 transition-colors">
              <MoreVertical className="w-4 h-4" />
            </button>
          }
          content={
            <div className="space-y-1.5">
              <button className="w-full flex items-center justify-center gap-1 py-1.5 border border-dashed border-[#E2E8F0] hover:border-[#2563EB] hover:bg-[#EAF2FF]/50 rounded text-[12px] font-semibold text-[#64748B] hover:text-[#2563EB] transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          }
        />
      </SyllabusTable>
    </div>
  );
}
