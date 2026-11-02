"use client";

import * as React from "react";
import { FileText, CheckCircle2, Clock, Send } from "lucide-react";
import { ClassPageHeader } from "@/components/shared/ClassPageHeader";
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
    <div className="space-y-6">
      <ClassPageHeader
        title="My Proposals"
        subtitle="Submit and track your project proposals."
        badge={
          <MockBadge title={"Preview data \u2014 the proposals backend is not connected yet"} />
        }
        actions={
          <button className="flex items-center gap-1.5 rounded border border-[#CFCFCF] bg-white px-3.5 py-1.5 text-[13px] font-semibold text-[#111111] shadow-xs transition-colors hover:bg-[#F7F7F7]">
            <Send className="w-3.5 h-3.5" /> Submit Proposal
          </button>
        }
      />

      <div className="overflow-hidden divide-y divide-[#F0F0F0] rounded-xl border border-[#DADADA] bg-white shadow-sm">
        {PROPOSALS.map((proposal) => {
          const meta = STATUS_META[proposal.status];
          return (
            <div key={proposal.id} className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F7F7F7] text-[#111111]">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-[14.5px] font-semibold text-[#111111]">
                      {proposal.title}
                    </h3>
                    <p className="mt-1 max-w-[560px] text-[12.5px] leading-relaxed text-[#5A5A5A]">
                      {proposal.summary}
                    </p>
                    <p className="mt-2 inline-flex items-center gap-1.5 text-[11.5px] text-[#6F6F6F]">
                      <Clock className="h-3 w-3" /> Submitted {proposal.submitted}
                    </p>
                  </div>
                </div>
                <span
                  className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-[#DADADA] bg-white px-2.5 py-1 text-[11px] font-medium"
                  style={{ color: meta.text }}
                >
                  {proposal.status === "approved" ? (
                    <CheckCircle2 className="h-3 w-3 text-[#4B9E76]" />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#B4881F]" />
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
