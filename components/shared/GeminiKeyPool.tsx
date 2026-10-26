"use client";

import * as React from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  KeyRound,
  Pause,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Save,
  Trash2,
} from "lucide-react";

import { AppSelect } from "@/components/ui/app-select";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Modal } from "@/components/shared/Modal";
import {
  ADMIN_BTN_PRIMARY,
  ADMIN_BTN_SECONDARY,
  ADMIN_CARD,
  ADMIN_INPUT,
} from "@/components/shared/AdminPageShell";
import {
  adminApi,
  type GeminiKey,
  type GeminiKeyStatus,
  type GeminiKeys,
  type GeminiModelConfig,
} from "@/lib/admin-api";

type Feedback = { tone: "success" | "error"; text: string };

type KeyForm = {
  name: string;
  apiKey: string;
};

const EMPTY_FORM: KeyForm = {
  name: "",
  apiKey: "",
};

const STATUS_META: Record<GeminiKeyStatus, { label: string; className: string }> = {
  active: {
    label: "Active",
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  paused: {
    label: "Paused",
    className: "border-slate-200 bg-slate-100 text-slate-600",
  },
  cooldown: {
    label: "Cooling down",
    className: "border-amber-200 bg-amber-50 text-amber-800",
  },
  invalid: {
    label: "Invalid",
    className: "border-rose-200 bg-rose-50 text-rose-700",
  },
};

function modelLabel(model: string): string {
  return model.replace(/^models\//, "");
}

function formatTime(value: string | null): string {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Never";
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function cooldownLabel(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const seconds = Math.max(0, Math.ceil((date.getTime() - Date.now()) / 1000));
  const duration =
    seconds < 60
      ? `${seconds}s`
      : seconds < 3600
        ? `${Math.ceil(seconds / 60)}m`
        : `${Math.ceil(seconds / 3600)}h`;
  return `Retries in ${duration}`;
}

export function GeminiKeyPool() {
  const [data, setData] = React.useState<GeminiKeys | null>(null);
  const [modelConfig, setModelConfig] = React.useState<GeminiModelConfig | null>(null);
  const [selectedModel, setSelectedModel] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [feedback, setFeedback] = React.useState<Feedback | null>(null);

  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<GeminiKey | null>(null);
  const [form, setForm] = React.useState<KeyForm>(EMPTY_FORM);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [savingKey, setSavingKey] = React.useState(false);

  const [testingId, setTestingId] = React.useState<string | null>(null);
  const [togglingId, setTogglingId] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState<GeminiKey | null>(null);
  const [savingModel, setSavingModel] = React.useState(false);
  const [savingAutoSwitch, setSavingAutoSwitch] = React.useState(false);
  const [keysExpanded, setKeysExpanded] = React.useState(false);
  const [expandedKeys, setExpandedKeys] = React.useState<Set<string>>(
    () => new Set(),
  );

  const load = React.useCallback(async () => {
    const [keys, models] = await Promise.all([
      adminApi.geminiKeys(),
      adminApi.geminiModels(),
    ]);
    setData(keys);
    setModelConfig(models);
    setSelectedModel(models.model);
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
      .catch((error: unknown) => {
        if (!cancelled) {
          setFeedback({
            tone: "error",
            text: error instanceof Error ? error.message : "Failed to load Gemini keys.",
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [load]);

  const modelOptions = React.useMemo(() => {
    const models = new Set<string>();
    if (modelConfig?.model) models.add(modelConfig.model);
    for (const model of modelConfig?.available_models ?? []) models.add(model);
    return Array.from(models)
      .sort((a, b) => modelLabel(a).localeCompare(modelLabel(b)))
      .map((model) => ({
        value: model,
        label: modelLabel(model),
        description: model === modelConfig?.model ? "Current model" : model,
      }));
  }, [modelConfig]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setKeysExpanded(true);
    setModalOpen(true);
  }

  function openEdit(key: GeminiKey) {
    setEditing(key);
    setForm({ name: key.name, apiKey: "" });
    setFormError(null);
    setModalOpen(true);
  }

  function closeModal() {
    if (savingKey) return;
    setModalOpen(false);
    setEditing(null);
    setFormError(null);
  }

  function toggleKeyExpanded(keyId: string) {
    setExpandedKeys((current) => {
      const next = new Set(current);
      if (next.has(keyId)) next.delete(keyId);
      else next.add(keyId);
      return next;
    });
  }

  async function saveKey(event: React.FormEvent) {
    event.preventDefault();
    const name = form.name.trim();
    if (!name) {
      setFormError("Give the key a name you can recognise.");
      return;
    }
    if (!editing && !form.apiKey.trim()) {
      setFormError("Paste the Gemini API key.");
      return;
    }

    setSavingKey(true);
    setFormError(null);
    setFeedback(null);
    try {
      if (editing) {
        await adminApi.updateGeminiKey(editing.id, { name });
        setFeedback({ tone: "success", text: `Updated ${name}.` });
      } else {
        const created = await adminApi.createGeminiKey({
          name,
          api_key: form.apiKey.trim(),
        });
        setKeysExpanded(true);
        setExpandedKeys(new Set([created.id]));
        setFeedback({ tone: "success", text: `Added ${name}. It is ready for rotation.` });
      }
      setModalOpen(false);
      setEditing(null);
      setForm(EMPTY_FORM);
      await load();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not save this key.");
    } finally {
      setSavingKey(false);
    }
  }

  async function toggleKey(key: GeminiKey) {
    const status = key.status === "paused" ? "active" : "paused";
    setTogglingId(key.id);
    setFeedback(null);
    try {
      await adminApi.updateGeminiKey(key.id, { status });
      setFeedback({
        tone: "success",
        text: status === "active" ? `${key.name} is active again.` : `${key.name} is paused.`,
      });
      await load();
    } catch (error) {
      setFeedback({
        tone: "error",
        text: error instanceof Error ? error.message : "Could not change key status.",
      });
    } finally {
      setTogglingId(null);
    }
  }

  async function testKey(key: GeminiKey) {
    setTestingId(key.id);
    setFeedback(null);
    try {
      const result = await adminApi.testGeminiKey(key.id);
      setFeedback({
        tone: result.success ? "success" : "error",
        text: `${key.name}: ${result.message}`,
      });
      if (result.success) await load();
    } catch (error) {
      setFeedback({
        tone: "error",
        text: error instanceof Error ? error.message : "Could not test this key.",
      });
    } finally {
      setTestingId(null);
    }
  }

  async function deleteKey() {
    if (!deleting) return;
    const key = deleting;
    setFeedback(null);
    try {
      await adminApi.deleteGeminiKey(key.id);
      setExpandedKeys((current) => {
        const next = new Set(current);
        next.delete(key.id);
        return next;
      });
      setDeleting(null);
      setFeedback({ tone: "success", text: `Deleted ${key.name}.` });
      await load();
    } catch (error) {
      setDeleting(null);
      setFeedback({
        tone: "error",
        text: error instanceof Error ? error.message : "Could not delete this key.",
      });
    }
  }

  async function toggleAutoSwitch() {
    if (!data || savingAutoSwitch) return;
    const previous = data.auto_switch;
    const enabled = !previous;
    setSavingAutoSwitch(true);
    setData((current) =>
      current ? { ...current, auto_switch: enabled } : current
    );
    try {
      const updated = await adminApi.updateGeminiAutoSwitch(enabled);
      setData((current) =>
        current ? { ...current, auto_switch: updated.enabled } : current
      );
    } catch (error) {
      setData((current) =>
        current ? { ...current, auto_switch: previous } : current
      );
      setFeedback({
        tone: "error",
        text:
          error instanceof Error ? error.message : "Could not change auto-switch.",
      });
    } finally {
      setSavingAutoSwitch(false);
    }
  }

  async function saveModel() {
    if (!selectedModel) return;
    setSavingModel(true);
    setFeedback(null);
    try {
      const updated = await adminApi.updateGeminiModel(selectedModel);
      setModelConfig(updated);
      setSelectedModel(updated.model);
      setFeedback({
        tone: "success",
        text: `New answers will use ${modelLabel(updated.model)}.`,
      });
    } catch (error) {
      setFeedback({
        tone: "error",
        text: error instanceof Error ? error.message : "Could not save the chat model.",
      });
    } finally {
      setSavingModel(false);
    }
  }

  const activeCount = data?.active_count ?? 0;
  const totalCount = data?.keys.length ?? 0;
  const autoSwitch = data?.auto_switch ?? true;
  const selectedModelChanged = !!modelConfig && selectedModel !== modelConfig.model;

  return (
    <section className={`${ADMIN_CARD} p-6`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-[#5A5A5A]" />
            <h2 className="text-[16px] font-bold text-[#111111]">Gemini key pool</h2>
          </div>
          <p className="mt-1 text-[13px] text-[#5A5A5A]">
            Keys share the chat load. When one hits a limit, it cools down and the next
            healthy key takes over.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void toggleAutoSwitch()}
            disabled={!data || savingAutoSwitch}
            aria-pressed={autoSwitch}
            aria-busy={savingAutoSwitch}
            aria-label={`Auto-switch ${autoSwitch ? "on" : "off"}`}
            title="Switch to the next healthy key when one hits a limit"
            className="inline-flex h-9 items-center gap-2.5 rounded-lg border border-[#DADADA] bg-white px-3 text-[12px] font-semibold text-[#111111] transition-[border-color,background-color,box-shadow] duration-200 ease-out hover:border-[#B9B9B9] hover:bg-[#F7F7F7] disabled:cursor-wait disabled:hover:border-[#DADADA] disabled:hover:bg-white motion-reduce:transition-none"
          >
            <span
              aria-hidden="true"
              className={`relative h-[18px] w-8 shrink-0 rounded-full transition-colors duration-200 ease-out motion-reduce:transition-none ${
                autoSwitch ? "bg-emerald-500" : "bg-[#CFCFCF]"
              }`}
            >
              <span
                className={`absolute left-0.5 top-0.5 size-3.5 rounded-full bg-white shadow-[0_1px_2px_rgba(17,17,17,0.22)] transition-transform duration-200 ease-out motion-reduce:transition-none ${
                  autoSwitch ? "translate-x-3.5" : "translate-x-0"
                }`}
              />
            </span>
            <span>Auto-switch</span>
            <span
              aria-hidden="true"
              className="relative flex h-4 w-7 items-center justify-end overflow-hidden text-[11px] font-semibold"
            >
              <span
                className={`absolute right-0 text-emerald-700 transition-[transform,opacity] duration-200 ease-out motion-reduce:transition-none ${
                  autoSwitch ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0"
                }`}
              >
                On
              </span>
              <span
                className={`absolute right-0 text-[#6F6F6F] transition-[transform,opacity] duration-200 ease-out motion-reduce:transition-none ${
                  autoSwitch ? "translate-y-3 opacity-0" : "translate-y-0 opacity-100"
                }`}
              >
                Off
              </span>
            </span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          role="status"
          className={`mt-4 flex items-start gap-2 rounded-lg border p-3 text-[12.5px] ${
            feedback.tone === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-[#ECD2CB] bg-[#FBF5F4] text-[#9D4C38]"
          }`}
        >
          {feedback.tone === "success" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      <div className="mt-5 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-[240px] flex-1">
            <label className="mb-1.5 block text-[13px] font-semibold text-[#111111]">
              Chat model
            </label>
            <AppSelect
              aria-label="Chat model"
              value={selectedModel}
              onValueChange={setSelectedModel}
              options={modelOptions}
              disabled={loading || modelOptions.length === 0}
              placeholder={loading ? "Loading models…" : "Select a model"}
              contentClassName="!max-h-80"
            />
          </div>
          <button
            type="button"
            onClick={() => void saveModel()}
            disabled={!selectedModelChanged || savingModel}
            className={ADMIN_BTN_SECONDARY}
          >
            <Save className="h-4 w-4" />
            {savingModel ? "Saving…" : "Save model"}
          </button>
        </div>
        <p className="mt-2 text-[12px] text-[#6F6F6F]">
          Embeddings keep the fixed model; changing it would require re-indexing Qdrant.
          {activeCount > 0 && modelConfig?.available_models.length
            ? ` ${modelConfig.available_models.length} chat models are visible to active keys.`
            : " Add a key to validate the models it can serve."}
        </p>
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-[#E5E5E5] bg-white">
        <div
          className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 ${
            keysExpanded ? "border-b border-[#F0F0F0]" : ""
          }`}
        >
          <h3 className="min-w-0 text-[13.5px] font-bold text-[#111111]">
            <button
              type="button"
              onClick={() => setKeysExpanded((current) => !current)}
              aria-expanded={keysExpanded}
              aria-controls="gemini-key-list"
              title={keysExpanded ? "Collapse API keys" : "Expand API keys"}
              className="flex min-w-0 cursor-pointer items-center gap-2 rounded-md text-left outline-none transition-colors hover:text-[#5A5A5A] focus-visible:ring-2 focus-visible:ring-[#111111]/10"
            >
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-[#6F6F6F] transition-transform ${
                  keysExpanded ? "rotate-180" : ""
                }`}
              />
              <span>API keys</span>
              {data && (
                <span className="rounded-full border border-[#DADADA] bg-[#F7F7F7] px-2 py-0.5 text-[11.5px] font-semibold text-[#5A5A5A]">
                  {activeCount} active / {totalCount}
                </span>
              )}
            </button>
          </h3>
          <button type="button" onClick={openCreate} className={ADMIN_BTN_PRIMARY}>
            <Plus className="h-4 w-4" />
            Add key
          </button>
        </div>
        <div
          id="gemini-key-list"
          hidden={!keysExpanded}
          className="max-h-[22rem] overflow-y-auto p-2"
        >
        {loading ? (
          <p className="p-6 text-center text-[13px] text-[#5A5A5A]">
            Loading keys…
          </p>
        ) : !data || data.keys.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#CFCFCF] bg-[#FAFAFA] p-8 text-center">
            <KeyRound className="mx-auto h-6 w-6 text-[#9A9A9A]" />
            <p className="mt-2 text-[13.5px] font-semibold text-[#111111]">No Gemini keys yet</p>
            <p className="mx-auto mt-1 max-w-md text-[12.5px] text-[#5A5A5A]">
              Add your Gemini API key. It is validated, encrypted, and used for chat. The
              environment key is only a fallback until a database key is active.
            </p>
            <button type="button" onClick={openCreate} className={`${ADMIN_BTN_PRIMARY} mx-auto mt-4`}>
              <Plus className="h-4 w-4" />
              Add the first key
            </button>
          </div>
        ) : (
          <ul className="space-y-2">
            {data.keys.map((key) => {
              const status = STATUS_META[key.status] ?? STATUS_META.paused;
              const cooling = key.status === "cooldown" ? cooldownLabel(key.cooldown_until) : "";
              const expanded = expandedKeys.has(key.id);
              const detailsId = `gemini-key-${key.id}`;
              return (
                <li
                  key={key.id}
                  className="overflow-hidden rounded-lg border border-[#E5E5E5] bg-white"
                >
                  <button
                    type="button"
                    onClick={() => toggleKeyExpanded(key.id)}
                    aria-expanded={expanded}
                    aria-controls={detailsId}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-[#FAFAFA]"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-[#EEEEEE] bg-[#FAFAFA] text-[#6F6F6F]">
                      <KeyRound className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-[13px] font-semibold text-[#111111]">
                          {key.name}
                        </span>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10.5px] font-semibold ${status.className}`}
                        >
                          {status.label}
                        </span>
                        {cooling && (
                          <span className="text-[11px] font-medium text-amber-700">
                            {cooling}
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block truncate font-mono text-[11.5px] text-[#6F6F6F]">
                        {key.masked_key}
                      </span>
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-[#8A8A8A] transition-transform ${
                        expanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {expanded && (
                    <div id={detailsId} className="border-t border-[#F0F0F0] px-3 py-3">
                      <div className="grid gap-2 text-[12px] text-[#5A5A5A] sm:grid-cols-2">
                        <p>
                          Last used:{" "}
                          <span className="font-medium text-[#111111]">
                            {formatTime(key.last_used_at)}
                          </span>
                        </p>
                        <p>
                          Models:{" "}
                          <span className="font-medium text-[#111111]">
                            {key.available_models.length}
                          </span>
                        </p>
                      </div>
                      {key.last_error && (
                        <p className="mt-2 flex items-start gap-1.5 text-[12px] text-[#9D4C38]">
                          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          <span className="line-clamp-2">{key.last_error}</span>
                        </p>
                      )}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => void testKey(key)}
                          disabled={testingId === key.id}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#DADADA] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[#111111] transition-colors hover:bg-[#F7F7F7] disabled:opacity-50"
                        >
                          <RefreshCw
                            className={`h-3.5 w-3.5 ${testingId === key.id ? "animate-spin" : ""}`}
                          />
                          {testingId === key.id ? "Testing…" : "Test"}
                        </button>
                        <button
                          type="button"
                          onClick={() => void toggleKey(key)}
                          disabled={togglingId === key.id}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#DADADA] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[#111111] transition-colors hover:bg-[#F7F7F7] disabled:opacity-50"
                        >
                          {key.status === "paused" ? (
                            <Play className="h-3.5 w-3.5" />
                          ) : (
                            <Pause className="h-3.5 w-3.5" />
                          )}
                          {key.status === "paused" ? "Activate" : "Pause"}
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(key)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#DADADA] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[#111111] transition-colors hover:bg-[#F7F7F7]"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(key)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#ECD2CB] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[#9D4C38] transition-colors hover:bg-[#FBF5F4]"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        </div>
        {keysExpanded && data?.env_configured && (
          <p className="border-t border-[#F0F0F0] px-4 py-3 text-[12px] text-[#6F6F6F]">
            Environment fallback <code className="font-mono">GEMINI_API_KEY</code> is also
            configured. It is used only when no database key is healthy.
          </p>
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editing ? "Edit Gemini key" : "Add Gemini key"}
        subtitle={
          editing
            ? "Change the key name. The stored secret cannot be displayed."
            : "The key is validated with Gemini, encrypted, and never shown again."
        }
        widthClass="max-w-lg"
      >
        <form onSubmit={(event) => void saveKey(event)} className="space-y-4">
          <label className="block text-[13px] font-semibold text-[#111111]">
            Name
            <input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Primary key"
              className={`${ADMIN_INPUT} mt-1.5`}
              required
              maxLength={100}
            />
          </label>

          {editing ? (
            <div>
              <span className="block text-[13px] font-semibold text-[#111111]">Stored key</span>
              <p className="mt-1.5 rounded-[10px] border border-[#E5E5E5] bg-[#FAFAFA] px-3 py-2 font-mono text-[12.5px] text-[#5A5A5A]">
                {editing.masked_key}
              </p>
            </div>
          ) : (
            <label className="block text-[13px] font-semibold text-[#111111]">
              API key
              <input
                type="password"
                value={form.apiKey}
                onChange={(event) => setForm({ ...form, apiKey: event.target.value })}
                placeholder="AIza…"
                className={`${ADMIN_INPUT} mt-1.5 font-mono`}
                autoComplete="off"
                spellCheck={false}
                required
                maxLength={500}
              />
            </label>
          )}

          {formError && (
            <p
              role="alert"
              className="rounded-lg border border-[#ECD2CB] bg-[#FBF5F4] p-2.5 text-[12.5px] text-[#9D4C38]"
            >
              {formError}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={closeModal}
              disabled={savingKey}
              className={ADMIN_BTN_SECONDARY}
            >
              Cancel
            </button>
            <button type="submit" disabled={savingKey} className={ADMIN_BTN_PRIMARY}>
              {savingKey ? "Saving…" : editing ? "Save changes" : "Add key"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleting}
        title="Delete Gemini key?"
        description={
          deleting ? (
            <>
              <span className="font-semibold text-[#111111]">{deleting.name}</span> (
              <span className="font-mono">{deleting.masked_key}</span>) will be removed from the
              rotation. Requests will use the remaining keys or the environment fallback.
            </>
          ) : (
            ""
          )
        }
        confirmLabel="Delete key"
        tone="danger"
        busyLabel="Deleting…"
        onConfirm={deleteKey}
        onCancel={() => setDeleting(null)}
      />
    </section>
  );
}
