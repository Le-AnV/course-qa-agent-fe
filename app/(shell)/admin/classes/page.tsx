"use client";

import * as React from "react";
import { Search, MoreVertical, Trash2, Plus } from "lucide-react";
import { adminApi, type ClassSection, type Course, type AdminUser } from "@/lib/admin-api";

export default function AdminClassesPage() {
  const [search, setSearch] = React.useState("");
  const [classes, setClasses] = React.useState<ClassSection[]>([]);
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [trainers, setTrainers] = React.useState<AdminUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [createForm, setCreateForm] = React.useState({
    course_id: "",
    code: "",
    name: "",
    semester: "Fall",
    academic_year: "2026",
    trainer_id: "",
  });
  const [creating, setCreating] = React.useState(false);

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [classesData, coursesData, usersData] = await Promise.all([
        adminApi.classes(),
        adminApi.courses(),
        adminApi.users(),
      ]);
      setClasses(classesData);
      setCourses(coursesData);
      setTrainers(usersData.filter((u) => u.role === "trainer" && u.is_active));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void (async () => {
      await loadData();
    })();
  }, [loadData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.course_id || !createForm.code) {
      alert("Course and class code are required");
      return;
    }
    setCreating(true);
    try {
      await adminApi.createClass(
        createForm.course_id,
        createForm.code,
        createForm.name || undefined,
        createForm.semester || undefined,
        createForm.academic_year || undefined,
        createForm.trainer_id || undefined
      );
      setIsCreateOpen(false);
      setCreateForm({ course_id: "", code: "", name: "", semester: "Fall", academic_year: "2026", trainer_id: "" });
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create class");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (classId: string) => {
    if (!confirm("Delete this class? This will also remove all enrollments and tickets.")) return;
    try {
      const result = await adminApi.deleteClass(classId);
      alert(`Deleted class. Removed ${result.member_count} members, ${result.document_count} documents, ${result.ticket_count} tickets.`);
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete class");
    }
  };

  const filteredClasses = classes.filter((cls) => {
    return cls.code.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="max-w-[960px] mx-auto pb-12 space-y-6 bg-[#F8FAFC]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-[28px] font-bold text-[#172033] font-[family-name:var(--font-lora)] tracking-tight">Classes</h1>
          <p className="text-[14px] text-[#64748B] mt-1">Oversight of all active courses.</p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-[8px] text-[13px] font-semibold transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Create Class
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 text-rose-700 text-[13px]">
          {error}
          <button onClick={loadData} className="ml-2 underline">Retry</button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#64748B]" />
          <input
            type="text"
            placeholder="Search classes"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-[#E2E8F0] rounded-lg pl-9 pr-4 py-2 text-[13.5px] outline-none focus:border-[#2563EB] shadow-sm transition-shadow"
          />
        </div>
      </div>

      {loading ? (
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-8 text-center text-[#64748B] text-[13px]">Loading classes...</div>
      ) : (
        <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-[#E2E8F0] text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                <th className="px-5 py-3">Code</th>
                <th className="px-5 py-3">Course</th>
                <th className="px-5 py-3">Trainer</th>
                <th className="px-5 py-3">Students</th>
                <th className="px-5 py-3">Docs</th>
                <th className="px-5 py-3">Tickets</th>
                <th className="px-5 py-3 w-12 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredClasses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-[#64748B] text-[13px]">
                    No classes found
                  </td>
                </tr>
              ) : (
                filteredClasses.map((cls) => (
                  <tr key={cls.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="text-[13.5px] font-semibold text-[#172033]">{cls.code}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-[13px] text-[#334155]">{cls.course_code}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-[13px] text-[#334155]">{cls.trainer_name || "—"}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-[13px] text-[#334155]">{cls.student_count}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-[13px] text-[#334155]">{cls.document_count}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-[13px] text-[#334155]">{cls.ticket_count}</span>
                    </td>
                    <td className="px-5 py-3.5 text-center relative group">
                      <button className="p-1.5 text-slate-400 hover:text-[#172033] hover:bg-slate-100 rounded-md transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      <div className="absolute right-6 top-full mt-1 w-40 bg-white border border-[#E2E8F0] rounded-md shadow-lg z-50 py-1 hidden group-hover:block">
                        <button
                          onClick={() => handleDelete(String(cls.id))}
                          className="w-full text-left px-4 py-2 text-[12.5px] text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete class
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Class Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-[480px] p-6">
            <h2 className="text-[18px] font-bold text-[#172033] mb-4">Create New Class</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-[#334155] mb-1.5">Course *</label>
                <select
                  value={createForm.course_id}
                  onChange={(e) => setCreateForm({ ...createForm, course_id: e.target.value })}
                  className="w-full bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#2563EB]"
                  required
                >
                  <option value="">Select course</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.code} — {c.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#334155] mb-1.5">Class Code *</label>
                <input
                  type="text"
                  value={createForm.code}
                  onChange={(e) => setCreateForm({ ...createForm, code: e.target.value })}
                  placeholder="e.g., CS101-FA26-001"
                  className="w-full bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#2563EB]"
                  required
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#334155] mb-1.5">Class Name</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="e.g., Introduction to AI - Section 1"
                  className="w-full bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#2563EB]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-medium text-[#334155] mb-1.5">Semester</label>
                  <select
                    value={createForm.semester}
                    onChange={(e) => setCreateForm({ ...createForm, semester: e.target.value })}
                    className="w-full bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#2563EB]"
                  >
                    <option value="Fall">Fall</option>
                    <option value="Spring">Spring</option>
                    <option value="Summer">Summer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#334155] mb-1.5">Academic Year</label>
                  <input
                    type="text"
                    value={createForm.academic_year}
                    onChange={(e) => setCreateForm({ ...createForm, academic_year: e.target.value })}
                    className="w-full bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#2563EB]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#334155] mb-1.5">Trainer</label>
                <select
                  value={createForm.trainer_id}
                  onChange={(e) => setCreateForm({ ...createForm, trainer_id: e.target.value })}
                  className="w-full bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#2563EB]"
                >
                  <option value="">Select trainer (optional)</option>
                  {trainers.map((t) => (
                    <option key={t.id} value={t.id}>{t.username} ({t.email})</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-[13px] font-semibold text-[#334155] bg-white border border-[#E2E8F0] rounded-md hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 text-[13px] font-semibold text-white bg-[#2563EB] rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create Class"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
