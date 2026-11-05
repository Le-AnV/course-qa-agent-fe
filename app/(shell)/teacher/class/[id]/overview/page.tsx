"use client";

import * as React from "react";
import { PencilLine } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { studentApi, type ClassInfo, type StudentClass } from "@/lib/student-api";
import { ClassInfoCard, hasClassInfo } from "@/components/shared/ClassInfoCard";
import { ClassRecord } from "@/components/shared/ClassRecord";
import { peekClassDetail } from "@/lib/class-cache";
import { useIsomorphicLayoutEffect } from "@/hooks/use-isomorphic-layout-effect";
import { Reveal, SkeletonCard } from "@/components/shared/page-skeleton";

export default function TeacherClassOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [cls, setCls] = React.useState<StudentClass | null>(null);
  const [info, setInfo] = React.useState<ClassInfo | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // The class layout already wrote this record to the warm cache before paint,
  // so seed it here: the class record then renders with real data on the first
  // frame instead of flashing a placeholder and swapping it out.
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

  // Cold load (no cached record): one skeleton per real block, same footprint.
  const cold = loading && !cls;

  if (cold) {
    return (
      <div className="space-y-6">
        <ClassRecord cls={null} role="teacher" />
        <SkeletonCard className="h-[180px]" />
      </div>
    );
  }

  if (error || !cls) {
    return (
      <div className="space-y-8">
        <div className="bg-white border border-[#CFCFCF] rounded-xl p-6 text-center text-[13px]">
          <p className="text-[#9D4C38]">{error ?? "Class not found."}</p>
          <button onClick={retry} className="mt-2 text-[#111111] font-semibold hover:underline">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <Reveal className="space-y-6">
      <ClassRecord cls={cls} role="teacher" />
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
  );
}
