"use client";

import * as React from "react";
import { Search, Users, BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { studentApi, accentFor, termFor, type StudentClass, type CatalogClass } from "@/lib/student-api";

export default function StudentClassesPage() {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [classes, setClasses] = React.useState<StudentClass[]>([]);
  const [catalog, setCatalog] = React.useState<CatalogClass[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [actingId, setActingId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [mine, all] = await Promise.all([studentApi.classes(), studentApi.catalog()]);
      setClasses(mine);
      setCatalog(all);
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

  async function handleRequest(id: string) {
    setActingId(id);
    try {
      await studentApi.requestJoin(id);
      const [mine, all] = await Promise.all([studentApi.classes(), studentApi.catalog()]);
      setClasses(mine);
      setCatalog(all);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Request failed");
    } finally {
      setActingId(null);
    }
  }

  async function handleCancel(id: string) {
    setActingId(id);
    try {
      await studentApi.cancelRequest(id);
      const [mine, all] = await Promise.all([studentApi.classes(), studentApi.catalog()]);
      setClasses(mine);
      setCatalog(all);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Cancel failed");
    } finally {
      setActingId(null);
    }
  }

  const q = search.trim().toLowerCase();
  const filtered = q
    ? classes.filter((c) =>
        [c.name, c.code].some((f) =>
          f.toLowerCase().includes(q),
        ),
      )
    : classes;

  const renderClassCard = (cls: StudentClass) => (
    <div key={cls.id} className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all hover:-translate-y-0.5 flex flex-col overflow-hidden group cursor-pointer" onClick={() => router.push(`/student/class/${cls.id}/overview`)}>
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
            router.push(`/student/class/${cls.id}/overview`);
          }}
          className="w-full py-2.5 bg-[#FFFFFF] group-hover:bg-[#F7F7F7] group-hover:text-[#111111] group-hover:border-[var(--brand)] text-[#111111] rounded-lg text-[13px] font-semibold transition-colors border border-slate-100 flex items-center justify-center gap-2"
        >
          Go to class &rarr;
        </button>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-[920px] mx-auto px-6 pt-8 pb-12 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-[28px] font-bold text-[#111111] font-heading tracking-tight">My Classes</h1>
          <p className="text-[14px] text-[#5A5A5A] mt-1">Manage and access your enrolled courses.</p>
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
          {q ? `Nothing matches "${search}".` : "You are not enrolled in any class yet — browse below and request to join."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          {filtered.map(renderClassCard)}
        </div>
      )}

      {/* Browse the catalog: request to join, a TA approves */}
      <div className="space-y-4 pt-4">
        <div>
          <h2 className="text-[18px] font-bold font-heading text-[#111111]">Browse classes</h2>
          <p className="text-[13px] text-[#5A5A5A] mt-0.5">Request to join a class — a teaching assistant reviews your request.</p>
        </div>
        <div className="bg-white border border-[#DADADA] rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-[#DADADA] text-[12px] font-medium text-[#6F6F6F]">
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3 hidden sm:table-cell">Trainer</th>
                <th className="px-4 py-3 hidden md:table-cell">Members</th>
                <th className="px-4 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DADADA]">
              {catalog.map((c) => (
                <tr key={c.id} className="hover:bg-[#FAFAFA]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: accentFor(c.id) }} />
                      <div>
                        <p className="text-[13.5px] font-semibold text-[#111111]">{c.code} — {c.name}</p>
                        <p className="text-[12px] text-[#94a3b8]">{termFor(c)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-[13px] text-[#5A5A5A]">{c.trainer_name ?? "—"}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-[13px] text-[#5A5A5A]">{c.member_count}</td>
                  <td className="px-4 py-3 text-right">
                    {c.my_status === "active" ? (
                      <button
                        onClick={() => router.push(`/student/class/${c.id}/overview`)}
                        className="px-3 py-1.5 text-[12px] font-semibold text-[#111111] hover:underline"
                      >
                        Open
                      </button>
                    ) : c.my_status === "pending" ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-white text-[#8F6B16] border border-[#ECDCB8] whitespace-nowrap">Pending approval</span>
                        <button
                          disabled={actingId === c.id}
                          onClick={() => void handleCancel(c.id)}
                          className="px-2.5 py-1 text-[11.5px] font-semibold text-[#5A5A5A] hover:text-[#C4644C] disabled:opacity-50 whitespace-nowrap"
                        >
                          Cancel
                        </button>
                      </span>
                    ) : (
                      <button
                        disabled={actingId === c.id}
                        onClick={() => void handleRequest(c.id)}
                        className="px-3.5 py-1.5 border border-[#CFCFCF] bg-white text-[#111111] shadow-xs hover:bg-[#F7F7F7] rounded-md text-[12px] font-semibold transition-colors disabled:opacity-50"
                      >
                        {actingId === c.id ? "Sending…" : "Request to join"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
