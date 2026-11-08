"use client";

import * as React from "react";
import { FileSpreadsheet, LoaderCircle, Upload } from "lucide-react";
import { toast } from "sonner";
import { quizApi, type QuizDetail, type QuizImportPreview } from "@/lib/quiz-api";
import { QuizList } from "@/features/quizzes/quiz-list";
import { ClassPageHeader } from "@/components/shared/ClassPageHeader";

const MAX_FILE_BYTES = 10 * 1024 * 1024;

export function QuizExcelImport({ classId }: { classId: string }) {
  const [file, setFile] = React.useState<File | null>(null);
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [preview, setPreview] = React.useState<QuizImportPreview | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [createdTitle, setCreatedTitle] = React.useState("");
  const [lastImported, setLastImported] = React.useState<QuizDetail | null>(null);
  const [refreshToken, setRefreshToken] = React.useState(0);
  const [fileInputKey, setFileInputKey] = React.useState(0);

  function selectFile(selected: File | null) {
    setFile(selected);
    setPreview(null);
    setCreatedTitle("");
    if (!selected) return;
    if (!selected.name.toLowerCase().endsWith(".xlsx")) {
      setFile(null);
      toast.error("Choose an .xlsx file.");
    } else if (selected.size > MAX_FILE_BYTES) {
      setFile(null);
      toast.error("The file must be 10 MB or smaller.");
    } else if (!title.trim()) {
      // The import button needs a title; prefill it so a picked file is enough.
      setTitle(selected.name.replace(/\.xlsx$/i, ""));
    }
  }

  async function previewFile() {
    if (!file) return;
    setLoading(true);
    setCreatedTitle("");
    try {
      setPreview(await quizApi.previewImport(classId, file));
    } catch (error) {
      const detail = (error as Error & { detail?: unknown }).detail;
      if (detail && typeof detail === "object" && "errors" in detail) {
        setPreview(detail as QuizImportPreview);
      } else {
        toast.error(error instanceof Error ? error.message : "Could not validate this file.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function importFile() {
    if (!file || !preview?.valid || !title.trim()) return;
    setLoading(true);
    try {
      const quiz = await quizApi.importQuiz(classId, file, title.trim(), description.trim());
      setCreatedTitle(quiz.title);
      setLastImported(quiz);
      setRefreshToken((value) => value + 1);
      // Clear the upload form so the freshly imported quiz list is what the
      // teacher sees next, with the new quiz already expanded.
      setFile(null);
      setPreview(null);
      setTitle("");
      setDescription("");
      setFileInputKey((value) => value + 1);
      toast.success("Quiz imported as a draft.");
    } catch (error) {
      const detail = (error as Error & { detail?: unknown }).detail;
      if (detail && typeof detail === "object" && "errors" in detail) {
        setPreview(detail as QuizImportPreview);
      } else {
        toast.error(error instanceof Error ? error.message : "Could not import this quiz.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-6 pb-10">
      <ClassPageHeader
        title="Import from Excel"
        subtitle="Upload an .xlsx question bank, check the validation results, then create a draft for teacher review."
      />

      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">
            Quiz title <span className="text-red-600">*</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={255}
              className="mt-1.5 h-10 w-full rounded-md border border-slate-300 px-3 font-normal outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              placeholder="e.g. Chapter 1 review"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Description <span className="font-normal text-slate-500">(optional)</span>
            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="mt-1.5 h-10 w-full rounded-md border border-slate-300 px-3 font-normal outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              placeholder="What this quiz covers"
            />
          </label>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <FileSpreadsheet className="size-4" />
            {file?.name ?? "Choose .xlsx file"}
            <input
              key={fileInputKey}
              type="file"
              accept=".xlsx"
              className="sr-only"
              onChange={(event) => selectFile(event.target.files?.[0] ?? null)}
            />
          </label>
          <button
            type="button"
            disabled={!file || loading}
            onClick={previewFile}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? <LoaderCircle className="size-4 animate-spin" /> : <Upload className="size-4" />}
            Validate and preview
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => void quizApi.downloadTemplate(classId).catch((error) => toast.error(error.message))}
            className="h-10 rounded-md px-3 text-sm font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-50"
          >
            Download template
          </button>
          <span className="text-xs text-slate-500">.xlsx only · maximum 10 MB · up to 1,000 questions</span>
        </div>
      </div>

      {preview && (
        <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-slate-900">Import preview</h2>
              <p className="mt-1 text-sm text-slate-600">
                {preview.valid ? `${preview.questions.length} questions are ready.` : "Fix the listed errors and validate the file again."}
              </p>
            </div>
            <button
              type="button"
              disabled={!preview.valid || !title.trim() || loading || Boolean(createdTitle)}
              onClick={importFile}
              className="h-10 rounded-md bg-blue-700 px-4 text-sm font-medium text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Import as draft
            </button>
          </div>

          {preview.valid && !title.trim() && (
            <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Add a quiz title above to enable import.
            </p>
          )}

          {preview.errors.length > 0 && (
            <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3">
              <h3 className="text-sm font-semibold text-red-900">Import blocked ({preview.errors.length})</h3>
              <ul className="mt-2 space-y-1 text-sm text-red-800">
                {preview.errors.map((issue, index) => (
                  <li key={`${issue.row_index}-${issue.column}-${index}`}>
                    {issue.row_index > 0 ? `Row ${issue.row_index}` : "File"}{issue.column ? ` · ${issue.column}` : ""}: {issue.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {preview.warnings.length > 0 && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <h3 className="font-semibold">Warnings — you can continue</h3>
              <ul className="mt-2 space-y-1">
                {preview.warnings.map((issue, index) => (
                  <li key={`${issue.row_index}-${issue.column}-${index}`}>
                    Row {issue.row_index}{issue.column ? ` · ${issue.column}` : ""}: {issue.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {preview.valid && (
            <ol className="divide-y divide-slate-100 rounded-md border border-slate-200">
              {preview.questions.map((question, index) => (
                <li key={`${index}-${question.question}`} className="p-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span>Question {index + 1}</span>
                    <span>·</span><span>{question.question_type.replaceAll("_", " ")}</span>
                    <span>·</span><span>{question.points} point{question.points === 1 ? "" : "s"}</span>
                    <span>·</span><span>{question.difficulty}</span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-900">{question.question}</p>
                  {question.options.length > 0 && (
                    <ul className="mt-2 grid gap-1 text-sm text-slate-700 sm:grid-cols-2">
                      {question.options.map((option) => (
                        <li key={option.option_label} className="flex items-start gap-2">
                          <span
                            className={
                              option.is_correct
                                ? "mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-green-700 text-[11px] font-bold text-green-900"
                                : "mt-0.5 inline-flex size-5 shrink-0 items-center justify-center text-[11px] font-semibold text-slate-400"
                            }
                          >
                            {option.option_label}
                          </span>
                          <span
                            className={
                              option.is_correct
                                ? "font-semibold text-green-950"
                                : "text-slate-700"
                            }
                          >
                            {option.option_text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {question.correct_answers.length > 0 && (
                    <p className="mt-2 text-sm text-slate-600">
                      Accepted answers:{" "}
                      <span className="font-semibold text-green-900">
                        {question.correct_answers.join(", ")}
                      </span>
                    </p>
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      {createdTitle && (
        <p role="status" className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
          “{createdTitle}” was created as a draft. It still needs teacher review.
        </p>
      )}

      <QuizList classId={classId} refreshToken={refreshToken} lastImported={lastImported} />
    </section>
  );
}
