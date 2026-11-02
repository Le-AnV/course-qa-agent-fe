"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { studentApi, type ClassInfo, type StudentClass } from "@/lib/student-api";
import { ClassInfoCard, hasClassInfo } from "@/components/shared/ClassInfoCard";
import { ClassRecord } from "@/components/shared/ClassRecord";
import { peekClassDetail } from "@/lib/class-cache";
import { useIsomorphicLayoutEffect } from "@/hooks/use-isomorphic-layout-effect";
import { Reveal, SkeletonCard } from "@/components/shared/page-skeleton";

export default function StudentClassOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [cls, setCls] = React.useState<StudentClass | null>(null);
  const [info, setInfo] = React.useState<ClassInfo | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Warm cache seeded by the class layout: render the real name/counts on the
  // first frame instead of flashing a placeholder for one tick.
  useIsomorphicLayoutEffect(() => {
    const cached = peekClassDetail(id);
    if (cached) setCls((current) => current ?? cached);
  }, [id]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
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

  const cold = loading && !cls;

  if (cold) {
    return (
      <div className="space-y-6">
        <ClassRecord cls={null} role="student" />
        <SkeletonCard className="h-[180px]" />
      </div>
    );
  }

  if (error || !cls) {
    return (
      <div className="space-y-8">
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
    <Reveal className="space-y-6">
      <ClassRecord cls={cls} role="student" />
      {hasClassInfo(info) && <ClassInfoCard info={info} />}
    </Reveal>
  );
}
