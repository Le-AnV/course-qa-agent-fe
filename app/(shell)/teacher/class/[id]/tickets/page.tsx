"use client";

import * as React from "react";
import { TicketsInboxLayout } from "@/components/shared/TicketsInboxLayout";
import { CheckCircle2, CornerDownRight, Sparkles, Send } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ClassTicketsPage() {
  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState("open");
  const [selectedId, setSelectedId] = React.useState("t1");

  const filters = [
    { id: "open", label: "Open" },
    { id: "resolved", label: "Resolved" },
    { id: "all", label: "All" }
  ];

  const leftContent = (
    <div className="flex flex-col">
      <button 
        onClick={() => setSelectedId("t1")}
        className={cn(
          "w-full text-left p-3.5 transition-colors flex flex-col gap-1 border-b border-[#E2E8F0]",
          selectedId === "t1" ? "bg-[#EAF2FF]/60 border-l-[3px] border-l-[#2563EB]" : "hover:bg-slate-50 border-l-[3px] border-l-transparent"
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-[11.5px] font-semibold text-[#64748B]">Trần Gia Linh</span>
          </div>
          <span className="text-[10.5px] text-slate-400">10m ago</span>
        </div>
        <div className="text-[13px] font-semibold text-[#172033] line-clamp-1 mt-0.5">
          How should I structure the final proposal?
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-[#64748B] border border-[#E2E8F0]">Syllabus</span>
          <span className="text-[10px] font-semibold text-amber-600">Open</span>
        </div>
      </button>

      <button 
        onClick={() => setSelectedId("t2")}
        className={cn(
          "w-full text-left p-3.5 transition-colors flex flex-col gap-1",
          selectedId === "t2" ? "bg-[#EAF2FF]/60 border-l-[3px] border-l-[#2563EB]" : "hover:bg-slate-50 border-l-[3px] border-l-transparent"
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[11.5px] font-semibold text-[#64748B]">Lê Hoàng Nam</span>
          </div>
          <span className="text-[10.5px] text-slate-400">2d ago</span>
        </div>
        <div className="text-[13px] font-semibold text-[#172033] line-clamp-1 mt-0.5">
          Does the midterm cover Unit 03?
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-[#64748B] border border-[#E2E8F0]">Logistics</span>
          <span className="text-[10px] font-semibold text-emerald-600">Resolved</span>
        </div>
      </button>
    </div>
  );

  const rightContent = (
    <div className="flex flex-col h-full relative">
      <div className="p-5 border-b border-[#E2E8F0]">
        <div className="text-[11px] font-bold uppercase tracking-wider text-[#2563EB]">Syllabus</div>
        <h3 className="text-lg font-bold text-[#172033] mt-0.5 pr-32">How should I structure the final proposal?</h3>
        <div className="text-[12.5px] text-[#64748B] mt-1">Asked by Trần Gia Linh</div>
        
        <div className="absolute top-5 right-5">
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded text-[12px] font-semibold transition-colors">
            <CheckCircle2 className="w-3.5 h-3.5" /> Mark as resolved
          </button>
        </div>

        <div className="mt-4 text-[12px] bg-slate-50 border border-slate-200 px-3 py-1.5 rounded text-slate-600 flex items-center gap-1.5 w-fit">
          <CornerDownRight className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span>Syllabus Context: <strong>Unit 04 — Final Project</strong></span>
        </div>
      </div>

      <div className="p-5 flex-1 overflow-y-auto space-y-4">
        <div className="p-4 rounded-lg border text-[13px] leading-relaxed space-y-1.5 bg-slate-50 border-[#E2E8F0] mr-8">
          <div className="flex items-center justify-between text-[11.5px] font-semibold text-[#64748B]">
            <span>Trần Gia Linh</span>
            <span>10:30 AM</span>
          </div>
          <div className="text-[#172033] mt-1.5">
            Hi professor, should we include a literature review in the final project proposal? The syllabus mentions a &quot;background section&quot; but I wanted to be sure how deep it should go.
          </div>
        </div>

        <div className="p-4 rounded-lg bg-indigo-50/60 border border-indigo-200 ml-8">
          <div className="flex items-center gap-2 text-[12px] font-bold text-indigo-700 mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Suggested answer from Syllabus Agent
          </div>
          <div className="text-[12.5px] text-indigo-950 leading-relaxed">
            Based on the &quot;Final Project Guidelines&quot; in Unit 04, the background section requires a brief literature review citing at least 3 academic papers. It does not need to be a full comprehensive review at the proposal stage.
          </div>
          <div className="flex justify-end mt-2">
            <button className="text-[12px] font-semibold text-indigo-700 hover:underline">
              Use as draft reply &rarr;
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-[#E2E8F0] bg-slate-50/50">
        <textarea
          className="w-full p-3 bg-white border border-[#E2E8F0] rounded-[6px] text-[13px] placeholder-slate-400 outline-none focus:border-[#2563EB] min-h-[80px] resize-none"
          placeholder="Write a helpful reply..."
        />
        <div className="flex justify-end mt-2">
          <button className="flex items-center gap-1.5 px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-[6px] text-[13px] font-semibold transition-colors">
            <Send className="w-3.5 h-3.5" /> Send reply
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <TicketsInboxLayout
      title="Tickets"
      subtitle="Review and respond to student questions."
      searchValue={search}
      onSearchChange={setSearch}
      filters={filters}
      activeFilter={filter}
      onFilterChange={setFilter}
      leftListContent={leftContent}
      rightDetailContent={rightContent}
    />
  );
}
