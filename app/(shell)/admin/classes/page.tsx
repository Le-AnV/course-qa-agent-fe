"use client";

import * as React from "react";
import { Search, Plus } from "lucide-react";
import { adminApi, type ClassSection, type Course, type AdminUser } from "@/lib/admin-api";
import { ActionMenu } from "@/components/shared/ActionMenu";
import { AdminPageShell, ADMIN_CARD } from "@/components/shared/AdminPageShell";

export default function AdminClassesPage() {
  const [search, setSearch] = React.useState("");
  const [classes, setClasses] = React.useState<ClassSection[]>([]);
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [trainers, setTrainers] = React.useState<AdminUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [isCourseOpen, setIsCourseOpen] = React.useState(false);
  const [courseForm, setCourseForm] = React.useState({ code: "", title: "" });
  const [createForm, setCreateForm] = React.useState({
    course_id: "",
    code: "",
    name: "",
    semester: "Fall",
    academic_year: "2026",
    trainer_id: "",
  });
  const [creating, setCreating] = React.useState(false);
  const [creatingCourse, setCreatingCourse] = React.useState(false);

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
      setTrainers(usersData.filter((u) => (u.role === "trainer" || u.role === "admin") && u.is_active));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingCourse(true);
    try {
      await adminApi.createCourse(courseForm.code.trim(), courseForm.title.trim());
      setNotice(`Course ${courseForm.code} created.`);
      setIsCourseOpen(false);
      setCourseForm({ code: "", title: "" });
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create course");
    } finally {
      setCreatingCourse(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.course_id || !createForm.code) {
      alert("Course and class code are required");
      return;
    }
    if (!createForm.trainer_id) {
      alert("A trainer is required — create the trainer account first.");
      return;
    }
    setCreating(true);
    try {
      await adminApi.createClass(
        createForm.course_id,
        createForm.code.trim(),
        createForm.trainer_id,
        createForm.name || undefined,
        createForm.semester || undefined,
        createForm.academic_year || undefined,
      );
      setNotice(`Class ${createForm.code} created.`);
      setIsCreateOpen(false);
      setCreateForm({ course_id: "", code: "", name: "", semester: "Fall", academic_year: "2026", trainer_id: "" });
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create class");
    } finally {
      setCreating(false);
    }
  };

  const handleAssign = async (classId: string, trainerId: string) => {
    try {
      await adminApi.assignStaff(classId, trainerId || null);
      setNotice("Trainer reassigned.");
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to assign trainer");
    }
  };

  const handleDelete = async (classId: string) => {
    const target = classes.find((c) => String(c.id) === classId);
    const warn = target && (target.document_count > 0 || target.ticket_count > 0)
      ? ` This class still has ${target.document_count} document(s) and ${target.ticket_count} ticket(s).`
      : "";
    if (!confirm(`Delete this class?${warn} Members keep their accounts but are unlinked.`)) return;
    try {
      const result = await adminApi.deleteClass(classId);
      setNotice(`Deleted class. Removed ${result.member_count} members, ${result.document_count} documents, ${result.ticket_count} tickets.`);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete class");
    }
  };

  const filteredClasses = classes.filter((cls) =>
    cls.code.toLowerCase().includes(search.toLowerCase()) ||
    cls.course_code.toLowerCase().includes(search.toLowerCase()) ||
    (cls.trainer_name ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <AdminPageShell
      title="Classes"
      subtitle="A class always lives under a course with exactly one trainer (AC-01, AC-02)."
      actions={
        <>
          <button onClick={() => setIsCourseOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 border border-[#E2E8F0] bg-white hover:bg-slate-50 text-[#334155] rounded-[8px] text-[13px] font-semibold transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
            New Course
          </button>
          <button onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-[8px] text-[13px] font-semibold transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
            Create Class
          </button>
        </>
      }
    >
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 text-rose-700 text-[13px]">
          {error}
          <button onClick={() => void loadData()} className="ml-2 underline">Retry</button>
        </div>
      )}
      {notice && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-emerald-700 text-[13px]">{notice}</div>
      )}

      <div className={`${ADMIN_CARD} px-5 py-4`}>
        <h2 className="text-[14px] font-bold text-[#172033]">Courses ({courses.length})</h2>
        {courses.length === 0 ? (
          <p className="text-[13px] text-[#64748B] mt-1">No courses yet — create one first, a class cannot exist without it.</p>
        ) : (
          <div className="flex flex-wrap gap-2 mt-3">
            {courses.map((c) => (
              <span key={c.id} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-[#E2E8F0] text-[12.5px]">
                <span className="font-bold text-[#172033]">{c.code}</span>
                <span className="text-[#64748B]">{c.title}</span>
                <span className="text-[#94A3B8]">· {c.class_count} classes</span>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#64748B]" />
          <input
            type="text"
            placeholder="Search classes, course, trainer"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-[#E2E8F0] rounded-lg pl-9 pr-4 py-2 text-[13.5px] outline-none focus:border-[#2563EB] shadow-sm transition-shadow"
          />
        </div>
      </div>

      {loading ? (
        <div className={`${ADMIN_CARD} p-8 text-center text-[#64748B] text-[13px]`}>Loading classes...</div>
      ) : (
        <div className={`${ADMIN_CARD} overflow-hidden`}>
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
                  <td colSpan={7} className="px-5 py-8 text-center text-[#64748B] text-[13px]">No classes found</td>
                </tr>
              ) : (
                filteredClasses.map((cls, idx) => (
                  <tr key={cls.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-5 py-3.5"><span className="text-[13.5px] font-semibold text-[#172033]">{cls.code}</span></td>
                    <td className="px-5 py-3.5"><span className="text-[13px] text-[#334155]">{cls.course_code}</span></td>
                    <td className="px-5 py-3.5">
                      <select
                        value={cls.trainer_id ?? ""}
                        onChange={(e) => void handleAssign(String(cls.id), e.target.value)}
                        aria-label={`Trainer for ${cls.code}`}
                        className="max-w-[180px] bg-white border border-[#E2E8F0] rounded-md px-2 py-1 text-[12.5px] outline-none focus:border-[#2563EB]">
                        <option value="">Unassigned</option>
                        {trainers.map((t) => (
                          <option key={t.id} value={t.id}>{t.username}</option>
                        ))}
                      </select>
                      {!cls.trainer_id && <p className="text-[11px] text-amber-600 mt-1">Needs trainer</p>}
                    </td>
                    <td className="px-5 py-3.5"><span className="text-[13px]">{cls.student_count}</span></td>
                    <td className="px-5 py-3.5"><span className="text-[13px]">{cls.document_count}</span></td>
                    <td className="px-5 py-3.5"><span className="text-[13px]">{cls.ticket_count}</span></td>
                    <td className="px-5 py-3.5 text-center relative">
                      <ActionMenu
                        label={`Actions for class ${cls.code}`}
                        direction={idx === filteredClasses.length - 1 ? "up" : "down"}
                        items={[{ label: "Delete class", danger: true, onSelect: () => void handleDelete(String(cls.id)) }]}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {isCourseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-[440px] p-6">
            <h2 className="text-[18px] font-bold text-[#172033] mb-4">New Course</h2>
            <form onSubmit={(e) => void handleCreateCourse(e)} className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-[#334155] mb-1.5">Code *</label>
                <input required value={courseForm.code} onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })}
                  placeholder="SE101" className="w-full bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#2563EB]" />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#334155] mb-1.5">Title *</label>
                <input required value={courseForm.title} onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                  placeholder="Intro to Software Engineering" className="w-full bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#2563EB]" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
                <button type="button" onClick={() => setIsCourseOpen(false)}
                  className="px-4 py-2 text-[13px] font-semibold text-[#334155] bg-white border border-[#E2E8F0] rounded-md hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={creatingCourse}
                  className="px-4 py-2 text-[13px] font-semibold text-white bg-[#2563EB] rounded-md hover:bg-blue-700 disabled:opacity-50">
                  {creatingCourse ? "Creating…" : "Create course"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-[480px] p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-[18px] font-bold text-[#172033] mb-4">Create New Class</h2>
            <form onSubmit={(e) => void handleCreate(e)} className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-[#334155] mb-1.5">Course *</label>
                <select value={createForm.course_id} onChange={(e) => setCreateForm({ ...createForm, course_id: e.target.value })}
                  className="w-full bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#2563EB]" required>
                  <option value="">Select course</option>
                  {courses.map((c) => (<option key={c.id} value={c.id}>{c.code} — {c.title}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#334155] mb-1.5">Class Code *</label>
                <input type="text" value={createForm.code} onChange={(e) => setCreateForm({ ...createForm, code: e.target.value })}
                  placeholder="e.g., CS101-FA26-001"
                  className="w-full bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#2563EB]" required />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#334155] mb-1.5">Trainer * <span className="font-normal text-[#64748B]">(required)</span></label>
                <select value={createForm.trainer_id} onChange={(e) => setCreateForm({ ...createForm, trainer_id: e.target.value })}
                  className="w-full bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#2563EB]" required>
                  <option value="">Select trainer</option>
                  {trainers.map((t) => (<option key={t.id} value={t.id}>{t.username} ({t.email})</option>))}
                </select>
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#334155] mb-1.5">Class Name</label>
                <input type="text" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="e.g., Introduction to AI - Section 1"
                  className="w-full bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#2563EB]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-medium text-[#334155] mb-1.5">Semester</label>
                  <select value={createForm.semester} onChange={(e) => setCreateForm({ ...createForm, semester: e.target.value })}
                    className="w-full bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#2563EB]">
                    <option value="Fall">Fall</option>
                    <option value="Spring">Spring</option>
                    <option value="Summer">Summer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#334155] mb-1.5">Academic Year</label>
                  <input type="text" value={createForm.academic_year} onChange={(e) => setCreateForm({ ...createForm, academic_year: e.target.value })}
                    className="w-full bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#2563EB]" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
                <button type="button" onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-[13px] font-semibold text-[#334155] bg-white border border-[#E2E8F0] rounded-md hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={creating}
                  className="px-4 py-2 text-[13px] font-semibold text-white bg-[#2563EB] rounded-md hover:bg-blue-700 disabled:opacity-50">
                  {creating ? "Creating..." : "Create Class"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminPageShell>
  );
}
