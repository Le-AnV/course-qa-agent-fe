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
  type ClassInfoField,
  type StudentClass,
  type TemplateDocument,
} from "@/lib/student-api";
import { formatFileSize } from "@/lib/documents";
import { Modal } from "@/components/shared/Modal";
import { AppSelect } from "@/components/ui/app-select";
import { peekClassDetail } from "@/lib/class-cache";
import { useIsomorphicLayoutEffect } from "@/hooks/use-isomorphic-layout-effect";
import { Reveal, SkeletonCard, SkeletonLine } from "@/components/shared/page-skeleton";

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

function AutoGrowTextarea({
  value,
  maxHeight = 320,
  className,
  ...props
}: Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "value"> & {
  value: string;
  maxHeight?: number;
}) {
  const ref = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  }, [value, maxHeight]);

  return (
    <textarea
      ref={ref}
      rows={2}
      value={value}
      {...props}
      className={`${INPUT_CLASS} min-h-[76px] resize-none overflow-y-auto ${className ?? ""}`}
    />
  );
}

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

const INFO_FIELD_OPTIONS: { key: ClassInfoField; label: string }[] = [
  { key: "description", label: "Description" },
  { key: "meeting_url", label: "Online class link" },
  { key: "group_url", label: "Class group link" },
  { key: "schedule_note", label: "Schedule" },
  { key: "note", label: "More information" },
];

