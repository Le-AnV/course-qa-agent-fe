"use client";

import * as React from "react";
import Link from "next/link";
import { Search, FileText, BotMessageSquare } from "lucide-react";
import { useParams } from "next/navigation";
import { studentApi, type ClassDocument } from "@/lib/student-api";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

export default function StudentClassSyllabusPage() {
  const params = useParams();
  const id = params.id as string;
  const [search, setSearch] = React.useState("");
  const [docs, setDocs] = React.useState<ClassDocument[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setDocs(await studentApi.documents(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load materials");
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const q = search.trim().toLowerCase();
  const filtered = q
    ? docs.filter((d) => d.file_name.toLowerCase().includes(q))
    : docs;

  return (
    <div className="max-w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-1">
        <div>
          <h2 className="text-xl font-bold font-heading text-[#172033]">Syllabus</h2>
          <p className="text-[13px] text-[#64748B] mt-0.5">Approved learning materials for this class.</p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-1.5 h-4 w-4 text-[#64748B]" />
            <input
              type="text"
              placeholder="Search materials"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-56 bg-slate-50 border border-[#E2E8F0] rounded pl-8 pr-3 py-1.5 text-[12.5px] outline-none focus:border-[#2563EB]"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-8 mt-4 text-center text-[#64748B] text-[13px]">
          Loading materials…
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-6 mt-4 text-center text-[13px]">
          <p className="text-rose-700">{error}</p>
          <button onClick={() => void load()} className="mt-2 text-[#2563EB] font-semibold hover:underline">
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-[13px] text-[#64748B] text-center py-8">
          {q ? `Không tìm thấy tài liệu nào khớp "${search.trim()}".` : "No approved materials yet — your trainer hasn't published any."}
        </p>
      ) : (
        <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden mt-4">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-[#E2E8F0] text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                <th className="px-4 py-3">File</th>
                <th className="px-4 py-3 hidden sm:table-cell">Type</th>
                <th className="px-4 py-3 hidden md:table-cell">Size</th>
                <th className="px-4 py-3 hidden md:table-cell">Added</th>
                <th className="px-4 py-3 w-28"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filtered.map((d) => (
                <tr key={d.id} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-rose-600 shrink-0" />
                      <span className="text-[13.5px] font-medium text-[#172033] truncate">{d.file_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="uppercase text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{d.file_type}</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-[12.5px] text-[#64748B]">{formatSize(d.size_bytes)}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-[12.5px] text-[#64748B]">{formatDate(d.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/student/class/${id}/agent`}
                      title={`Hỏi AI về ${d.file_name}`}
                      className="inline-flex items-center gap-1.5 rounded-md border border-[#BFDBFE] bg-[#EFF6FF] px-2.5 py-1.5 text-[11.5px] font-semibold text-[#2563EB] hover:bg-[#DBEAFE] transition-colors"
                    >
                      <BotMessageSquare className="w-3.5 h-3.5" />
                      Hỏi AI
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
