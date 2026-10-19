"use client";

import * as React from "react";
import { Info, Copy, Check } from "lucide-react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
  studentApi,
  type ClassConfig,
  type ClassConfigSource,
  type ClassInfo,
  type StudentClass,
} from "@/lib/student-api";
import { Modal } from "@/components/shared/Modal";

function ReadOnlyField({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-[12.5px] font-semibold text-[#5A5A5A]">{label}</label>
      <div
        className={`rounded border border-[#DADADA] bg-[#FAFAFA] p-2.5 text-[13px] text-[#111111] ${
          mono ? "font-mono" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}

const SELECT_CLASS =
  "w-full rounded-lg border border-[#DADADA] bg-white px-3 py-2 text-[13px] text-[#111111] outline-none focus:border-[#111111]";
const INPUT_CLASS = SELECT_CLASS;

// Capacity is admin-owned and shown read-only, so it is not part of the draft.
type Draft = Omit<ClassConfig, "class_id" | "capacity">;
type InfoDraft = {
  description: string;
  meeting_url: string;
  group_url: string;
  schedule_note: string;
  note: string;
};

const EMPTY_INFO: InfoDraft = {
  description: "",
  meeting_url: "",
  group_url: "",
  schedule_note: "",
  note: "",
};

function toInfoDraft(info: ClassInfo): InfoDraft {
  return {
    description: info.description ?? "",
    meeting_url: info.meeting_url ?? "",
    group_url: info.group_url ?? "",
    schedule_note: info.schedule_note ?? "",
    note: info.note ?? "",
  };
}

const DELIVERY_LABELS: Record<Draft["delivery_mode"], string> = {
  on_campus: "On campus",
  online: "Online",
  hybrid: "Hybrid",
};

function toDraft(cfg: ClassConfig): Draft {
  return {
    delivery_mode: cfg.delivery_mode,
    default_language: cfg.default_language,
    answer_scope: cfg.answer_scope,
    citation_required: cfg.citation_required,
    max_answer_words: cfg.max_answer_words,
    session_length_minutes: cfg.session_length_minutes,
  };
}

export default function ClassSettingsPage() {
  const params = useParams();
  const id = params.id as string;
  const [cls, setCls] = React.useState<StudentClass | null>(null);
  const [config, setConfig] = React.useState<ClassConfig | null>(null);
  const [draft, setDraft] = React.useState<Draft | null>(null);
  const [info, setInfo] = React.useState<ClassInfo | null>(null);
  const [infoDraft, setInfoDraft] = React.useState<InfoDraft>(EMPTY_INFO);
  const [infoSaving, setInfoSaving] = React.useState(false);
  const [infoSaved, setInfoSaved] = React.useState(false);
  const [sources, setSources] = React.useState<ClassConfigSource[]>([]);
  const [isCopyOpen, setIsCopyOpen] = React.useState(false);
  const [copySource, setCopySource] = React.useState("");
  const [copying, setCopying] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setSaved(false);
      const [detail, cfg, page] = await Promise.all([
        studentApi.classDetail(id),
        studentApi.config(id),
        studentApi.info(id),
      ]);
      setCls(detail);
      setConfig(cfg);
      setDraft(toDraft(cfg));
      setInfo(page);
      setInfoDraft(toInfoDraft(page));
      setInfoSaved(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load class");
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-time fetch; load() only sets state after await.
    void load();
  }, [load]);

  const changes = React.useMemo(() => {
    if (!config || !draft) return {} as Partial<Draft>;
    const diff: Partial<Draft> = {};
    (Object.keys(draft) as (keyof Draft)[]).forEach((key) => {
      if (draft[key] !== config[key]) {
        // The generic index across a union of field types is intentional here.
        (diff as Record<string, Draft[keyof Draft]>)[key] = draft[key];
      }
    });
    return diff;
  }, [config, draft]);

  const dirty = Object.keys(changes).length > 0;

  const infoChanges = React.useMemo(() => {
    if (!info) return {} as Partial<InfoDraft>;
    const current = toInfoDraft(info);
    const diff: Partial<InfoDraft> = {};
    (Object.keys(infoDraft) as (keyof InfoDraft)[]).forEach((key) => {
      if (infoDraft[key] !== current[key]) diff[key] = infoDraft[key];
    });
    return diff;
  }, [info, infoDraft]);

  const infoDirty = Object.keys(infoChanges).length > 0;

  async function handleInfoSave(e: React.FormEvent) {
    e.preventDefault();
    if (!infoDirty) return;
    setInfoSaving(true);
    try {
      const updated = await studentApi.updateInfo(id, infoChanges);
      setInfo(updated);
      setInfoDraft(toInfoDraft(updated));
      setInfoSaved(true);
      toast.success("Class information saved.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save class information");
    } finally {
      setInfoSaving(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!dirty) return;
    setSaving(true);
    try {
      const updated = await studentApi.updateConfig(id, changes);
      setConfig(updated);
      setDraft(toDraft(updated));
      setSaved(true);
      toast.success("Class configuration saved.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save configuration");
    } finally {
      setSaving(false);
    }
  }

  async function openCopyPicker() {
    setIsCopyOpen(true);
    if (sources.length > 0) return;
    try {
      const list = await studentApi.configSources();
      setSources(list.filter((s) => s.id !== id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load classes");
    }
  }

  async function handleCopy() {
    if (!copySource) return;
    setCopying(true);
    try {
      const updated = await studentApi.copyConfig(id, copySource);
      setConfig(updated);
      setDraft(toDraft(updated));
      setIsCopyOpen(false);
      setCopySource("");
      setSaved(true);
      toast.success("Configuration copied.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to copy configuration");
    } finally {
      setCopying(false);
    }
  }

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h2 className="text-xl font-bold text-[#111111]">Course Settings</h2>
        <p className="mt-0.5 text-[13px] text-[#5A5A5A]">
          Class information and the configuration that guides how this class is taught.
        </p>
      </div>

      <div className="rounded-lg border border-[#DADADA] bg-white p-6">
        <h3 className="mb-4 text-[14px] font-bold text-[#111111]">General</h3>
        {loading ? (
          <p className="text-[13px] text-[#5A5A5A]">Loading class settings…</p>
        ) : error || !cls ? (
          <div className="text-[13px]">
            <p className="text-[#9D4C38]">{error ?? "Class not found."}</p>
            <button onClick={() => void load()} className="mt-2 font-semibold text-[#111111] hover:underline">
              Retry
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <ReadOnlyField label="Course title" value={cls.name} />
            <ReadOnlyField label="Course code" value={cls.code} mono />
            <div className="grid grid-cols-2 gap-4">
              <ReadOnlyField label="Semester" value={cls.semester || "—"} />
              <ReadOnlyField label="Academic year" value={cls.academic_year || "—"} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <ReadOnlyField label="Credits" value={cls.credits} />
              <ReadOnlyField label="Trainer" value={cls.trainer_name ?? "Unassigned"} />
            </div>
          </div>
        )}
      </div>

      {!loading && !error && info && (
        <form
          onSubmit={(e) => void handleInfoSave(e)}
          className="rounded-lg border border-[#DADADA] bg-white p-6"
        >
          <div className="mb-4">
            <h3 className="text-[14px] font-bold text-[#111111]">Class information</h3>
            <p className="mt-0.5 max-w-lg text-[12.5px] text-[#5A5A5A]">
              This is what students read on the class overview: what the course covers, how to join
              the online session, the class group, and anything else they should know. Empty fields
              are hidden.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="info-description" className="mb-1.5 block text-[13px] font-medium text-[#111111]">
                Description
              </label>
              <textarea
                id="info-description"
                rows={3}
                maxLength={2000}
                placeholder="What this course covers, prerequisites, how each session runs…"
                value={infoDraft.description}
                onChange={(e) => {
                  setInfoDraft({ ...infoDraft, description: e.target.value });
                  setInfoSaved(false);
                }}
                className={`${INPUT_CLASS} resize-y`}
              />
            </div>

            <div>
              <label htmlFor="info-meeting" className="mb-1.5 block text-[13px] font-medium text-[#111111]">
                Online class link
              </label>
              <input
                id="info-meeting"
                type="url"
                inputMode="url"
                placeholder="https://meet.google.com/…"
                value={infoDraft.meeting_url}
                onChange={(e) => {
                  setInfoDraft({ ...infoDraft, meeting_url: e.target.value });
                  setInfoSaved(false);
                }}
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label htmlFor="info-group" className="mb-1.5 block text-[13px] font-medium text-[#111111]">
                Class group link
              </label>
              <input
                id="info-group"
                type="url"
                inputMode="url"
                placeholder="https://zalo.me/g/…"
                value={infoDraft.group_url}
                onChange={(e) => {
                  setInfoDraft({ ...infoDraft, group_url: e.target.value });
                  setInfoSaved(false);
                }}
                className={INPUT_CLASS}
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="info-schedule" className="mb-1.5 block text-[13px] font-medium text-[#111111]">
                Schedule
              </label>
              <input
                id="info-schedule"
                maxLength={200}
                placeholder="Mon &amp; Wed 19:00–21:00, online"
                value={infoDraft.schedule_note}
                onChange={(e) => {
                  setInfoDraft({ ...infoDraft, schedule_note: e.target.value });
                  setInfoSaved(false);
                }}
                className={INPUT_CLASS}
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="info-note" className="mb-1.5 block text-[13px] font-medium text-[#111111]">
                More information
              </label>
              <textarea
                id="info-note"
                rows={3}
                maxLength={2000}
                placeholder="Group registration, report schedule, class rules…"
                value={infoDraft.note}
                onChange={(e) => {
                  setInfoDraft({ ...infoDraft, note: e.target.value });
                  setInfoSaved(false);
                }}
                className={`${INPUT_CLASS} resize-y`}
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 border-t border-[#F0F0F0] pt-4">
            {infoSaved && !infoDirty && (
              <span className="mr-auto flex items-center gap-1.5 text-[12.5px] text-[#3B7D5D]">
                <Check className="h-3.5 w-3.5" /> Saved
              </span>
            )}
            <button
              type="button"
              onClick={() => setInfoDraft(toInfoDraft(info))}
              disabled={!infoDirty || infoSaving}
              className="rounded-md border border-[#DADADA] bg-white px-4 py-2 text-[13px] font-semibold text-[#111111] transition-colors hover:bg-[#F7F7F7] disabled:opacity-50"
            >
              Reset
            </button>
            <button
              type="submit"
              id="info-save"
              disabled={!infoDirty || infoSaving}
              className="rounded-md border border-[#CFCFCF] bg-white px-4 py-2 text-[13px] font-semibold text-[#111111] shadow-xs transition-colors hover:bg-[#F7F7F7] disabled:opacity-50"
            >
              {infoSaving ? "Saving…" : "Save class information"}
            </button>
          </div>
        </form>
      )}

      {!loading && !error && draft && config && (
        <form onSubmit={(e) => void handleSave(e)} className="rounded-lg border border-[#DADADA] bg-white p-6">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-[14px] font-bold text-[#111111]">Class configuration</h3>
              <p className="mt-0.5 max-w-lg text-[12.5px] text-[#5A5A5A]">
                Delivery mode, language, answer rules and session length for this class. Copy them
                onto another class to reuse the same setup. Student capacity is managed by admin.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void openCopyPicker()}
              className="flex items-center gap-1.5 rounded-md border border-[#DADADA] bg-white px-3 py-1.5 text-[12.5px] font-semibold text-[#111111] transition-colors hover:bg-[#F7F7F7]"
            >
              <Copy className="h-3.5 w-3.5" />
              Copy from another class
            </button>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <ReadOnlyField
                label="Student capacity"
                value={
                  config.capacity === null
                    ? "No limit — managed by admin"
                    : `${config.capacity} students — managed by admin`
                }
              />
            </div>

            <div>
              <label htmlFor="cfg-delivery" className="mb-1.5 block text-[13px] font-medium text-[#111111]">
                Delivery mode
              </label>
              <select
                id="cfg-delivery"
                value={draft.delivery_mode}
                onChange={(e) => {
                  setDraft({ ...draft, delivery_mode: e.target.value as Draft["delivery_mode"] });
                  setSaved(false);
                }}
                className={SELECT_CLASS}
              >
                {(Object.keys(DELIVERY_LABELS) as Draft["delivery_mode"][]).map((mode) => (
                  <option key={mode} value={mode}>
                    {DELIVERY_LABELS[mode]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="cfg-session" className="mb-1.5 block text-[13px] font-medium text-[#111111]">
                Session length (minutes)
              </label>
              <input
                id="cfg-session"
                type="number"
                min={30}
                max={180}
                step={15}
                value={draft.session_length_minutes}
                onChange={(e) => {
                  setDraft({ ...draft, session_length_minutes: Number(e.target.value) });
                  setSaved(false);
                }}
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 border-t border-[#F0F0F0] pt-4">
            {saved && !dirty && (
              <span className="mr-auto flex items-center gap-1.5 text-[12.5px] text-[#3B7D5D]">
                <Check className="h-3.5 w-3.5" /> Saved
              </span>
            )}
            <button
              type="button"
              onClick={() => void load()}
              disabled={!dirty || saving}
              className="rounded-md border border-[#DADADA] bg-white px-4 py-2 text-[13px] font-semibold text-[#111111] transition-colors hover:bg-[#F7F7F7] disabled:opacity-50"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={!dirty || saving}
              className="rounded-md border border-[#CFCFCF] bg-white px-4 py-2 text-[13px] font-semibold text-[#111111] shadow-xs transition-colors hover:bg-[#F7F7F7] disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      )}

      <div className="rounded-lg border border-[#DADADA] bg-white p-6">
        <h3 className="mb-3 flex items-center gap-2 text-[14px] font-bold text-[#111111]">
          <Info className="h-4 w-4 text-[#6F6F6F]" /> Access &amp; notifications
        </h3>
        <p className="max-w-lg text-[13px] leading-relaxed text-[#5A5A5A]">
          Join rules, join-code rotation and notification preferences aren&apos;t editable yet — the backend
          doesn&apos;t expose an endpoint for them, so nothing is shown as if it were already configured.
        </p>
      </div>

      <div className="rounded-lg border border-[#DADADA] bg-white p-6">
        <h3 className="mb-3 flex items-center gap-2 text-[14px] font-bold text-[#111111]">
          <Info className="h-4 w-4 text-[#6F6F6F]" /> Archive &amp; delete
        </h3>
        <p className="max-w-lg text-[13px] leading-relaxed text-[#5A5A5A]">
          An administrator can archive this class to hide it (and its roster) from teachers and students
          without losing any data, and can delete it permanently only after it is archived.
        </p>
      </div>

      <Modal
        isOpen={isCopyOpen}
        onClose={() => setIsCopyOpen(false)}
        title="Copy configuration"
        subtitle="Copies delivery mode and session length from a class you teach. Capacity is not copied — it depends on this class' own roster."
        widthClass="max-w-md"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="cfg-source" className="mb-1.5 block text-[13px] font-medium text-[#111111]">
              Copy from
            </label>
            <select
              id="cfg-source"
              value={copySource}
              onChange={(e) => setCopySource(e.target.value)}
              className={SELECT_CLASS}
            >
              <option value="">Select a class</option>
              {sources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} — {s.name}
                </option>
              ))}
            </select>
            {sources.length === 0 && (
              <p className="mt-1.5 text-[12px] text-[#5A5A5A]">
                No other class is available to copy from.
              </p>
            )}
          </div>
          <div className="flex justify-end gap-3 border-t border-[#F0F0F0] pt-4">
            <button
              type="button"
              onClick={() => setIsCopyOpen(false)}
              className="rounded-md border border-[#DADADA] bg-white px-4 py-2 text-[13px] font-semibold text-[#111111] transition-colors hover:bg-[#F7F7F7]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleCopy()}
              disabled={!copySource || copying}
              className="rounded-md border border-[#CFCFCF] bg-white px-4 py-2 text-[13px] font-semibold text-[#111111] shadow-xs transition-colors hover:bg-[#F7F7F7] disabled:opacity-50"
            >
              {copying ? "Copying…" : "Copy configuration"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
