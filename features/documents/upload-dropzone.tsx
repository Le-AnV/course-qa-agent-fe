"use client";

import { useRef, useState } from "react";
import { FileUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ACCEPTED_TYPES,
  acceptedExtensions,
  formatFileSize,
  resolveDefaultClassId,
  validationError,
  type ClassOption,
} from "@/lib/documents";
import { AUTH_TOKEN_KEY } from "@/components/ui/nav-config";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type UploadState =
  | { status: "idle" }
  | { status: "uploading" }
  | { status: "done"; message: string }
  | { status: "error"; message: string };

export function UploadDropzone({
  classes,
  onUploaded,
}: {
  classes: ClassOption[];
  onUploaded?: () => void;
}) {
  // AI-41 (AC-01): derive the target class during render so it stays
  // valid when the async class list arrives after mount — uploads are
  // never tagged with a stale class, with no sync effect needed.
  const [chosenClassId, setChosenClassId] = useState(classes[0]?.id ?? "");
  const classId = resolveDefaultClassId(classes, chosenClassId);
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [state, setState] = useState<UploadState>({ status: "idle" });
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function takeFiles(chosen: File[]) {
    const problems = chosen
      .map(validationError)
      .filter((e): e is string => e !== null);
    setErrors(problems);
    setFiles(chosen);
    setState({ status: "idle" });
  }

  function onFilesChosen(chosen: FileList | null) {
    if (!chosen) return;
    takeFiles(Array.from(chosen));
  }

  function removeFile(index: number) {
    const next = files.filter((_, i) => i !== index);
    takeFiles(next);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function onUpload() {
    if (files.length === 0 || !classId) return;
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      setState({ status: "error", message: "Not authenticated. Please log in again." });
      return;
    }
    setState({ status: "uploading" });
    try {
      const form = new FormData();
      form.set("class_id", classId);
      for (const f of files) form.append("files", f);
      const res = await fetch(`${API_URL}/api/documents/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!res.ok) throw new Error(`Backend responded with ${res.status}`);
      const body = (await res.json()) as {
        uploaded: { file_name: string; error: string | null }[];
      };
      const failed = body.uploaded.filter((u) => u.error !== null);
      if (failed.length > 0) {
        setErrors(failed.map((f) => `${f.file_name}: ${f.error ?? "rejected"}`));
        setState({ status: "error", message: "Some files were rejected." });
      } else {
        setFiles([]);
        setErrors([]);
        if (inputRef.current) inputRef.current.value = "";
        setState({
          status: "done",
          message: "Upload successful. Files are pending approval.",
        });
        onUploaded?.();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed.";
      setState({
        status: "error",
        message:
          msg === "Failed to fetch"
            ? `Cannot reach backend at ${API_URL} — check the BE is running (docker compose up), or open this page via http://localhost:3000 (BE CORS only allows that origin).`
            : msg,
      });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload course materials</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Class</span>
          <Select value={classId} onValueChange={setChosenClassId}>
            <SelectTrigger aria-label="Choose a class">
              <SelectValue placeholder="Choose a class" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Files</span>
          <input
            ref={inputRef}
            id="document-upload-input"
            name="document-upload"
            type="file"
            multiple
            accept={acceptedExtensions().join(",")}
            onChange={(e) => onFilesChosen(e.target.files)}
            className="sr-only"
            aria-label="Choose files to upload"
            tabIndex={-1}
          />
          <div
            role="button"
            tabIndex={0}
            aria-label="Choose files to upload (click or drag and drop)"
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                inputRef.current?.click();
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              if (e.dataTransfer.files.length > 0) {
                takeFiles(Array.from(e.dataTransfer.files));
              }
            }}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors",
              "hover:border-primary hover:bg-accent/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              dragging
                ? "border-primary bg-accent"
                : "border-input bg-muted/30",
            )}
          >
            <FileUp className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm font-medium">
              Click to choose files, or drag and drop them here
            </p>
            <p className="text-xs text-muted-foreground">
              {acceptedExtensions().join(", ")} · max 100MB per file
            </p>
          </div>
          {files.length > 0 && (
            <ul className="flex flex-col gap-1 text-sm">
              {files.map((f, i) => (
                <li
                  key={`${f.name}-${f.size}`}
                  className="flex items-center justify-between gap-2 rounded-md border border-input px-3 py-1.5"
                >
                  <span className="truncate text-muted-foreground">
                    {f.name} ({formatFileSize(f.size)})
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    aria-label={`Remove ${f.name}`}
                    className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="text-sm text-muted-foreground">
          Accepted: {ACCEPTED_TYPES.map((t) => `${t.extension} (${t.label})`).join(", ")}.
          Max 100MB per file. Account import from Excel is a separate admin flow.
        </p>

        {errors.length > 0 && (
          <ul className="text-sm text-destructive">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        )}
        {state.status === "done" && <p className="text-sm">{state.message}</p>}
        {state.status === "error" && (
          <p className="text-sm text-destructive">{state.message}</p>
        )}

        <div>
          <Button
            type="button"
            onClick={onUpload}
            disabled={files.length === 0 || !classId || state.status === "uploading"}
            title={
              files.length === 0 ? "Choose files first" : undefined
            }
          >
            {state.status === "uploading" ? "Uploading..." : `Upload${files.length > 0 ? ` (${files.length})` : ""}`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
