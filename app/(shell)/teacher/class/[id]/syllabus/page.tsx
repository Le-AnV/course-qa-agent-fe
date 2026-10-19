"use client";

import * as React from "react";
import { Search, FileText, Link2, MoreVertical } from "lucide-react";
import { useParams } from "next/navigation";
import { SyllabusTable, SyllabusRow } from "@/components/shared/SyllabusTable";
import { MockBadge } from "@/components/shared/MockBadge";
import { ClassMaterials } from "@/features/documents/class-materials";

export default function ClassSyllabusPage() {
  const params = useParams();
  const id = params.id as string;
  const [search, setSearch] = React.useState("");

  const toolbar = (
    <div className="mb-1 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-[#111111]">Syllabus</h2>
          <MockBadge title="Preview data — syllabus units are not stored by the backend yet" />
        </div>
        <p className="mt-0.5 text-[13px] text-[#5A5A5A]">
          Course units (planned) and the learning materials uploaded for this class.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative">
          <Search className="absolute left-2.5 top-1.5 h-4 w-4 text-[#6F6F6F]" />
          <input
            type="text"
            placeholder="Search units"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56 rounded border border-[#DADADA] bg-white py-1.5 pl-8 pr-3 text-[12.5px] outline-none focus:border-[#111111]"
          />
        </div>
        <button className="rounded border border-[#DADADA] bg-white px-3 py-1.5 text-[13px] font-semibold text-[#111111] transition-colors hover:bg-[#F7F7F7]">
          + Add unit
        </button>
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
          rowActions={
            <button className="rounded border border-[#DADADA] bg-white p-1 text-[#5A5A5A] shadow-sm transition-colors hover:bg-[#F7F7F7]">
              <MoreVertical className="w-4 h-4" />
            </button>
          }
          content={
            <div className="space-y-1.5">
              <span className="flex items-center gap-1.5 text-[12.5px] text-[#111111]">
                <FileText className="w-3.5 h-3.5 text-[#6F6F6F]" /> Lecture 01 — Introduction.pdf
              </span>
              <span className="flex items-center gap-1.5 text-[12.5px] text-[#111111]">
                <Link2 className="w-3.5 h-3.5 text-[#6F6F6F]" /> Course outline
              </span>
            </div>
          }
        />
        <SyllabusRow
          unitNumber="02"
          unitName="Search & Problem Solving"
          isDraft
          description="Uninformed and informed search, heuristics, and evaluating search strategies."
          rowActions={
            <button className="rounded border border-[#DADADA] bg-white p-1 text-[#5A5A5A] shadow-sm transition-colors hover:bg-[#F7F7F7]">
              <MoreVertical className="w-4 h-4" />
            </button>
          }
          content={
            <div className="space-y-1.5">
              <span className="flex items-center gap-1.5 text-[12.5px] text-[#111111]">
                <FileText className="w-3.5 h-3.5 text-[#6F6F6F]" /> Lecture 02 — Search.pdf
              </span>
              <span className="flex items-center gap-1.5 text-[12.5px] text-[#6F6F6F]">No link yet</span>
            </div>
          }
        />
      </SyllabusTable>

      <ClassMaterials classId={id} />
    </div>
  );
}