function hasText(value: string | null | undefined): boolean {
  return Boolean(value?.trim());
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
  const [sourceInfo, setSourceInfo] = React.useState<ClassInfo | null>(null);
  const [copyConfig, setCopyConfig] = React.useState(true);
  const [selectedInfoFields, setSelectedInfoFields] = React.useState<ClassInfoField[]>([]);
  const [templateDocs, setTemplateDocs] = React.useState<TemplateDocument[]>([]);
  const [selectedDocs, setSelectedDocs] = React.useState<string[]>([]);
  const [loadingDocs, setLoadingDocs] = React.useState(false);
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

  // Warm cache seeded by the class layout: the General card can render with real
  // values on the first frame instead of a "Loading class settings…" line.
  useIsomorphicLayoutEffect(() => {
    const cached = peekClassDetail(id);
    if (cached) setCls((current) => current ?? cached);
  }, [id]);

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

  function resetCopyPicker() {
    setCopySource("");
    setSourceInfo(null);
    setCopyConfig(true);
    setSelectedInfoFields([]);
    setTemplateDocs([]);
    setSelectedDocs([]);
  }

  async function openCopyPicker() {
    setIsCopyOpen(true);
    resetCopyPicker();
    if (sources.length > 0) return;
    try {
      const list = await studentApi.configSources();
      setSources(list.filter((s) => s.id !== id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load classes");
    }
  }

  async function selectCopySource(sourceId: string) {
    setCopySource(sourceId);
    setSourceInfo(null);
    setSelectedInfoFields([]);
    setTemplateDocs([]);
    setSelectedDocs([]);
    if (!sourceId) return;
    setLoadingDocs(true);
    try {
      const [docs, page] = await Promise.all([
        studentApi.templateDocuments(id, sourceId),
        studentApi.info(sourceId),
      ]);
      setTemplateDocs(docs);
      setSelectedDocs(docs.map((d) => d.id));
      setSourceInfo(page);
      setSelectedInfoFields(
        INFO_FIELD_OPTIONS.filter(
          ({ key }) => hasText(page[key]) && !hasText(info?.[key]),
        ).map(({ key }) => key),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load template");
    } finally {
      setLoadingDocs(false);
    }
  }

  function toggleDocument(documentId: string) {
    setSelectedDocs((current) =>
      current.includes(documentId)
        ? current.filter((value) => value !== documentId)
        : [...current, documentId],
    );
  }

  function toggleAllDocuments() {
    setSelectedDocs((current) =>
      current.length === templateDocs.length ? [] : templateDocs.map((d) => d.id),
    );
  }

  function toggleInfoField(field: ClassInfoField) {
    setSelectedInfoFields((current) =>
      current.includes(field)
        ? current.filter((value) => value !== field)
        : [...current, field],
    );
  }

  const canCopy = copyConfig || selectedInfoFields.length > 0 || selectedDocs.length > 0;

  async function handleCopy() {
    if (!copySource || !canCopy) return;
    setCopying(true);
    try {
      const infoCount = selectedInfoFields.length;
      const result = await studentApi.copyTemplate(id, copySource, selectedDocs, {
        copyConfig,
        infoFields: selectedInfoFields,
      });
      setConfig(result.config);
      setDraft(toDraft(result.config));
      setInfo(result.info);
      setInfoDraft(toInfoDraft(result.info));
      if (copyConfig) setSaved(true);
      if (infoCount > 0) setInfoSaved(true);
      setIsCopyOpen(false);
      resetCopyPicker();

      const copiedCount = result.copied_documents.length;
      const parts: string[] = [];
      if (copyConfig) parts.push("teaching configuration");
      if (infoCount > 0) {
        parts.push(`${infoCount} information field${infoCount === 1 ? "" : "s"}`);
      }
      if (copiedCount > 0) {
        parts.push(`${copiedCount} document${copiedCount === 1 ? "" : "s"}`);
      }
      const copiedLabel = parts.length > 0 ? ` (${parts.join(", ")})` : "";
      if (result.skipped_documents.length > 0) {
        const names = result.skipped_documents
          .slice(0, 3)
          .map((d) => d.file_name)
          .join(", ");
        const more = result.skipped_documents.length > 3 ? "..." : "";
        toast.warning(`Template copied${copiedLabel}. Skipped: ${names}${more}`);
      } else {
        toast.success(`Template copied${copiedLabel}.`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to copy the template");
    } finally {
      setCopying(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#111111]">Course Settings</h2>
        <p className="mt-0.5 text-[13px] text-[#5A5A5A]">
          Class information and the configuration that guides how this class is taught.
        </p>
      </div>

      <div className="rounded-lg border border-[#DADADA] bg-white p-6">
        <h3 className="mb-4 text-[14px] font-bold text-[#111111]">General</h3>
        {!cls && loading ? (
          <div className="space-y-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i}>
                <SkeletonLine className="mb-1 h-3 w-24" />
                <SkeletonLine className="h-9 w-full" />
              </div>
            ))}
          </div>
        ) : error || !cls ? (
          <div className="text-[13px]">
            <p className="text-[#9D4C38]">{error ?? "Class not found."}</p>
            <button onClick={() => void load()} className="mt-2 font-semibold text-[#111111] hover:underline">
              Retry
            </button>
          </div>
        ) : (
          <Reveal className="space-y-4">
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
          </Reveal>
        )}
      </div>

      {loading && !error && !info ? (
        <SkeletonCard className="h-[260px]" />
      ) : !error && info ? (
        <Reveal>
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
            <p className="mt-1 max-w-lg text-[12px] text-[#6F6F6F]">
              Markdown is supported: <strong>bold</strong>, <em>italic</em>, - bullet lists, 1.
              numbered lists, [links](https://example.com), and blank lines. Line breaks are kept
              when the page is displayed.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="info-description" className="mb-1.5 block text-[13px] font-medium text-[#111111]">
                Description
              </label>
              <AutoGrowTextarea
                id="info-description"
                maxLength={2000}
                maxHeight={360}
                placeholder="What this course covers, prerequisites, how each session runs…"
                value={infoDraft.description}
                onChange={(e) => {
                  setInfoDraft({ ...infoDraft, description: e.target.value });
                  setInfoSaved(false);
                }}
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
              <AutoGrowTextarea
                id="info-schedule"
                maxLength={500}
                maxHeight={260}
                placeholder={"**Lecture:** Tue & Thu 19:00-21:00\n**Lab:** Fri 13:30-16:00\n**Location:** Online via Google Meet"}
                value={infoDraft.schedule_note}
                onChange={(e) => {
                  setInfoDraft({ ...infoDraft, schedule_note: e.target.value });
                  setInfoSaved(false);
                }}
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="info-note" className="mb-1.5 block text-[13px] font-medium text-[#111111]">
                More information
              </label>
              <AutoGrowTextarea
                id="info-note"
                maxLength={2000}
                maxHeight={360}
                placeholder="Group registration, report schedule, class rules…"
                value={infoDraft.note}
                onChange={(e) => {
                  setInfoDraft({ ...infoDraft, note: e.target.value });
                  setInfoSaved(false);
                }}
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
        </Reveal>
      ) : null}

      {loading && !error && (!draft || !config) ? (
        <SkeletonCard className="h-[320px]" />
      ) : !error && draft && config ? (
        <Reveal>
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
              <AppSelect
                id="cfg-delivery"
                value={draft.delivery_mode}
                onValueChange={(value) => {
                  setDraft({ ...draft, delivery_mode: value as Draft["delivery_mode"] });
                  setSaved(false);
                }}
                options={(Object.keys(DELIVERY_LABELS) as Draft["delivery_mode"][]).map((mode) => ({
                  value: mode,
                  label: DELIVERY_LABELS[mode],
                }))}
              />
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
        </Reveal>
      ) : null}

      {/* Two static cards. They follow the fetched sections, whose skeletons now
          reserve the same height, so rendering them immediately no longer shifts
          the page when the data lands. */}
      {!loading && (
        <>
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
        </>
      )}

      <Modal
        isOpen={isCopyOpen}
        onClose={() => {
          setIsCopyOpen(false);
          resetCopyPicker();
        }}
        title="Copy class template"
        subtitle="Choose what to copy. Existing class information stays unless you tick its field. Capacity is never copied."
        widthClass="max-w-lg"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="cfg-source" className="mb-1.5 block text-[13px] font-medium text-[#111111]">
              Copy from
            </label>
            <AppSelect
              id="cfg-source"
              value={copySource}
              onValueChange={(value) => void selectCopySource(value)}
              options={[
                { value: "", label: "Select a class" },
                ...sources.map((s) => ({
                  value: s.id,
                  label: `${s.code} - ${s.name}${s.status === "ARCHIVED" ? " (archived)" : ""}`,
                })),
              ]}
              contentClassName="min-w-[320px]"
            />
            {sources.length === 0 && (
              <p className="mt-1.5 text-[12px] text-[#5A5A5A]">
                No other class is available to copy from.
              </p>
            )}
          </div>

          {loadingDocs && (
            <p className="text-[12px] text-[#5A5A5A]">Loading template...</p>
          )}

          {!loadingDocs && copySource && (
            <div className="divide-y divide-[#F0F0F0] rounded-md border border-[#E5E5E5]">
              <label className="flex cursor-pointer items-start gap-2.5 p-3 hover:bg-[#FAFAFA]">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={copyConfig}
                  onChange={(e) => setCopyConfig(e.target.checked)}
                />
                <span>
                  <span className="block text-[13px] font-semibold text-[#111111]">
                    Teaching configuration
                  </span>
                  <span className="mt-0.5 block text-[11.5px] leading-relaxed text-[#6F6F6F]">
                    Delivery mode, language, answer rules and session length.
                  </span>
                </span>
              </label>

              <div className="p-3">
                <p className="text-[13px] font-semibold text-[#111111]">Class information</p>
                <p className="mt-0.5 text-[11.5px] leading-relaxed text-[#6F6F6F]">
                  Only ticked fields are copied. Existing content is kept unless you tick it.
                </p>
                <ul className="mt-2 space-y-1">
                  {INFO_FIELD_OPTIONS.map(({ key, label }) => {
                    const sourceHasValue = hasText(sourceInfo?.[key]);
                    const targetHasValue = hasText(info?.[key]);
                    return (
                      <li key={key}>
                        <label
                          className={`flex items-start justify-between gap-3 rounded px-1 py-1 ${
                            sourceHasValue ? "cursor-pointer hover:bg-[#FAFAFA]" : "opacity-50"
                          }`}
                        >
                          <span className="flex items-start gap-2">
                            <input
                              type="checkbox"
                              className="mt-0.5"
                              checked={selectedInfoFields.includes(key)}
                              disabled={!sourceHasValue}
                              onChange={() => toggleInfoField(key)}
                            />
                            <span className="text-[12.5px] text-[#111111]">{label}</span>
                          </span>
                          <span
                            className={`text-right text-[11px] ${
                              targetHasValue && sourceHasValue ? "text-[#9D4C38]" : "text-[#6F6F6F]"
                            }`}
                          >
                            {!sourceHasValue
                              ? "Source empty"
                              : targetHasValue
                                ? "Overwrites current"
                                : "Fills empty field"}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[13px] font-semibold text-[#111111]">Approved documents</p>
                  {templateDocs.length > 0 && (
                    <button
                      type="button"
                      onClick={toggleAllDocuments}
                      className="text-[12px] font-semibold text-[#111111] hover:underline"
                    >
                      {selectedDocs.length === templateDocs.length ? "Clear all" : "Select all"}
                    </button>
                  )}
                </div>
                {templateDocs.length === 0 ? (
                  <p className="mt-1.5 text-[12px] text-[#5A5A5A]">
                    This class has no approved documents to copy.
                  </p>
                ) : (
                  <ul className="mt-2 max-h-56 space-y-1.5 overflow-y-auto">
                    {templateDocs.map((doc) => (
                      <li key={doc.id}>
                        <label className="flex cursor-pointer items-start gap-2 rounded px-1 py-1 hover:bg-[#FAFAFA]">
                          <input
                            type="checkbox"
                            className="mt-0.5"
                            checked={selectedDocs.includes(doc.id)}
                            onChange={() => toggleDocument(doc.id)}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] text-[#111111]">
                              {doc.file_name}
                            </span>
                            <span className="block text-[11.5px] text-[#6F6F6F]">
                              {doc.file_type} - {formatFileSize(doc.size_bytes)}
                            </span>
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-2 text-[11.5px] text-[#6F6F6F]">
                  Copied once. Later changes in this class do not affect the source class.
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 border-t border-[#F0F0F0] pt-4">
            <p className="text-[11.5px] text-[#6F6F6F]">
              {copySource && !canCopy ? "Select at least one item to copy." : ""}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsCopyOpen(false);
                  resetCopyPicker();
                }}
                className="rounded-md border border-[#DADADA] bg-white px-4 py-2 text-[13px] font-semibold text-[#111111] transition-colors hover:bg-[#F7F7F7]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleCopy()}
                disabled={!copySource || copying || loadingDocs || !canCopy}
                className="rounded-md border border-[#CFCFCF] bg-white px-4 py-2 text-[13px] font-semibold text-[#111111] shadow-xs transition-colors hover:bg-[#F7F7F7] disabled:opacity-50"
              >
                {copying ? "Copying..." : "Copy template"}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
