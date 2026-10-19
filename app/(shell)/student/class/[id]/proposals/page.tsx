"use client";

import * as React from "react";
import { FileText, CheckCircle2, Clock, Send } from "lucide-react";
import { MockBadge } from "@/components/shared/MockBadge";

interface Proposal {
  id: string;
  title: string;
  submitted: string;
  status: "in_review" | "approved";
  summary: string;
}

const PROPOSALS: Proposal[] = [
  {
    id: "p1",
    title: "Learning-path recommendations for CS101 students",
    submitted: "2 days ago",
    status: "in_review",
    summary:
      "An agent that reads each student's quiz history and suggests which units to revisit before the midterm.",
  },
  {
    id: "p2",
    title: "Auto-summarised lecture notes from uploaded materials",
    submitted: "3 weeks ago",
    status: "approved",
    summary:
      "Generate a per-unit summary from the PDFs teachers upload, so students can skim before class.",
  },
];

const STATUS_META = {
  in_review: { dot: "#B4881F", label: "In Review", text: "#8F6B16" },
  approved: { dot: "#4B9E76", label: "Approved", text: "#3B7D5D" },
} as const;

export default function StudentProposalsPage() {
  return (
    <div className="max-w-[920px] space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold font-heading text-[#111111]">My Proposals</h2>
            <MockBadge title="Preview data — the proposals backend is not connected yet" />
          </div>
          <p className="text-[13px] text-[#5A5A5A] mt-0.5">Submit and track your project proposals.</p>
        </div>
        <button className="flex items-center gap-1.5 border border-[#CFCFCF] bg-white text-[#111111] shadow-xs hover:bg-[#F7F7F7] rounded text-[13px] font-semibold px-3.5 py-1.5 transition-colors">
          <Send className="w-3.5 h-3.5" /> Submit Proposal
        </button>
      </div>

      <div className="bg-white border border-[#DADADA] rounded-xl overflow-hidden shadow-sm divide-y divide-[#F0F0F0]">
        {PROPOSALS.map((proposal) => {
          const meta = STATUS_META[proposal.status];
          return (
            <div key={proposal.id} className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-lg bg-[#F7F7F7] text-[#111111] flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-[14.5px] font-semibold text-[#111111]">{proposal.title}</h3>
                    <p className="text-[12.5px] text-[#5A5A5A] mt-1 max-w-[560px] leading-relaxed">
                      {proposal.summary}
                    </p>
                    <p className="text-[11.5px] text-[#6F6F6F] mt-2 inline-flex items-center gap-1.5">
                      <Clock className="w-3 h-3" /> Submitted {proposal.submitted}
                    </p>
                  </div>
                </div>
                <span
                  className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-white border border-[#DADADA] whitespace-nowrap"
                  style={{ color: meta.text }}
                >
                  {proposal.status === "approved" ? (
                    <CheckCircle2 className="w-3 h-3 text-[#4B9E76]" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#B4881F]" />
                  )}
                  {meta.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
