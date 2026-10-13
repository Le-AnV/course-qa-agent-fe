"use client";

import * as React from "react";
import Link from "next/link";
import { Ticket, FileText, CheckCircle2, MessageSquare, Plus, Mail, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function TeacherHomePage() {
  const router = useRouter();

  const activeClasses = [
    {
      id: "cs-401",
      code: "CS 401",
      term: "Fall 2026",
      name: "Introduction to Artificial Intelligence",
      dept: "Computer Science",
      tickets: 8,
      students: 34,
      accent: "#2563EB",
    },
    {
      id: "se-301",
      code: "SE 301",
      term: "Fall 2026",
      name: "Software Engineering",
      dept: "Software Engineering",
      tickets: 3,
      students: 42,
      accent: "#0EA5E9",
    },
    {
      id: "cs-310",
      code: "CS 310",
      term: "Fall 2026",
      name: "Machine Learning Foundations",
      dept: "Computer Science",
      tickets: 1,
      students: 28,
      accent: "#6366F1",
    }
  ];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 pb-16 pt-8 px-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-[28px] font-heading font-bold text-[#1e293b] tracking-tight">Good afternoon, Minh</h1>
          <p className="text-[14px] text-[#64748B] mt-1">
            Here is what needs your attention today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-[#e2e8f0] bg-white hover:bg-slate-50 text-[#334155] rounded-lg text-[13px] font-semibold transition-all shadow-sm">
            <Mail className="w-4 h-4 text-[#94a3b8]" />
            View all tickets
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#2563eb] hover:bg-blue-700 text-white rounded-lg text-[13px] font-semibold transition-all shadow-sm">
            <Plus className="w-4 h-4" />
            Create a class
          </button>
        </div>
      </div>

      {/* Two Column Grid for Attention / Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Needs Attention */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
            <h2 className="text-[15px] font-heading font-bold text-[#1e293b]">Needs Attention</h2>
            <span className="px-2.5 py-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/60 rounded uppercase tracking-wider">Action Required</span>
          </div>
          <div className="p-6 space-y-5">
            <div className="flex items-center gap-4 group cursor-pointer">
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <span className="font-bold text-[16px]">3</span>
              </div>
              <div className="flex-1">
                <h3 className="text-[14px] font-bold text-[#1e293b] group-hover:text-[#2563eb] transition-colors">Open student tickets</h3>
                <p className="text-[12.5px] text-[#64748b] mt-0.5">3 tickets marked high priority</p>
              </div>
              <span className="text-[12.5px] font-semibold text-[#2563eb] flex items-center gap-0.5">Respond <ChevronRight className="w-3 h-3" /></span>
            </div>
            
            <div className="flex items-center gap-4 group cursor-pointer">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <span className="font-bold text-[16px]">2</span>
              </div>
              <div className="flex-1">
                <h3 className="text-[14px] font-bold text-[#1e293b] group-hover:text-[#2563eb] transition-colors">Proposals awaiting review</h3>
                <p className="text-[12.5px] text-[#64748b] mt-0.5">Submitted by Linh and Nam</p>
              </div>
              <span className="text-[12.5px] font-semibold text-[#2563eb] flex items-center gap-0.5">Review <ChevronRight className="w-3 h-3" /></span>
            </div>
          </div>
        </div>

        {/* Activity & Draft Status */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
            <h2 className="text-[15px] font-heading font-bold text-[#1e293b]">Activity & Draft Status</h2>
            <span className="px-2.5 py-1 text-[10px] font-bold text-[#2563eb] bg-[#eff6ff] border border-blue-200/60 rounded uppercase tracking-wider">Synced</span>
          </div>
          <div className="p-6 space-y-5">
            <div className="flex items-center gap-4 group cursor-pointer">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <span className="font-bold text-[16px]">4</span>
              </div>
              <div className="flex-1">
                <h3 className="text-[14px] font-bold text-[#1e293b] group-hover:text-[#2563eb] transition-colors">New student activity</h3>
                <p className="text-[12.5px] text-[#64748b] mt-0.5">Member requests & lab submissions</p>
              </div>
              <span className="text-[12px] font-medium text-slate-400">Today</span>
            </div>
            
            <div className="flex items-center gap-4 group cursor-pointer">
              <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                <span className="font-bold text-[16px]">1</span>
              </div>
              <div className="flex-1">
                <h3 className="text-[14px] font-bold text-[#1e293b] group-hover:text-[#2563eb] transition-colors">Syllabus update saved as draft</h3>
                <p className="text-[12.5px] text-[#64748b] mt-0.5">Week 05 - Ethics in AI draft</p>
              </div>
              <span className="text-[12.5px] font-semibold text-[#2563eb] flex items-center gap-0.5">Publish <ChevronRight className="w-3 h-3" /></span>
            </div>
          </div>
        </div>
      </div>

      {/* Classes you manage */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[17px] font-heading font-bold text-[#1e293b]">Classes you manage</h2>
          <Link href="/teacher/classes" className="text-[13px] font-semibold text-[#2563eb] hover:underline flex items-center gap-1">
            View all classes (4) <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {activeClasses.map(cls => (
            <div key={cls.id} className="bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow flex flex-col overflow-hidden">
              <div className="h-1.5 w-full" style={{ backgroundColor: cls.accent }} />
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-center justify-between text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest mb-3">
                  <span>{cls.code}</span>
                  <span>{cls.term}</span>
                </div>
                <h3 className="text-[15px] font-heading font-bold text-[#1e293b] leading-snug mb-1.5">{cls.name}</h3>
                <p className="text-[13px] text-[#64748b] mb-6">{cls.dept}</p>
                
                <div className="flex items-center gap-4 text-[12px] text-[#64748b] font-medium mt-auto mb-5">
                  <div className="flex items-center gap-1.5">
                    <Ticket className="w-3.5 h-3.5 text-amber-500" />
                    <span className={cls.tickets > 0 ? "text-amber-700 font-bold" : ""}>{cls.tickets} tickets</span>
                  </div>
                  <span>{cls.students} students</span>
                </div>
                
                <button 
                  onClick={() => router.push(`/teacher/class/${cls.id}/home`)}
                  className="w-full py-2 bg-[#f8fafc] hover:bg-[#f1f5f9] text-[#334155] rounded-lg text-[13px] font-semibold transition-colors border border-slate-100"
                >
                  Manage class
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Course Activity */}
      <div className="pt-2">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-[17px] font-heading font-bold text-[#1e293b] mb-5">Recent course activity</h2>
          <div className="space-y-5">
            <div className="flex items-center justify-between text-[13px]">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <span className="text-[#334155]"><strong className="text-[#1e293b] font-semibold">Tuấn</strong> asked a question in Unit 04</span>
              </div>
              <span className="text-[#94a3b8] font-medium text-[12px]">10 min ago</span>
            </div>
            
            <div className="flex items-center justify-between text-[13px]">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <span className="text-[#334155]"><strong className="text-[#1e293b] font-semibold">Linh</strong> submitted proposal for AI Study Planner</span>
              </div>
              <span className="text-[#94a3b8] font-medium text-[12px]">1 hour ago</span>
            </div>
            
            <div className="flex items-center justify-between text-[13px]">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <span className="text-[#334155]">Syllabus imported for CS 401</span>
              </div>
              <span className="text-[#94a3b8] font-medium text-[12px]">3 hours ago</span>
            </div>
            
            <div className="flex items-center justify-between text-[13px]">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <span className="text-[#334155]"><strong className="text-[#1e293b] font-semibold">Nam</strong> asked a question about Assignment 2</span>
              </div>
              <span className="text-[#94a3b8] font-medium text-[12px]">Yesterday</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
