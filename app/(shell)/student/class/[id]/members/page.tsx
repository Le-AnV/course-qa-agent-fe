"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { useParams } from "next/navigation";
import { studentApi, type ClassMember } from "@/lib/student-api";
import { useProfile } from "@/features/profile/profile-context";
import { Reveal, SkeletonLine } from "@/components/shared/page-skeleton";

export default function StudentMembersPage() {
  const params = useParams();
  const id = params.id as string;
  const [search, setSearch] = React.useState("");
  const [members, setMembers] = React.useState<ClassMember[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const { profile } = useProfile();

  const load = React.useCallback(async () => {
    try {
      setError(null);
      setMembers(await studentApi.members(id));
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

  const q = search.trim().toLowerCase();
  const filteredMembers = q
    ? members.filter((m) =>
        [m.username, m.email, m.role].some((f) => f.toLowerCase().includes(q)),
      )
    : members;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h2 className="text-xl font-bold font-heading text-[#111111]">Class Members</h2>
          <p className="text-[13px] text-[#5A5A5A] mt-0.5">View your teachers and classmates.</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2 h-4 w-4 text-[#5A5A5A]" />
          <input
            type="text"
            placeholder="Search members"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-[#DADADA] rounded-[6px] pl-8 pr-3 py-1.5 text-[13px] outline-none focus:border-[#111111]"
          />
        </div>
      </div>

      {loading ? (
        <div className="bg-white border border-[#DADADA] rounded-lg overflow-hidden">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 border-b border-[#DADADA] px-4 py-3 last:border-b-0">
              <SkeletonLine className="h-8 w-8 rounded-full" />
              <SkeletonLine className="h-3.5 w-32" />
              <SkeletonLine className="ml-auto h-4 w-20" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-[#F7F7F7] border border-[#DFB2A6] rounded-lg p-6 text-center text-[13px]">
          <p className="text-[#9D4C38]">{error}</p>
          <button onClick={retry} className="mt-2 text-[#111111] font-semibold hover:underline">
            Retry
          </button>
        </div>
      ) : (
        <Reveal>
        <div className="bg-white border border-[#DADADA] rounded-lg overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-[#DADADA] text-[12px] font-medium text-[#6F6F6F]">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3 hidden sm:table-cell">Email</th>
                <th className="px-4 py-3">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DADADA]">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-[#5A5A5A] text-[13px]">
                    {q ? `Nothing matches "${search}".` : "No members yet."}
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => {
                  const isYou =
                    profile?.email?.toLowerCase() === member.email.toLowerCase();
                  const isTrainer = member.role === "trainer";
                  return (
                    <tr key={member.id} className="hover:bg-[#FAFAFA] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[12px] font-bold text-slate-600 shrink-0">
                            {member.username.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-[13.5px] font-semibold text-[#111111]">
                            {member.username} {isYou && "(You)"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-[13px] text-[#5A5A5A]">{member.email}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold capitalize ${
                          isTrainer
                            ? "bg-[var(--brand-soft)] text-[var(--brand-ink)] border border-[var(--brand-line)]"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}>
                          {member.role.replace("_", " ")}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        </Reveal>
      )}
    </div>
  );
}
