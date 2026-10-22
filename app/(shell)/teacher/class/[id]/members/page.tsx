"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { MembersTable } from "@/components/shared/MembersTable";
import { Search, Check, X } from "lucide-react";
import { toast } from "sonner";
import { studentApi, type ClassMember, type JoinRequest } from "@/lib/student-api";
import { AUTH_ROLE_KEY } from "@/components/ui/nav-config";

export default function ClassMembersPage() {
  const params = useParams();
  const id = params.id as string;
  const [search, setSearch] = React.useState("");
  const [tab, setTab] = React.useState<"all" | "students" | "teachers">("all");
  const [members, setMembers] = React.useState<ClassMember[]>([]);
  const [pending, setPending] = React.useState<JoinRequest[]>([]);
  const [canReview, setCanReview] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [actingId, setActingId] = React.useState<string | null>(null);
  // Only a trainer may mark results; TAs and admins see the roster read-only.
  const role = React.useSyncExternalStore(
    () => () => {},
    () => (typeof window === "undefined" ? "" : (localStorage.getItem(AUTH_ROLE_KEY) ?? "")),
    () => "",
  );
  const isTrainer = role === "trainer";

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [m, p] = await Promise.all([
        studentApi.members(id),
        studentApi.pendingRequests(id).catch(() => null),
      ]);
      setMembers(m);
      setPending(p ?? []);
      setCanReview(p !== null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load members");
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function handleApprove(studentId: string) {
    setActingId(studentId);
    try {
      await studentApi.approveRequest(id, studentId);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Approve failed");
    } finally {
      setActingId(null);
    }
  }

  async function handleReject(studentId: string) {
    setActingId(studentId);
    try {
      await studentApi.rejectRequest(id, studentId);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reject failed");
    } finally {
      setActingId(null);
    }
  }

  async function handleSetResult(studentId: string, value: string) {
    setActingId(studentId);
    try {
      await studentApi.setResult(
        id,
        studentId,
        value === "" ? null : (value as "PASSED" | "FAILED"),
      );
      setMembers((prev) =>
        prev.map((m) => (m.id === studentId ? { ...m, result: value || null } : m)),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save the result");
    } finally {
      setActingId(null);
    }
  }

  const q = search.trim().toLowerCase();
  const filtered = members.filter((m) => {
    const matchesTab =
      tab === "all" ||
      (tab === "students" ? m.role !== "trainer" : m.role === "trainer");
    const matchesSearch =
      !q || [m.username, m.email, m.role].some((f) => f.toLowerCase().includes(q));
    return matchesTab && matchesSearch;
  });

  const toolbar = (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-1">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full mb-2">
        <div>
          <h2 className="text-xl font-bold text-[#111111]">Members</h2>
          <p className="text-[13px] text-[#5A5A5A] mt-0.5">Manage people and class access.</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 w-full">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md">
          {(["all", "students", "teachers"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1 text-[12px] font-medium rounded transition-all capitalize ${
                tab === t ? "bg-white text-[#111111] shadow-sm" : "text-[#5A5A5A] hover:text-[#111111]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1.5 h-4 w-4 text-[#5A5A5A]" />
          <input
            type="text"
            placeholder="Search members"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 bg-white border border-[#DADADA] rounded pl-8 pr-3 py-1.5 text-[12.5px] outline-none focus:border-[#111111]"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {canReview && (
        <div className="bg-white border border-[#DADADA] rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-[#DADADA] flex items-center justify-between">
            <h3 className="text-[14px] font-bold text-[#111111]">
              Join requests
              {pending.length > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-[#F7F7F7] text-[#5A5A5A] border border-[#DADADA] text-[11px] font-bold">
                  {pending.length} pending
                </span>
              )}
            </h3>
          </div>
          {pending.length === 0 ? (
            <p className="px-4 py-5 text-[13px] text-[#5A5A5A] text-center">No pending requests.</p>
          ) : (
            <table className="w-full text-left border-collapse">
              <tbody className="divide-y divide-[#DADADA]">
                {pending.map((r) => (
                  <tr key={r.id} className="hover:bg-[#FAFAFA]">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-[12px] font-bold text-[#5A5A5A] shrink-0">
                          {r.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-[13px] text-[#111111]">{r.username}</p>
                          <p className="text-[12px] text-[#5A5A5A]">{r.email} · {r.role.replace("_", " ")}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        disabled={actingId === r.student_id}
                        onClick={() => void handleApprove(r.student_id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#4B9E76] hover:bg-green-700 text-white rounded-md text-[12px] font-semibold mr-2 disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button
                        disabled={actingId === r.student_id}
                        onClick={() => void handleReject(r.student_id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 border border-[#DADADA] bg-white hover:bg-[#F7F7F7] hover:text-[#C4644C] rounded-md text-[12px] font-semibold disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5" /> Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {loading ? (
        <div className="bg-white border border-[#DADADA] rounded-lg p-8 text-center text-[#5A5A5A] text-[13px]">
          Loading members…
        </div>
      ) : error ? (
        <div className="bg-[#F7F7F7] border border-[#DFB2A6] rounded-lg p-6 text-center text-[13px]">
          <p className="text-[#9D4C38]">{error}</p>
          <button onClick={() => void load()} className="mt-2 text-[#111111] font-semibold hover:underline">
            Retry
          </button>
        </div>
      ) : (
        <MembersTable toolbar={toolbar}>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={4} className="py-8 px-4 text-center text-[13px] text-[#5A5A5A]">
                No members found.
              </td>
            </tr>
          ) : (
            filtered.map((m) => (
              <tr key={m.id} className="hover:bg-[#FAFAFA] transition-colors group">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[12px] font-bold text-slate-600 shrink-0">
                      {m.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-semibold text-[13px] text-[#111111]">{m.username}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-[#5A5A5A] text-[13px]">{m.email}</td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2.5 py-0.5 rounded text-[11px] font-semibold capitalize ${
                      m.role === "trainer"
                        ? "bg-[var(--brand-soft-strong)] text-[var(--brand-ink)]"
                        : m.role === "teaching_assistant" || m.role === "teaching assistant"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-slate-100 text-[#5A5A5A]"
                    }`}
                  >
                    {m.role.replace("_", " ")}
                  </span>
                </td>
                <td className="py-3 px-4 text-right text-[12px]">
                  {isTrainer && m.role !== "trainer" ? (
                    <select
                      value={m.result ?? ""}
                      onChange={(e) => void handleSetResult(m.id, e.target.value)}
                      disabled={actingId === m.id}
                      aria-label={`Result for ${m.username}`}
                      className={`rounded-md border px-2 py-1 text-[12px] outline-none focus:border-[#111111] disabled:opacity-50 ${
                        m.result === "PASSED"
                          ? "border-green-300 bg-green-50 text-green-800"
                          : m.result === "FAILED"
                            ? "border-red-300 bg-red-50 text-red-800"
                            : "border-[#DADADA] bg-white text-[#5A5A5A]"
                      }`}
                    >
                      <option value="">Not graded</option>
                      <option value="PASSED">Passed</option>
                      <option value="FAILED">Failed</option>
                    </select>
                  ) : m.result ? (
                    <span className="text-[#5A5A5A] capitalize">{m.result.toLowerCase()}</span>
                  ) : (
                    <span className="text-[#94a3b8]">—</span>
                  )}
                </td>
              </tr>
            ))
          )}
        </MembersTable>
      )}
    </div>
  );
}
