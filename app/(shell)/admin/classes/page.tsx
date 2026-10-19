"use client";

import * as React from "react";
import { Search, Plus, X, Users } from "lucide-react";
import { toast } from "sonner";
import { adminApi, type ClassSection, type AdminUser } from "@/lib/admin-api";
import { ActionMenu } from "@/components/shared/ActionMenu";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Modal } from "@/components/shared/Modal";
import { AdminPageShell, ADMIN_CARD } from "@/components/shared/AdminPageShell";

export default function AdminClassesPage() {
  const [search, setSearch] = React.useState("");
  const [classes, setClasses] = React.useState<ClassSection[]>([]);
  const [trainers, setTrainers] = React.useState<AdminUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [createForm, setCreateForm] = React.useState({
    code: "",
    name: "",
    semester: "Fall",
    academic_year: "2026",
    trainer_id: "",
    credits: "3",
  });
  const [creating, setCreating] = React.useState(false);
  const [pendingDelete, setPendingDelete] = React.useState<ClassSection | null>(null);
  const [pendingArchive, setPendingArchive] = React.useState<ClassSection | null>(null);
  // Extra trainers chosen while creating (applied right after the class exists).
  const [extraTrainers, setExtraTrainers] = React.useState<string[]>([]);
  // Co-trainer management for an existing class.
  const [manageClass, setManageClass] = React.useState<ClassSection | null>(null);
  const [newCoTrainer, setNewCoTrainer] = React.useState("");
  const [manageBusy, setManageBusy] = React.useState(false);

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [classesData, usersData] = await Promise.all([
        adminApi.classes(),
        adminApi.users(),
      ]);
      setClasses(classesData);
      setTrainers(usersData.filter((u) => (u.role === "trainer" || u.role === "admin") && u.is_active));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-time fetch; loadData() only sets state after await, never synchronously.
    void loadData();
  }, [loadData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.code) {
      toast.error("Class code is required");
      return;
    }
    if (!createForm.trainer_id) {
      toast.error("A trainer is required — create the trainer account first.");
      return;
    }
    setCreating(true);
    try {
      const created = await adminApi.createClass({
        code: createForm.code.trim(),
        trainer_id: createForm.trainer_id,
        name: createForm.name || undefined,
        semester: createForm.semester || undefined,
        academic_year: createForm.academic_year || undefined,
        credits: Number(createForm.credits) || undefined,
      });
      let extraFailed = 0;
      for (const trainerId of extraTrainers) {
        try {
          await adminApi.addTrainer(String(created.id), trainerId);
        } catch {
          extraFailed += 1;
        }
      }
      setNotice(
        extraFailed === 0
          ? `Class ${createForm.code} created.`
          : `Class ${createForm.code} created, but ${extraFailed} co-trainer(s) could not be added — open Manage trainers.`,
      );
      setIsCreateOpen(false);
      setCreateForm({ code: "", name: "", semester: "Fall", academic_year: "2026", trainer_id: "", credits: "3" });
      setExtraTrainers([]);
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create class");
    } finally {
      setCreating(false);
    }
  };

  const handleAssign = async (classId: string, trainerId: string) => {
    try {
      await adminApi.assignStaff(classId, trainerId || null);
      setNotice("Primary trainer updated.");
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to assign trainer");
    }
  };

  const isArchived = (cls: ClassSection) => (cls.status ?? "ACTIVE") === "ARCHIVED";

  const classTrainers = (cls: ClassSection) =>
    cls.trainers && cls.trainers.length > 0
      ? cls.trainers
      : cls.trainer_id
        ? [{ trainer_id: cls.trainer_id, name: cls.trainer_name, email: null, is_primary: true }]
        : [];

  const handleAddCoTrainer = async () => {
    if (!manageClass || !newCoTrainer) return;
    setManageBusy(true);
    try {
      const updated = await adminApi.addTrainer(String(manageClass.id), newCoTrainer);
      setManageClass(updated);
      setNewCoTrainer("");
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add co-trainer");
    } finally {
      setManageBusy(false);
    }
  };

  const handleRemoveCoTrainer = async (trainerId: string) => {
    if (!manageClass) return;
    setManageBusy(true);
    try {
      const updated = await adminApi.removeTrainer(String(manageClass.id), trainerId);
      setManageClass(updated);
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove co-trainer");
    } finally {
      setManageBusy(false);
    }
  };

  const runDelete = async () => {
    if (!pendingDelete) return;
    try {
      const result = await adminApi.deleteClass(String(pendingDelete.id));
      setNotice(`Deleted class ${pendingDelete.code}. Removed ${result.member_count} members, ${result.document_count} documents, ${result.ticket_count} tickets.`);
      setPendingDelete(null);
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete class");
    }
  };

  const runArchiveToggle = async () => {
    if (!pendingArchive) return;
    const archiving = !isArchived(pendingArchive);
    try {
      await adminApi.setClassStatus(String(pendingArchive.id), archiving ? "ARCHIVED" : "ACTIVE");
      setNotice(
        archiving
          ? `Archived ${pendingArchive.code}. Teachers and students no longer see it; nothing was deleted.`
          : `Restored ${pendingArchive.code}. It is visible to its members again.`,
      );
      setPendingArchive(null);
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to change class status");
    }
  };

  const filteredClasses = classes.filter((cls) =>
    cls.code.toLowerCase().includes(search.toLowerCase()) ||
    (cls.trainer_name ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <AdminPageShell
      title="Classes"
      subtitle="Each class is a subject with a primary trainer, plus any co-trainers who share the teaching."
      actions={
        <button onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 border border-[#CFCFCF] bg-white text-[#111111] shadow-xs hover:bg-[#F7F7F7] rounded-[8px] text-[13px] font-semibold transition-colors shadow-sm">
          <Plus className="w-4 h-4" />
          Create Class
        </button>
      }
    >
      {error && (
        <div className="bg-white border border-[#DFB2A6] rounded-xl p-4 text-[#9D4C38] text-[13px]">
          {error}
          <button onClick={() => void loadData()} className="ml-2 underline">Retry</button>
        </div>
      )}
      {notice && (
        <div className="flex items-start gap-2.5 bg-white border border-[#DADADA] rounded-xl p-4 text-[13px] text-[#111111]">
          <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-[#4B9E76] shrink-0" />
          <p className="flex-1">{notice}</p>
          <button
            type="button"
            onClick={() => setNotice(null)}
            aria-label="Dismiss notification"
            className="p-0.5 text-[#6F6F6F] hover:text-[#111111] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#5A5A5A]" />
          <input
            type="text"
            placeholder="Search classes, trainer"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-[#DADADA] rounded-lg pl-9 pr-4 py-2 text-[13.5px] outline-none focus:border-[#111111] shadow-sm transition-shadow"
          />
        </div>
      </div>

      {loading ? (
        <div className={`${ADMIN_CARD} p-8 text-center text-[#5A5A5A] text-[13px]`}>Loading classes...</div>
      ) : (
        <div className={`${ADMIN_CARD} overflow-hidden`}>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-[#DADADA] text-[12px] font-medium text-[#6F6F6F]">
                <th className="px-5 py-3">Code</th>
                <th className="px-5 py-3">Credits</th>
                <th className="px-5 py-3">Trainer</th>
                <th className="px-5 py-3">Students</th>
                <th className="px-5 py-3">Docs</th>
                <th className="px-5 py-3">Tickets</th>
                <th className="px-5 py-3 w-12 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DADADA]">
              {filteredClasses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-[#5A5A5A] text-[13px]">No classes found</td>
                </tr>
              ) : (
                filteredClasses.map((cls, idx) => (
                  <tr key={cls.id} className={`transition-colors hover:bg-[#FAFAFA] ${isArchived(cls) ? "opacity-60" : ""}`}>
                    <td className="px-5 py-3.5">
                      <span className="text-[13.5px] font-semibold text-[#111111]">{cls.code}</span>
                      {isArchived(cls) && (
                        <span className="ml-2 rounded-full border border-[#DADADA] bg-[#F7F7F7] px-2 py-0.5 text-[11px] font-semibold text-[#5A5A5A]">
                          Archived
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5"><span className="text-[13px] text-[#111111]">{cls.credits}</span></td>
                    <td className="px-5 py-3.5">
                      <select
                        value={cls.trainer_id ?? ""}
                        onChange={(e) => void handleAssign(String(cls.id), e.target.value)}
                        aria-label={`Primary trainer for ${cls.code}`}
                        className="max-w-[180px] bg-white border border-[#DADADA] rounded-md px-2 py-1 text-[12.5px] outline-none focus:border-[#111111]">
                        <option value="">Unassigned</option>
                        {trainers.map((t) => (
                          <option key={t.id} value={t.id}>{t.username}</option>
                        ))}
                      </select>
                      {(() => {
                        const coTrainers = classTrainers(cls).filter((t) => !t.is_primary);
                        if (coTrainers.length === 0) return null;
                        return (
                          <p className="mt-1 text-[11.5px] text-[#5A5A5A]">
                            + {coTrainers.map((t) => t.name ?? "Trainer").join(", ")}
                          </p>
                        );
                      })()}
                      {!cls.trainer_id && <p className="text-[11px] text-[#8F6B16] mt-1">Needs trainer</p>}
                    </td>
                    <td className="px-5 py-3.5"><span className="text-[13px]">{cls.student_count}{cls.capacity ? ` / ${cls.capacity}` : ""}</span></td>
                    <td className="px-5 py-3.5"><span className="text-[13px]">{cls.document_count}</span></td>
                    <td className="px-5 py-3.5"><span className="text-[13px]">{cls.ticket_count}</span></td>
                    <td className="px-5 py-3.5 text-center relative">
                      <ActionMenu
                        label={`Actions for class ${cls.code}`}
                        direction={idx === filteredClasses.length - 1 ? "up" : "down"}
                        items={[
                          { label: "Manage trainers", icon: <Users className="w-3.5 h-3.5" />, onSelect: () => { setManageClass(cls); setNewCoTrainer(""); } },
                          isArchived(cls)
                            ? { label: "Restore class", onSelect: () => setPendingArchive(cls) }
                            : { label: "Archive class", onSelect: () => setPendingArchive(cls) },
                          // Permanent delete is a deliberate second step: archive first.
                          ...(isArchived(cls)
                            ? [{ label: "Delete permanently", danger: true, onSelect: () => setPendingDelete(cls) }]
                            : []),
                        ]}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Class"
        subtitle="The primary trainer owns the class; co-trainers share it."
        widthClass="max-w-[480px]"
      >
        <form onSubmit={(e) => void handleCreate(e)} className="space-y-4">
          <div>
            <label htmlFor="class-code" className="block text-[13px] font-medium text-[#111111] mb-1.5">Class Code *</label>
            <input id="class-code" type="text" value={createForm.code} onChange={(e) => setCreateForm({ ...createForm, code: e.target.value })}
              placeholder="e.g., CS101-FA26-001"
              className="w-full bg-white border border-[#DADADA] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#111111]" required />
          </div>
          <div>
            <label htmlFor="class-primary-trainer" className="block text-[13px] font-medium text-[#111111] mb-1.5">Primary trainer * <span className="font-normal text-[#5A5A5A]">(required)</span></label>
            <select id="class-primary-trainer" value={createForm.trainer_id} onChange={(e) => setCreateForm({ ...createForm, trainer_id: e.target.value, })} 
              className="w-full bg-white border border-[#DADADA] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#111111]" required>
              <option value="">Select trainer</option>
              {trainers.map((t) => (<option key={t.id} value={t.id}>{t.username} ({t.email})</option>))}
            </select>
          </div>
          <div>
            <span className="block text-[13px] font-medium text-[#111111] mb-1.5">Co-trainers <span className="font-normal text-[#5A5A5A]">(optional)</span></span>
            <div className="max-h-32 space-y-1 overflow-y-auto rounded-lg border border-[#DADADA] p-2">
              {trainers.filter((t) => t.id !== createForm.trainer_id).map((t) => (
                <label key={t.id} className="flex items-center gap-2 text-[12.5px] text-[#111111]">
                  <input
                    type="checkbox"
                    checked={extraTrainers.includes(t.id)}
                    onChange={() =>
                      setExtraTrainers((prev) =>
                        prev.includes(t.id) ? prev.filter((id) => id !== t.id) : [...prev, t.id],
                      )
                    }
                    className="h-3.5 w-3.5 accent-[#111111]"
                  />
                  {t.username}
                </label>
              ))}
              {trainers.filter((t) => t.id !== createForm.trainer_id).length === 0 && (
                <p className="text-[12.5px] text-[#5A5A5A]">No other trainer accounts yet.</p>
              )}
            </div>
            <p className="mt-1 text-[11.5px] text-[#5A5A5A]">
              Useful when one teacher starts the term and another takes over later.
            </p>
          </div>
          <div>
            <label htmlFor="class-name" className="block text-[13px] font-medium text-[#111111] mb-1.5">Class Name</label>
            <input id="class-name" type="text" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              placeholder="e.g., Introduction to AI - Section 1"
              className="w-full bg-white border border-[#DADADA] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#111111]" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="class-credits" className="block text-[13px] font-medium text-[#111111] mb-1.5">Credits (1-6)</label>
              <input id="class-credits" type="number" min={1} max={6} value={createForm.credits} onChange={(e) => setCreateForm({ ...createForm, credits: e.target.value })}
                className="w-full bg-white border border-[#DADADA] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#111111]" required />
            </div>
            <div>
              <label htmlFor="class-semester" className="block text-[13px] font-medium text-[#111111] mb-1.5">Semester</label>
              <select id="class-semester" value={createForm.semester} onChange={(e) => setCreateForm({ ...createForm, semester: e.target.value })}
                className="w-full bg-white border border-[#DADADA] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#111111]">
                <option value="Fall">Fall</option>
                <option value="Spring">Spring</option>
                <option value="Summer">Summer</option>
              </select>
            </div>
            <div>
              <label htmlFor="class-year" className="block text-[13px] font-medium text-[#111111] mb-1.5">Academic Year</label>
              <input id="class-year" type="text" value={createForm.academic_year} onChange={(e) => setCreateForm({ ...createForm, academic_year: e.target.value })}
                className="w-full bg-white border border-[#DADADA] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#111111]" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-[#DADADA]">
            <button type="button" onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 text-[13px] font-semibold text-[#111111] bg-white border border-[#DADADA] rounded-md hover:bg-[#F7F7F7]">Cancel</button>
            <button type="submit" disabled={creating}
              className="px-4 py-2 text-[13px] font-semibold border border-[#CFCFCF] bg-white text-[#111111] shadow-xs rounded-md hover:bg-[#F7F7F7] disabled:opacity-50">
              {creating ? "Creating..." : "Create Class"}</button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={manageClass !== null}
        onClose={() => setManageClass(null)}
        title={`Trainers — ${manageClass?.code ?? ""}`}
        subtitle="The primary trainer owns the class; co-trainers share access."
        widthClass="max-w-lg"
      >
        {manageClass && (
          <div className="space-y-4">
            <ul className="divide-y divide-[#F0F0F0] rounded-lg border border-[#DADADA]">
              {classTrainers(manageClass).map((t) => (
                <li key={t.trainer_id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <div>
                    <p className="text-[13px] font-semibold text-[#111111]">{t.name ?? "Trainer"}</p>
                    <p className="text-[12px] text-[#5A5A5A]">
                      {t.is_primary ? "Primary trainer" : "Co-trainer"}
                    </p>
                  </div>
                  {!t.is_primary && (
                    <button
                      type="button"
                      onClick={() => void handleRemoveCoTrainer(t.trainer_id)}
                      disabled={manageBusy}
                      className="rounded-md border border-[#DFB2A6] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[#9D4C38] transition-colors hover:bg-[#F7F7F7] disabled:opacity-50"
                    >
                      Remove
                    </button>
                  )}
                </li>
              ))}
            </ul>

            <div>
              <label htmlFor="add-co-trainer" className="block text-[13px] font-medium text-[#111111] mb-1.5">Add a co-trainer</label>
              <div className="flex gap-2">
                <select
                  id="add-co-trainer"
                  value={newCoTrainer}
                  onChange={(e) => setNewCoTrainer(e.target.value)}
                  className="flex-1 bg-white border border-[#DADADA] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#111111]"
                >
                  <option value="">Select a trainer</option>
                  {trainers
                    .filter((t) => !classTrainers(manageClass).some((c) => c.trainer_id === t.id))
                    .map((t) => (
                      <option key={t.id} value={t.id}>{t.username} ({t.email})</option>
                    ))}
                </select>
                <button
                  type="button"
                  onClick={() => void handleAddCoTrainer()}
                  disabled={!newCoTrainer || manageBusy}
                  className="rounded-md border border-[#CFCFCF] bg-white px-3.5 py-2 text-[13px] font-semibold text-[#111111] shadow-xs transition-colors hover:bg-[#F7F7F7] disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
      <ConfirmDialog
        isOpen={pendingArchive !== null}
        title={pendingArchive && isArchived(pendingArchive) ? "Restore this class?" : "Archive this class?"}
        tone={pendingArchive && isArchived(pendingArchive) ? "default" : "danger"}
        confirmLabel={pendingArchive && isArchived(pendingArchive) ? "Restore class" : "Archive class"}
        busyLabel={pendingArchive && isArchived(pendingArchive) ? "Restoring..." : "Archiving..."}
        description={
          pendingArchive && isArchived(pendingArchive)
            ? `${pendingArchive.code} becomes visible to its trainer and students again.`
            : `${pendingArchive?.code ?? "This class"} is hidden from its trainer and students. Nothing is deleted — the roster, materials and tickets are kept, and you can restore it at any time.`
        }
        onConfirm={runArchiveToggle}
        onCancel={() => setPendingArchive(null)}
      />
      <ConfirmDialog
        isOpen={pendingDelete !== null}
        title="Delete this class permanently?"
        tone="danger"
        confirmLabel="Delete permanently"
        busyLabel="Deleting..."
        description={
          pendingDelete && (pendingDelete.document_count > 0 || pendingDelete.ticket_count > 0)
            ? `${pendingDelete.code} still has ${pendingDelete.document_count} document(s) and ${pendingDelete.ticket_count} ticket(s). Members keep their accounts but are unlinked. This cannot be undone.`
            : `${pendingDelete?.code ?? "This class"} will be removed and members unlinked. This cannot be undone.`
        }
        onConfirm={runDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </AdminPageShell>
  );
}
