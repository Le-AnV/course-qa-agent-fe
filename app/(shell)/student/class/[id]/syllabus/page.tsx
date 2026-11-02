"use client";

import * as React from "react";
import Link from "next/link";
import { Search, BotMessageSquare } from "lucide-react";
import { useParams } from "next/navigation";
import { FileTypeIcon, fileTypeTone } from "@/components/shared/FileTypeIcon";
import { SyllabusRoadmap } from "@/components/shared/SyllabusTable";
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-time fetch; load() only sets state after await.
    void load();
  }, [load]);

  const q = search.trim().toLowerCase();
  const filtered = q
    ? docs.filter((d) => d.file_name.toLowerCase().includes(q))
    : docs;

  return (
    <div>
      <SyllabusRoadmap classId={id} />

      <section className="mt-8 space-y-3" aria-labelledby="student-materials-heading">
        <div className="rounded-lg border border-[#DADADA] bg-white px-4 py-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 id="student-materials-heading" className="text-[15px] font-bold text-[#111111]">
                Materials
              </h3>
              <p className="text-[13px] text-[#5A5A5A] mt-0.5">
                Approved learning materials for this class.
              </p>
            </div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="relative">
                <Search className="absolute left-2.5 top-1.5 h-4 w-4 text-[#5A5A5A]" />
                <input
                  type="text"
                  placeholder="Search materials"
                  aria-label="Search materials by file name"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-56 bg-white border border-[#DADADA] rounded pl-8 pr-3 py-1.5 text-[12.5px] outline-none focus:border-[#111111]"
                />
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-white border border-[#DADADA] rounded-lg p-8 text-center text-[#5A5A5A] text-[13px]">
            Loading materials…
          </div>
        ) : error ? (
          <div className="bg-[#F7F7F7] border border-[#DFB2A6] rounded-lg p-6 text-center text-[13px]">
            <p className="text-[#9D4C38]">{error}</p>
            <button onClick={() => void load()} className="mt-2 text-[#111111] font-semibold hover:underline">
              Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <p className="rounded-lg border border-[#DADADA] bg-white text-[13px] text-[#5A5A5A] text-center py-8">
            {q ? `No materials match "${search.trim()}".` : "No approved materials yet — your trainer hasn't published any."}
          </p>
        ) : (
          <div className="bg-white border border-[#DADADA] rounded-lg overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-[#DADADA] text-[12px] font-medium text-[#6F6F6F]">
                  <th className="px-4 py-3">File</th>
                  <th className="px-4 py-3 hidden sm:table-cell">Type</th>
                  <th className="px-4 py-3 hidden md:table-cell">Size</th>
                  <th className="px-4 py-3 hidden md:table-cell">Added</th>
                  <th className="px-4 py-3 w-28"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DADADA]">
                {filtered.map((d) => (
                  <tr key={d.id} className="hover:bg-[#FAFAFA] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border ${fileTypeTone(d.file_name)}`}
                        >
                          <FileTypeIcon fileName={d.file_name} className="h-5 w-5" />
                        </span>
                        <span className="text-[13.5px] font-medium text-[#111111] truncate">{d.file_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="uppercase text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--brand-soft)] text-[var(--brand-ink)]">{d.file_type}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-[12.5px] text-[#5A5A5A]">{formatSize(d.size_bytes)}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-[12.5px] text-[#5A5A5A]">{formatDate(d.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/student/class/${id}/agent`}
                        title={`Ask AI about ${d.file_name}`}
                        className="inline-flex items-center gap-1.5 rounded-md border border-[#CFCFCF] bg-[#F7F7F7] px-2.5 py-1.5 text-[11.5px] font-semibold text-[#111111] hover:bg-[#F0F0F0] transition-colors"
                      >
                        <BotMessageSquare className="w-3.5 h-3.5" />
                        Ask AI
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
