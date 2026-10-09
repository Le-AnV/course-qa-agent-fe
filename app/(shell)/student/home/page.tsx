"use client";

import * as React from "react";
import Link from "next/link";
import { Ticket, FileText, CheckCircle2, MessageSquare, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function StudentHomePage() {
  const router = useRouter();

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 pb-16 pt-8 px-6 bg-[#F8FAFC]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-[28px] font-[family-name:var(--font-lora)] font-bold text-[#1e293b] tracking-tight">Welcome back, Trần Gia Linh</h1>
          <p className="text-[14px] text-[#64748B] mt-1">
            Here is your latest activity and upcoming deadlines.
          </p>
        </div>
      </div>

      {/* Notifications */}
      <div className="w-full">
        {/* Important Updates */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
            <h2 className="text-[15px] font-[family-name:var(--font-lora)] font-bold text-[#1e293b]">Important Updates</h2>
            <span className="px-2.5 py-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/60 rounded uppercase tracking-wider">Unread</span>
          </div>
          <div className="p-6 space-y-5">
            <div className="flex items-center gap-4 group cursor-pointer">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-[14px] font-bold text-[#1e293b] group-hover:text-[#2563eb] transition-colors">Proposal Approved</h3>
                <p className="text-[12.5px] text-[#64748b] mt-0.5">Your project proposal for CS 401 was approved</p>
              </div>
              <span className="text-[12.5px] font-semibold text-[#2563eb] flex items-center gap-0.5">View <ChevronRight className="w-3 h-3" /></span>
            </div>
            
            <div className="flex items-center gap-4 group cursor-pointer">
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-[14px] font-bold text-[#1e293b] group-hover:text-[#2563eb] transition-colors">Agent replied</h3>
                <p className="text-[12.5px] text-[#64748b] mt-0.5">New answer for: &quot;What is A* search?&quot;</p>
              </div>
              <span className="text-[12.5px] font-semibold text-[#2563eb] flex items-center gap-0.5">Read <ChevronRight className="w-3 h-3" /></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
