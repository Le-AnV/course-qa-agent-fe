"use client";

import * as React from "react";
import { BookOpen, Ticket, Users, FileText, ArrowRight, BotMessageSquare } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function StudentClassHomePage() {
  const params = useParams();
  const id = params.id as string;

  return (
    <div className="space-y-6 max-w-[920px]">
      <div>
        <h2 className="text-xl font-bold font-[family-name:var(--font-lora)] text-[#172033]">Class Overview</h2>
        <p className="text-[13px] text-[#64748B] mt-0.5">Access your course materials and tools.</p>
      </div>

      <div className="space-y-3">
        {/* Syllabus Row */}
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-4 flex items-center justify-between hover:bg-[#F8FAFC] transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-[#172033]">Syllabus</h3>
              <p className="text-[12.5px] text-[#64748B] mt-0.5">View units, documents, and external links.</p>
              <div className="text-[12px] text-[#64748B] mt-1 font-medium">12 units · 28 resources</div>
            </div>
          </div>
          <Link href={`/student/class/${id}/syllabus`} className="text-[12.5px] font-semibold text-[#2563EB] hover:underline whitespace-nowrap">
            View syllabus
          </Link>
        </div>

        {/* Q&A Agent Row */}
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-4 flex items-center justify-between hover:bg-[#F8FAFC] transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <BotMessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-[#172033]">Q&A Agent</h3>
              <p className="text-[12.5px] text-[#64748B] mt-0.5">Ask questions and get AI-powered answers based on the syllabus.</p>
            </div>
          </div>
          <Link href={`/student/class/${id}/agent`} className="text-[12.5px] font-semibold text-[#2563EB] hover:underline whitespace-nowrap">
            Ask a question
          </Link>
        </div>

        {/* Proposals Row */}
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-4 flex items-center justify-between hover:bg-[#F8FAFC] transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-[#172033]">My Proposals</h3>
              <p className="text-[12.5px] text-[#64748B] mt-0.5">Submit and track your project proposals.</p>
              <div className="text-[12px] text-[#64748B] mt-1 font-medium">1 pending review</div>
            </div>
          </div>
          <Link href={`/student/class/${id}/proposals`} className="text-[12.5px] font-semibold text-[#2563EB] hover:underline whitespace-nowrap">
            View proposals
          </Link>
        </div>

        {/* Members Row */}
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-4 flex items-center justify-between hover:bg-[#F8FAFC] transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-[#172033]">Members</h3>
              <p className="text-[12.5px] text-[#64748B] mt-0.5">View your classmates and teachers.</p>
              <div className="text-[12px] text-[#64748B] mt-1 font-medium">34 members</div>
            </div>
          </div>
          <Link href={`/student/class/${id}/members`} className="text-[12.5px] font-semibold text-[#2563EB] hover:underline whitespace-nowrap">
            View members
          </Link>
        </div>
      </div>
    </div>
  );
}
