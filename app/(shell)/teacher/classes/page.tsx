"use client";

import * as React from "react";
import { Search, Users, BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import { studentApi, accentFor, termFor, type StudentClass } from "@/lib/student-api";
import { PageContainer } from "@/components/shared/PageShell";

export default function TeacherClassesPage() {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-time fetch; load() only sets state after await, never synchronously.
    void load();
  }, [load]);

  const q = search.trim().toLowerCase();
  const filtered = q
    ? classes.filter((c) =>
        [c.name, c.code].some((f) =>
          f.toLowerCase().includes(q),
        ),
      )
    : classes;

  const renderClassCard = (cls: StudentClass) => (
    <div key={cls.id} className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all hover:-translate-y-0.5 flex flex-col overflow-hidden group cursor-pointer" onClick={() => router.push(`/teacher/class/${cls.id}/overview`)}>
      <div className="h-2 w-full" style={{ backgroundColor: accentFor(cls.id) }} />
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-center justify-between text-[11px] font-bold text-[#94a3b8]  mb-3">
          <span className="text-[#111111] bg-slate-100 px-2 py-0.5 rounded">{cls.code}</span>
          <span>{termFor(cls)}</span>
        </div>
        <h3 className="text-[16px] font-heading font-bold text-[#111111] leading-snug mb-1.5 group-hover:text-[#111111] transition-colors">{cls.name}</h3>
        <p className="text-[13px] text-[#5A5A5A] mb-1">{cls.credits} credits</p>
        <p className="text-[12px] text-[#94a3b8] mb-6">Trainer: {cls.trainer_name ?? "—"}</p>

        <div className="flex items-center gap-4 text-[12.5px] text-[#5A5A5A] font-medium mt-auto mb-5">
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            <span>{cls.document_count} resources</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            <span>{cls.member_count}</span>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/teacher/class/${cls.id}/members`);
          }}
          className="w-full py-2.5 bg-[#FFFFFF] group-hover:bg-[#F7F7F7] group-hover:text-[#111111] group-hover:border-[var(--brand)] text-[#111111] rounded-lg text-[13px] font-semibold transition-colors border border-slate-100 flex items-center justify-center gap-2"
        >
          Manage class &rarr;
        </button>
      </div>
    </div>
  );

  return (
    <PageContainer className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-[28px] font-bold text-[#111111] font-heading tracking-tight">My Classes</h1>
          <p className="text-[14px] text-[#5A5A5A] mt-1">Your assigned classes — open one to review join requests.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#5A5A5A]" />
          <input
            type="text"
            placeholder="Search classes"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-[#DADADA] rounded-lg pl-9 pr-4 py-2 text-[13.5px] outline-none focus:border-[#111111] shadow-sm transition-shadow"
          />
        </div>
      </div>

      {loading ? (
        <div className="bg-white border border-[#DADADA] rounded-xl p-8 text-center text-[#5A5A5A] text-[13px]">
          Loading your classes…
        </div>
      ) : error ? (
        <div className="bg-white border border-[#CFCFCF] rounded-xl p-6 text-center text-[13px]">
          <p className="text-[#9D4C38]">{error}</p>
          <button onClick={() => void load()} className="mt-2 text-[#111111] font-semibold hover:underline">
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-[#DADADA] rounded-xl p-8 text-center text-[#5A5A5A] text-[13px]">
          {q ? `Nothing matches "${search}".` : "No classes assigned to you yet."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          {filtered.map(renderClassCard)}
        </div>
      )}
    </PageContainer>
  );
}
