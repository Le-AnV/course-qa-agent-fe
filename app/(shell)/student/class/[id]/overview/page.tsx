"use client";

import * as React from "react";
import { BookOpen, Users, FileText, Bell, ChevronRight, BotMessageSquare } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { getClassById } from "@/lib/classes";

export default function StudentClassOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const cls = getClassById(id);

  return (
    <div className="space-y-8 max-w-[920px]">
      <div>
        <h2 className="text-[22px] font-bold font-[family-name:var(--font-lora)] text-[#172033]">Class Overview</h2>
        <p className="text-[14px] text-[#64748B] mt-0.5">At a glance information and quick actions for your class.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <span className="text-[13px] font-semibold text-[#64748B]">Units</span>
          </div>
          <p className="text-2xl font-bold text-[#172033]">{cls?.units ?? 12}</p>
        </div>
        
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <span className="text-[13px] font-semibold text-[#64748B]">Resources</span>
          </div>
          <p className="text-2xl font-bold text-[#172033]">{cls?.resources ?? 28}</p>
        </div>
        
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-[13px] font-semibold text-[#64748B]">Members</span>
          </div>
          <p className="text-2xl font-bold text-[#172033]">{cls?.members ?? 34}</p>
        </div>
        
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <span className="text-[13px] font-semibold text-[#64748B]">My Proposals</span>
          </div>
          <p className="text-2xl font-bold text-[#172033]">2</p>
        </div>
      </div>

      {/* Shortcuts */}
      <div className="space-y-4">
        <h3 className="text-[17px] font-bold font-[family-name:var(--font-lora)] text-[#172033]">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div 
            onClick={() => router.push(`/student/class/${id}/syllabus`)}
            className="group bg-white border border-[#E2E8F0] rounded-xl p-5 flex items-center justify-between cursor-pointer hover:border-blue-200 hover:shadow-md transition-all hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-[14.5px] font-semibold text-[#172033] group-hover:text-[#2563EB] transition-colors">View Syllabus</h4>
                <p className="text-[12.5px] text-[#64748B] mt-0.5">Access course materials.</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#CBD5E1] group-hover:text-[#2563EB] transition-colors" />
          </div>

          <div 
            onClick={() => router.push(`/student/class/${id}/agent`)}
            className="group bg-white border border-[#E2E8F0] rounded-xl p-5 flex items-center justify-between cursor-pointer hover:border-blue-200 hover:shadow-md transition-all hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <BotMessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-[14.5px] font-semibold text-[#172033] group-hover:text-[#2563EB] transition-colors">Q&A Agent</h4>
                <p className="text-[12.5px] text-[#64748B] mt-0.5">Ask questions anytime.</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#CBD5E1] group-hover:text-[#2563EB] transition-colors" />
          </div>

          <div 
            onClick={() => router.push(`/student/class/${id}/proposals`)}
            className="group bg-white border border-[#E2E8F0] rounded-xl p-5 flex items-center justify-between cursor-pointer hover:border-blue-200 hover:shadow-md transition-all hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-[14.5px] font-semibold text-[#172033] group-hover:text-[#2563EB] transition-colors">My Proposals</h4>
                <p className="text-[12.5px] text-[#64748B] mt-0.5">Submit project ideas.</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#CBD5E1] group-hover:text-[#2563EB] transition-colors" />
          </div>

          <div 
            onClick={() => router.push(`/student/class/${id}/members`)}
            className="group bg-white border border-[#E2E8F0] rounded-xl p-5 flex items-center justify-between cursor-pointer hover:border-blue-200 hover:shadow-md transition-all hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-[14.5px] font-semibold text-[#172033] group-hover:text-[#2563EB] transition-colors">Class Members</h4>
                <p className="text-[12.5px] text-[#64748B] mt-0.5">View your peers.</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#CBD5E1] group-hover:text-[#2563EB] transition-colors" />
          </div>
        </div>
      </div>

      {/* Announcements */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[17px] font-bold font-[family-name:var(--font-lora)] text-[#172033]">Class Announcements</h3>
        </div>
        
        <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-[14px] font-bold text-[#172033]">Welcome to the Course!</h4>
                <p className="text-[11px] text-[#64748B]">Posted by Minh • 2 days ago</p>
              </div>
            </div>
            <p className="text-[13.5px] text-[#334155] leading-relaxed">
              Welcome everyone to CS 401. Please make sure to review the syllabus and join our Q&A Agent system. The first assignment will be released next week. Let me know if you have any questions by opening a ticket.
            </p>
          </div>
          
          <div className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-[14px] font-bold text-[#172033]">Guest Lecture on Friday</h4>
                <p className="text-[11px] text-[#64748B]">Posted by Minh • 1 week ago</p>
              </div>
            </div>
            <p className="text-[13.5px] text-[#334155] leading-relaxed">
              We will have a guest lecturer from Google joining us this Friday to talk about real-world AI applications. Attendance is highly recommended!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
