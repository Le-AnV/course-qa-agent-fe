"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, ChevronRight, Users } from "lucide-react";
import { studentApi, accentFor, termFor, type StudentClass } from "@/lib/student-api";
import { useProfile } from "@/features/profile/profile-context";

export default function TeacherHomePage() {
  const router = useRouter();
  const { profile } = useProfile();
  const [classes, setClasses] = React.useState<StudentClass[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setClasses(await studentApi.classes());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load classes");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-time fetch; load() only sets state after await.
    void load();
  }, [load]);

  const name = profile?.username?.trim();

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 pb-16 pt-8 px-6">
      <div>
        <h1 className="text-[28px] font-heading font-bold text-[#111111] tracking-tight">
          {name ? `Welcome back, ${name}` : "Welcome back"}
        </h1>
        <p className="text-[14px] text-[#5A5A5A] mt-1">Here are the classes you teach.</p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[17px] font-heading font-bold text-[#111111]">Classes you manage</h2>
          {!loading && !error && classes.length > 0 && (
            <Link href="/teacher/classes" className="text-[13px] font-semibold text-[#111111] hover:underline flex items-center gap-1">
              View all classes ({classes.length}) <ChevronRight className="w-3 h-3" />
            </Link>
          )}
        </div>

        {loading ? (
          <div className="bg-white border border-[#DADADA] rounded-xl p-8 text-center text-[#5A5A5A] text-[13px]">
            Loading your classes...
          </div>
        ) : error ? (
          <div className="bg-white border border-[#CFCFCF] rounded-xl p-6 text-center text-[13px]">
            <p className="text-[#9D4C38]">{error}</p>
            <button onClick={() => void load()} className="mt-2 text-[#111111] font-semibold hover:underline">
              Retry
            </button>
          </div>
        ) : classes.length === 0 ? (
          <div className="bg-white border border-[#DADADA] rounded-xl p-8 text-center text-[#5A5A5A] text-[13px]">
            No classes assigned to you yet. An administrator assigns classes to trainers.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {classes.map((cls) => (
              <div
                key={cls.id}
                className="bg-white rounded-xl shadow-sm border border-[#DADADA] hover:shadow-md transition-shadow flex flex-col overflow-hidden cursor-pointer"
                onClick={() => router.push(`/teacher/class/${cls.id}/overview`)}
              >
                <div className="h-1.5 w-full" style={{ backgroundColor: accentFor(cls.id) }} />
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center justify-between text-[10px] font-medium text-[#6F6F6F] mb-3">
                    <span>{cls.code}</span>
                    <span>{termFor(cls)}</span>
                  </div>
                  <h3 className="text-[15px] font-heading font-semibold text-[#111111] leading-snug mb-1.5">{cls.name}</h3>
                  <p className="text-[13px] text-[#5A5A5A] mb-6">{cls.credits} credits</p>

                  <div className="flex items-center gap-4 text-[12px] text-[#5A5A5A] font-medium mt-auto mb-5">
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-[#6F6F6F]" />
                      <span>{cls.document_count} resources</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#6F6F6F]" />
                      <span>{cls.member_count}</span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/teacher/class/${cls.id}/overview`);
                    }}
                    className="w-full py-2 bg-white hover:bg-[#F7F7F7] text-[#111111] rounded-lg text-[13px] font-semibold transition-colors border border-[#DADADA]"
                  >
                    Manage class
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
