"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { useParams } from "next/navigation";
import { studentApi, type ClassMember } from "@/lib/student-api";
import { useProfile } from "@/features/profile/profile-context";

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
      setLoading(true);
      setError(null);
      setMembers(await studentApi.members(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load members");
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const q = search.trim().toLowerCase();
  const filteredMembers = q
    ? members.filter((m) =>
        [m.username, m.email, m.role].some((f) => f.toLowerCase().includes(q)),
      )
    : members;

  return (
    <div className="max-w-[920px] space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h2 className="text-xl font-bold font-heading text-[#172033]">Class Members</h2>
          <p className="text-[13px] text-[#64748B] mt-0.5">View your teachers and classmates.</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2 h-4 w-4 text-[#64748B]" />
          <input
            type="text"
            placeholder="Search members"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-[#E2E8F0] rounded-[6px] pl-8 pr-3 py-1.5 text-[13px] outline-none focus:border-[#2563EB]"
          />
        </div>
      </div>

      {loading ? (
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-8 text-center text-[#64748B] text-[13px]">
          Loading members…
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-6 text-center text-[13px]">
          <p className="text-rose-700">{error}</p>
          <button onClick={() => void load()} className="mt-2 text-[#2563EB] font-semibold hover:underline">
            Retry
          </button>
        </div>
      ) : (
        <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-[#E2E8F0] text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3 hidden sm:table-cell">Email</th>
                <th className="px-4 py-3">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-[#64748B] text-[13px]">
                    {q ? `Nothing matches "${search}".` : "No members yet."}
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => {
                  const isYou =
                    profile?.email?.toLowerCase() === member.email.toLowerCase();
                  const isTrainer = member.role === "trainer";
                  return (
                    <tr key={member.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[12px] font-bold text-slate-600 shrink-0">
                            {member.username.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-[13.5px] font-semibold text-[#172033]">
                            {member.username} {isYou && "(You)"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-[13px] text-[#64748B]">{member.email}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold capitalize ${
                          isTrainer
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
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
      )}
    </div>
  );
}
