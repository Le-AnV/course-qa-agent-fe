"use client";

import * as React from "react";
import { ChevronDown, ChevronRight, FileText, Search } from "lucide-react";
import { ChatMarkdown } from "@/features/chat/chat-markdown";
import { studentApi, type ClassSyllabusRoadmap } from "@/lib/student-api";
import { Reveal, SkeletonLine } from "@/components/shared/page-skeleton";

interface SyllabusTableProps {
  toolbar: React.ReactNode;
  children: React.ReactNode;
}

export function SyllabusTable({ toolbar, children }: SyllabusTableProps) {
  return (
    <div className="space-y-4">
      {toolbar}
      <div className="bg-white border border-[#DADADA] rounded-lg overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white border-b border-[#DADADA] text-[12px] font-medium text-[#6F6F6F]">
              <th className="py-3 px-4 w-16 text-center">Unit</th>
              <th className="py-3 px-4 w-1/4">Unit Name</th>
              <th className="py-3 px-4 w-1/3">Description</th>
              <th className="py-3 px-4">Content</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#DADADA] text-[13px]">
            {children}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface SyllabusRowProps {
  unitNumber: string;
  unitName: string;
  isDraft?: boolean;
  description: string;
  content: React.ReactNode;
  rowActions?: React.ReactNode;
}

export function SyllabusRow({
  unitNumber,
  unitName,
  isDraft,
  description,
  content,
  rowActions,
}: SyllabusRowProps) {
  return (
    <tr className="hover:bg-[#FAFAFA] transition-colors group">
      <td className="py-4 px-4 text-center font-mono font-bold text-[#5A5A5A] bg-slate-50/40 align-top">
        {unitNumber}
      </td>
      <td className="py-4 px-4 align-top relative">
        <div className="flex items-start gap-2">
          <span className="font-bold text-[14px] text-[#111111]">{unitName}</span>
          {isDraft && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full bg-white text-[#8F6B16] border border-[#ECDCB8] whitespace-nowrap mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B4881F]" />
              Draft
            </span>
          )}
        </div>
        {rowActions && (
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            {rowActions}
          </div>
        )}
      </td>
      <td className="py-4 px-4 text-[#5A5A5A] leading-relaxed align-top">
        {description}
      </td>
      <td className="py-4 px-4 align-top">
        {content}
      </td>
    </tr>
  );
}

function stripNotesLines(markdown: string): string {
  return markdown
    .split("\n")
    .filter((line) => !/^\s*[-*+]\s+\*Notes:\*/i.test(line))
    .join("\n");
}

export function SyllabusRoadmap({
  classId,
  isTeacher = false,
  refreshKey = 0,
}: {
  classId: string;
  isTeacher?: boolean;
  refreshKey?: number;
}) {
  const [roadmap, setRoadmap] = React.useState<ClassSyllabusRoadmap | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [expandedIds, setExpandedIds] = React.useState<Record<string, boolean>>({});

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await studentApi.syllabusRoadmap(classId);
      const sortedUnits = [...(data.units ?? [])].sort(
        (a, b) => a.unit_number - b.unit_number,
      );
      setRoadmap({ ...data, units: sortedUnits });
      setExpandedIds({});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load syllabus roadmap");
    } finally {
      setLoading(false);
    }
  }, [classId]);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount and when refreshKey increments; state updates happen after await.
    void load();
  }, [load, refreshKey]);

  const units = roadmap?.units ?? [];
  const q = search.trim().toLowerCase();
  const filteredUnits = q
    ? units.filter(
        (u) =>
          u.unit_title.toLowerCase().includes(q) ||
          (u.description ?? "").toLowerCase().includes(q) ||
          u.content.toLowerCase().includes(q),
      )
    : units;

  const allExpanded =
    filteredUnits.length > 0 && filteredUnits.every((u) => Boolean(expandedIds[u.id]));

  function toggleUnit(unitId: string) {
    setExpandedIds((prev) => ({ ...prev, [unitId]: !prev[unitId] }));
  }

  function toggleAll() {
    if (allExpanded) {
      setExpandedIds({});
    } else {
      const next: Record<string, boolean> = {};
      for (const u of filteredUnits) next[u.id] = true;
      setExpandedIds(next);
    }
  }

  return (
    <section aria-labelledby="syllabus-roadmap-heading" className="space-y-4">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2
              id="syllabus-roadmap-heading"
              className="text-xl font-bold font-heading text-[#111111]"
            >
              Syllabus
            </h2>
            {roadmap?.file_name && (
              <span
                title={`Parsed from ${roadmap.file_name}`}
                className="inline-flex items-center gap-1.5 rounded-md border border-[#DADADA] bg-[#FAFAFA] px-2.5 py-0.5 text-[11.5px] font-medium text-[#5A5A5A]"
              >
                <FileText className="h-3.5 w-3.5 text-[#C4644C]" />
                {roadmap.file_name}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[13px] text-[#5A5A5A]">
            {isTeacher
              ? "Course units parsed from the approved syllabus and the learning materials uploaded for this class."
              : "Course learning roadmap and approved materials for this class."}
          </p>
        </div>

        {loading ? (
          <div className="flex flex-wrap items-center gap-2.5">
            <SkeletonLine className="h-8 w-56" />
            <SkeletonLine className="h-8 w-24" />
          </div>
        ) : (
          units.length > 0 && (
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="absolute left-2.5 top-1.5 h-4 w-4 text-[#6F6F6F]" />
              <input
                type="text"
                placeholder="Search units"
                aria-label="Search syllabus units"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-56 rounded border border-[#DADADA] bg-white py-1.5 pl-8 pr-3 text-[12.5px] text-[#111111] outline-none focus:border-[#111111]"
              />
            </div>
            <button
              type="button"
              onClick={toggleAll}
              className="rounded border border-[#DADADA] bg-white px-3 py-1.5 text-[12.5px] font-semibold text-[#111111] transition-colors hover:bg-[#F7F7F7]"
            >
              {allExpanded ? "Collapse all" : "Expand all"}
            </button>
          </div>
          )
        )}
      </div>

      {loading ? (
        <div className="divide-y divide-[#DADADA] overflow-hidden rounded-lg border border-[#DADADA] bg-white">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3.5 px-4 py-3.5">
              <SkeletonLine className="h-7 w-9" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <SkeletonLine className="h-4 w-2/3" />
                <SkeletonLine className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-[#DFB2A6] bg-[#F7F7F7] p-6 text-center text-[13px]">
          <p className="text-[#9D4C38]">{error}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-2 font-semibold text-[#111111] hover:underline"
          >
            Retry
          </button>
        </div>
      ) : units.length === 0 ? (
        <div className="rounded-lg border border-[#DADADA] bg-white p-8 text-center text-[13px] text-[#5A5A5A]">
          {isTeacher
            ? "No syllabus roadmap yet — upload and approve a Syllabus file (.xlsx, .xls, or .md) in Materials below to generate course units."
            : "No syllabus roadmap yet — your trainer hasn't published an approved syllabus for this class."}
        </div>
      ) : filteredUnits.length === 0 ? (
        <p className="rounded-lg border border-[#DADADA] bg-white py-8 text-center text-[13px] text-[#5A5A5A]">
          No units match &ldquo;{search.trim()}&rdquo;.
        </p>
      ) : (
        <Reveal className="divide-y divide-[#DADADA] overflow-hidden rounded-lg border border-[#DADADA] bg-white">
          {filteredUnits.map((unit) => {
            const isExpanded = Boolean(expandedIds[unit.id]) || Boolean(q);
            const formattedNum = String(unit.unit_number).padStart(2, "0");

            return (
              <div key={unit.id} className="transition-colors">
                <button
                  type="button"
                  onClick={() => toggleUnit(unit.id)}
                  aria-expanded={isExpanded}
                  className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left transition-colors hover:bg-[#FAFAFA]"
                >
                  <div className="flex min-w-0 items-center gap-3.5">
                    <span className="inline-flex h-7 w-9 shrink-0 items-center justify-center rounded border border-[#E2E2E2] bg-slate-50 font-mono text-[12.5px] font-bold text-[#5A5A5A]">
                      {formattedNum}
                    </span>
                    <div className="min-w-0">
                      <span className="block truncate text-[14px] font-bold text-[#111111]">
                        {unit.unit_title}
                      </span>
                      {unit.description && (
                        <span className="mt-0.5 block text-[12px] text-[#5A5A5A]">
                          {unit.description}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="flex shrink-0 items-center gap-1.5 text-[12px] font-medium text-[#6F6F6F]">
                    <span className="hidden sm:inline">
                      {isExpanded ? "Hide outline" : "View outline"}
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-[#111111]" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-[#6F6F6F]" />
                    )}
                  </span>
                </button>

                {isExpanded && (
                  <div className="border-t border-[#EFEFEF] bg-[#FCFCFC] px-5 py-4 pl-16 text-[13px] leading-relaxed text-[#111111]">
                    <ChatMarkdown content={stripNotesLines(unit.content)} />
                  </div>
                )}
              </div>
            );
          })}
        </Reveal>
      )}
    </section>
  );
}
