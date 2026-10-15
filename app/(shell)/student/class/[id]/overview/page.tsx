"use client";

import * as React from "react";
import { BookOpen, Users, FileText, Bell, ChevronRight, BotMessageSquare } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { studentApi, type StudentClass } from "@/lib/student-api";
import { MockBadge } from "@/components/shared/MockBadge";

export default function StudentClassOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [cls, setCls] = React.useState<StudentClass | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const detail = await studentApi.classDetail(id);
        if (!cancelled) setCls(detail);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load class");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-8 max-w-[920px]">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 text-center text-[#64748B] text-[13px]">
          Loading class overview…
        </div>
      </div>
    );
  }

  if (error || !cls) {
    return (
      <div className="space-y-8 max-w-[920px]">
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center text-[13px]">
          <p className="text-rose-700">{error ?? "Class not found."}</p>
          <button onClick={() => router.push("/student/classes")} className="mt-2 text-[#2563EB] font-semibold hover:underline">
            Back to My Classes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[920px]">
      <div>
        <h2 className="text-[22px] font-bold font-heading text-[#172033]">Class Overview</h2>
        <p className="text-[14px] text-[#64748B] mt-0.5">
          {cls.name} · Trainer: {cls.trainer_name ?? "—"}
        </p>
      </div>

      {/* Stats Grid — real counts from the backend */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <span className="text-[13px] font-semibold text-[#64748B]">Resources</span>
          </div>
          <p className="text-2xl font-bold text-[#172033]">{cls.document_count}</p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-[13px] font-semibold text-[#64748B]">Members</span>
          </div>
          <p className="text-2xl font-bold text-[#172033]">{cls.member_count}</p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <span className="text-[13px] font-semibold text-[#64748B]">Credits</span>
          </div>
          <p className="text-2xl font-bold text-[#172033]">{cls.credits}</p>
        </div>
      </div>

      {/* Shortcuts */}
      <div className="space-y-4">
        <h3 className="text-[17px] font-bold font-heading text-[#172033]">Quick Actions</h3>
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
                <h4 className="text-[14.5px] font-semibold text-[#172033] group-hover:text-[#2563EB] transition-colors">
                  Q&A Agent <MockBadge className="ml-1" />
                </h4>
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
                <h4 className="text-[14.5px] font-semibold text-[#172033] group-hover:text-[#2563EB] transition-colors">
                  My Proposals <MockBadge className="ml-1" />
                </h4>
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

      {/* Announcements — still sample content until the backend ships it */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="text-[17px] font-bold font-heading text-[#172033]">Class Announcements</h3>
          <MockBadge title="Sample announcements — backend for this surface is not built yet" />
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-[14px] font-bold text-[#172033]">Welcome to the Course!</h4>
                <p className="text-[11px] text-[#64748B]">Posted by {cls.trainer_name ?? "Trainer"} • 2 days ago</p>
              </div>
            </div>
            <p className="text-[13.5px] text-[#334155] leading-relaxed">
              Welcome everyone to {cls.code}. Please make sure to review the syllabus and join our Q&A Agent system. The first assignment will be released next week.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
