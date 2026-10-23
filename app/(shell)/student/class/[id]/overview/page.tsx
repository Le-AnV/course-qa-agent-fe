"use client";

import * as React from "react";
import { BookOpen, Users, FileText } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { studentApi, type ClassInfo, type StudentClass } from "@/lib/student-api";
import { ClassInfoCard, hasClassInfo } from "@/components/shared/ClassInfoCard";

export default function StudentClassOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [cls, setCls] = React.useState<StudentClass | null>(null);
  const [info, setInfo] = React.useState<ClassInfo | null>(null);
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
        const page = await studentApi.info(id);
        if (!cancelled) setInfo(page);
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
        <div className="bg-white border border-[#DADADA] rounded-xl p-8 text-center text-[#5A5A5A] text-[13px]">
          Loading class overview…
        </div>
      </div>
    );
  }

  if (error || !cls) {
    return (
      <div className="space-y-8 max-w-[920px]">
        <div className="bg-white border border-[#CFCFCF] rounded-xl p-6 text-center text-[13px]">
          <p className="text-[#9D4C38]">{error ?? "Class not found."}</p>
          <button onClick={() => router.push("/student/classes")} className="mt-2 text-[#111111] font-semibold hover:underline">
            Back to My Classes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[920px]">
      <div>
        <h2 className="text-[22px] font-bold font-heading text-[#111111]">Class Overview</h2>
        <p className="text-[14px] text-[#5A5A5A] mt-0.5">
          {cls.name} · Trainer: {cls.trainer_name ?? "—"}
        </p>
      </div>

      {/* Stats Grid — real counts from the backend */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white border border-[#DADADA] rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-md bg-[#F7F7F7] text-[#111111] flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <span className="text-[13px] font-semibold text-[#5A5A5A]">Resources</span>
          </div>
          <p className="text-2xl font-bold text-[#111111]">{cls.document_count}</p>
        </div>

        <div className="bg-white border border-[#DADADA] rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-md bg-[#F7F7F7] text-[#111111] flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-[13px] font-semibold text-[#5A5A5A]">Members</span>
          </div>
          <p className="text-2xl font-bold text-[#111111]">{cls.member_count}</p>
        </div>

        <div className="bg-white border border-[#DADADA] rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-md bg-[#F7F7F7] text-[#111111] flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <span className="text-[13px] font-semibold text-[#5A5A5A]">Credits</span>
          </div>
          <p className="text-2xl font-bold text-[#111111]">{cls.credits}</p>
        </div>
      </div>

      {/* Class information — written by the trainer on Course Settings */}
      {hasClassInfo(info) && <ClassInfoCard info={info} />}

    </div>
  );
}
