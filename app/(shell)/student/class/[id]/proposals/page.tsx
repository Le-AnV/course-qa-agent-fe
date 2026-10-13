"use client";

import * as React from "react";
import { Plus, Clock, CheckCircle2, XCircle, FileText } from "lucide-react";

export default function StudentProposalsPage() {
  return (
    <div className="max-w-[920px] space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h2 className="text-xl font-bold font-heading text-[#172033]">My Proposals</h2>
          <p className="text-[13px] text-[#64748B] mt-0.5">Submit and track your project proposals.</p>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-[8px] text-[13px] font-semibold transition-colors shadow-sm w-fit">
          <Plus className="w-4 h-4" />
          Submit Proposal
        </button>
      </div>

      <div className="space-y-8">
        {/* Pending Proposals */}
        <div>
          <h3 className="text-[14px] font-bold text-[#1e293b] flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-amber-500" /> Pending Review
          </h3>
          <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-md bg-amber-50 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h4 className="text-[14.5px] font-semibold text-[#172033]">Final Project: Pathfinding Visualizer</h4>
                <p className="text-[12.5px] text-[#64748B] mt-1 line-clamp-2 max-w-xl">
                  A web application that visualizes different pathfinding algorithms like A*, Dijkstra, and BFS on a grid with obstacles.
                </p>
                <div className="flex items-center gap-3 mt-3">
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">In Review</span>
                  <span className="text-[11px] text-[#94a3b8]">Submitted 2 days ago</span>
                </div>
              </div>
            </div>
            <button className="text-[12.5px] font-semibold text-[#2563EB] hover:underline whitespace-nowrap self-start sm:self-center">
              View details
            </button>
          </div>
        </div>

        {/* Approved Proposals */}
        <div>
          <h3 className="text-[14px] font-bold text-[#1e293b] flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Approved
          </h3>
          <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 opacity-75 hover:opacity-100 transition-opacity">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-md bg-emerald-50 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h4 className="text-[14.5px] font-semibold text-[#172033]">Midterm Project: NLP Chatbot</h4>
                <p className="text-[12.5px] text-[#64748B] mt-1 line-clamp-2 max-w-xl">
                  A simple chatbot using basic NLP techniques for intent recognition.
                </p>
                <div className="flex items-center gap-3 mt-3">
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">Approved</span>
                  <span className="text-[11px] text-[#94a3b8]">Approved 1 week ago</span>
                </div>
              </div>
            </div>
            <button className="text-[12.5px] font-semibold text-[#2563EB] hover:underline whitespace-nowrap self-start sm:self-center">
              View details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
