"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { ClassPageHeader } from "@/components/shared/ClassPageHeader";
import { MembersTable } from "@/components/shared/MembersTable";
import { Search, Check, X } from "lucide-react";
import { toast } from "sonner";
import { studentApi, type ClassMember, type JoinRequest } from "@/lib/student-api";
import { AppSelect } from "@/components/ui/app-select";
import { AUTH_ROLE_KEY } from "@/components/ui/nav-config";
import { Reveal, SkeletonLine } from "@/components/shared/page-skeleton";

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
      setError(null);
      const [m, p] = await Promise.all([
        studentApi.members(id),
        studentApi.pendingRequests(id).catch(() => null),
      ]);
      setMembers(m);
      setPending(p ?? []);
      setCanReview(p !== null);
      window.dispatchEvent(new Event("class-pending-changed"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load members");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const retry = () => {
    setLoading(true);
    void load();
  };

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-time fetch; load() only sets state after await.
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

  const headerActions = (
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
      <div className="flex items-center gap-1 rounded-md bg-white/70 p-1">
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
          className="w-full rounded border border-[var(--brand-line)] bg-white py-1.5 pl-8 pr-3 text-[12.5px] outline-none focus:border-[#111111] sm:w-64"
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <ClassPageHeader
        title="Members"
        subtitle="Manage people and class access."
        badge={
          !loading ? (
            <span className="inline-flex items-center rounded-full border border-[var(--brand-line)] bg-white/70 px-2 py-0.5 text-[11px] font-medium text-[var(--brand-ink)]">
              {members.length} {members.length === 1 ? "member" : "members"}
            </span>
          ) : undefined
        }
        actions={headerActions}
      />

      {canReview && (
        <Reveal>
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
        </Reveal>
      )}

      {loading ? (
          <MembersTable toolbar={null}>
          {[0, 1, 2, 3, 4].map((i) => (
            <tr key={i}>
              <td className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <SkeletonLine className="h-8 w-8 rounded-full" />
                  <SkeletonLine className="h-3.5 w-32" />
                </div>
              </td>
              <td className="py-3 px-4">
                <SkeletonLine className="h-3 w-48" />
              </td>
              <td className="py-3 px-4">
                <SkeletonLine className="h-4 w-16" />
              </td>
              <td className="py-3 px-4">
                <SkeletonLine className="ml-auto h-6 w-24" />
              </td>
            </tr>
          ))}
        </MembersTable>
      ) : error ? (
        <div className="bg-[#F7F7F7] border border-[#DFB2A6] rounded-lg p-6 text-center text-[13px]">
          <p className="text-[#9D4C38]">{error}</p>
          <button onClick={retry} className="mt-2 text-[#111111] font-semibold hover:underline">
            Retry
          </button>
        </div>
      ) : (
        <Reveal>
        <MembersTable toolbar={null}>
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
                          ? "bg-[var(--brand-soft)] text-[var(--brand-ink)]"
                          : "bg-[#F7F7F7] text-[#5A5A5A]"
                    }`}
                  >
                    {m.role.replace("_", " ")}
                  </span>
                </td>
                <td className="py-3 px-4 text-right text-[12px]">
                  {isTrainer && m.role !== "trainer" ? (
                    <AppSelect
                      value={m.result ?? ""}
                      onValueChange={(value) => void handleSetResult(m.id, value)}
                      disabled={actingId === m.id}
                      aria-label={`Result for ${m.username}`}
                      options={[
                        { value: "", label: "Not graded" },
                        { value: "PASSED", label: "Passed" },
                        { value: "FAILED", label: "Failed" },
                      ]}
                      size="xs"
                      triggerClassName={
                        m.result === "PASSED"
                          ? "border-green-300 bg-green-50 text-green-800"
                          : m.result === "FAILED"
                            ? "border-red-300 bg-red-50 text-red-800"
                            : "text-[#5A5A5A]"
                      }
                    />
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
        </Reveal>
      )}
    </div>
  );
}
