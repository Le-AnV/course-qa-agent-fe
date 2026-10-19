"use client";

import * as React from "react";
import { BookOpen, ChevronRight, Users, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/features/profile/profile-context";
import { studentApi, accentFor, type StudentClass } from "@/lib/student-api";

export default function StudentHomePage() {
  const router = useRouter();
  const { profile, loading: profileLoading } = useProfile();
  const [classes, setClasses] = React.useState<StudentClass[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      setError(null);
      setClasses(await studentApi.classes());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load your classes");
      setClasses([]);
    }
  }, []);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-time fetch; load() only sets state after await.
    void load();
  }, [load]);

  const greetingName = profile?.username ?? (profileLoading ? "…" : "there");

  return (
    <div className="mx-auto w-full max-w-[920px] space-y-8 bg-[#F5F5F5] px-6 pb-12 pt-8">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div>
          <h1 className="text-[28px] font-heading font-bold tracking-tight text-[#111111]">
            Welcome back, {greetingName}
          </h1>
          <p className="mt-1 text-[14px] text-[#5A5A5A]">Here is your workspace at a glance.</p>
        </div>
      </div>

      <div className="w-full">
        <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-50 px-6 py-4">
            <h2 className="text-[15px] font-heading font-bold text-[#111111]">Your Classes</h2>
            <button
              onClick={() => router.push("/student/classes")}
              className="text-[12.5px] font-semibold text-[#111111] hover:underline"
            >
              View all
            </button>
          </div>

          {classes === null ? (
            <p className="px-6 py-8 text-center text-[13px] text-[#5A5A5A]">Loading your classes…</p>
          ) : error ? (
            <div className="px-6 py-8 text-center text-[13px]">
              <p className="text-[#9D4C38]">{error}</p>
              <button onClick={() => void load()} className="mt-2 font-semibold text-[#111111] hover:underline">
                Retry
              </button>
            </div>
          ) : classes.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-[13.5px] font-semibold text-[#111111]">You&apos;re not enrolled in a class yet</p>
              <p className="mx-auto mt-1 max-w-sm text-[12.5px] text-[#5A5A5A]">
                Classes appear here once an admin or trainer adds you.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#F0F0F0]">
              {classes.map((cls) => (
                <div
                  key={cls.id}
                  onClick={() => router.push(`/student/class/${cls.id}/overview`)}
                  className="group flex cursor-pointer items-center gap-4 px-6 py-4 transition-colors hover:bg-[#FAFAFA]"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F7F7F7] text-[#111111]">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-[14px] font-bold text-[#111111]">{cls.name}</h3>
                    <p className="mt-0.5 truncate text-[12.5px] text-[#5A5A5A]">
                      {cls.code}
                      {cls.trainer_name ? ` · ${cls.trainer_name}` : ""}
                    </p>
                  </div>
                  <div className="hidden shrink-0 items-center gap-4 text-[12.5px] text-[#5A5A5A] sm:flex">
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" /> {cls.member_count}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5" /> {cls.document_count}
                    </span>
                  </div>
                  <span
                    className="hidden h-1.5 w-1.5 shrink-0 rounded-full sm:block"
                    style={{ backgroundColor: accentFor(cls.id) }}
                  />
                  <ChevronRight className="h-4 w-4 shrink-0 text-[#CFCFCF] transition-colors group-hover:text-[#111111]" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
