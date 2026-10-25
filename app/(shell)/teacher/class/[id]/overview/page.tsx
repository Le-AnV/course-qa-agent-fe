"use client";

import * as React from "react";
import { BookOpen, Users, FileText, PencilLine } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { studentApi, type ClassInfo, type StudentClass } from "@/lib/student-api";
import { ClassInfoCard, hasClassInfo } from "@/components/shared/ClassInfoCard";
import { peekClassDetail } from "@/lib/class-cache";
import { useIsomorphicLayoutEffect } from "@/hooks/use-isomorphic-layout-effect";
import { Reveal, SkeletonCard, SkeletonLine } from "@/components/shared/page-skeleton";

export default function TeacherClassOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [cls, setCls] = React.useState<StudentClass | null>(null);
  const [info, setInfo] = React.useState<ClassInfo | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // The class layout already wrote this record to the warm cache before paint,
  // so seed it here: the title and stat grid then render with real data on the
  // first frame instead of flashing a placeholder and swapping it out.
  useIsomorphicLayoutEffect(() => {
    const cached = peekClassDetail(id);
    if (cached) setCls((current) => current ?? cached);
  }, [id]);

  const load = React.useCallback(async () => {
    try {
      setError(null);
      setCls(await studentApi.classDetail(id));
      setInfo(await studentApi.info(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load class");
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-time fetch; load() only sets state after await.
    void load();
  }, [load]);

  const retry = () => {
    setLoading(true);
    void load();
  };

  const stat = (label: string, icon: React.ReactNode, value: React.ReactNode) => (
    <div className="bg-white border border-[#DADADA] rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-md bg-[#F7F7F7] text-[#111111] flex items-center justify-center shrink-0">
          {icon}
        </div>
        <span className="text-[13px] font-semibold text-[#5A5A5A]">{label}</span>
      </div>
      <p className="text-2xl font-bold text-[#111111]">{value}</p>
    </div>
  );

  // Cold load (no cached record): one skeleton per real block, same footprint.
  const cold = loading && !cls;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-[22px] font-bold font-heading text-[#111111]">Class Overview</h2>
        {cls ? (
          <p className="text-[14px] text-[#5A5A5A] mt-0.5">
            {cls.code} · {cls.name}
          </p>
        ) : (
          <SkeletonLine className="mt-2 h-4 w-56" />
        )}
      </div>

      {cold ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <SkeletonCard>
              <SkeletonLine className="h-8 w-8" />
              <SkeletonLine className="mt-3 h-3 w-20" />
              <SkeletonLine className="mt-2 h-6 w-12" />
            </SkeletonCard>
            <SkeletonCard>
              <SkeletonLine className="h-8 w-8" />
              <SkeletonLine className="mt-3 h-3 w-20" />
              <SkeletonLine className="mt-2 h-6 w-12" />
            </SkeletonCard>
            <SkeletonCard>
              <SkeletonLine className="h-8 w-8" />
              <SkeletonLine className="mt-3 h-3 w-20" />
              <SkeletonLine className="mt-2 h-6 w-12" />
            </SkeletonCard>
          </div>
          <SkeletonCard className="h-[180px]" />
        </>
      ) : error || !cls ? (
        <div className="bg-white border border-[#CFCFCF] rounded-xl p-6 text-center text-[13px]">
          <p className="text-[#9D4C38]">{error ?? "Class not found."}</p>
          <button onClick={retry} className="mt-2 text-[#111111] font-semibold hover:underline">
            Retry
          </button>
        </div>
      ) : (
        <Reveal className="space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {stat("Resources", <FileText className="w-4 h-4" />, cls.document_count)}
            {stat("Members", <Users className="w-4 h-4" />, cls.member_count)}
            {stat("Credits", <BookOpen className="w-4 h-4" />, cls.credits)}
          </div>

          <ClassInfoCard
            info={info}
            action={
              <button
                type="button"
                onClick={() => router.push(`/teacher/class/${id}/settings`)}
                className="flex items-center gap-1.5 rounded-md border border-[#DADADA] bg-white px-3 py-1.5 text-[12.5px] font-semibold text-[#111111] transition-colors hover:bg-[#F7F7F7]"
              >
                <PencilLine className="h-3.5 w-3.5" />
                {hasClassInfo(info) ? "Edit in Course Settings" : "Add class information"}
              </button>
            }
            emptyMessage="Nothing here yet — describe the course and add the online link, class group and schedule so students know how the class runs."
          />
        </Reveal>
      )}
    </div>
  );
}
