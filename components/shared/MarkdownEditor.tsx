"use client";

import * as React from "react";
import {
  Bold,
  Eye,
  Heading2,
  Italic,
  Link2,
  List,
  ListOrdered,
  PencilLine,
} from "lucide-react";
import { MarkdownContent } from "@/components/shared/MarkdownContent";
import { applyMarkdownFormat, type MarkdownFormat } from "@/lib/markdown-edit";
import { cn } from "@/lib/utils";

const TOOLS: { format: MarkdownFormat; label: string; icon: React.ReactNode }[] = [
  { format: "heading", label: "Heading", icon: <Heading2 className="h-3.5 w-3.5" /> },
  { format: "bold", label: "Bold", icon: <Bold className="h-3.5 w-3.5" /> },
  { format: "italic", label: "Italic", icon: <Italic className="h-3.5 w-3.5" /> },
  { format: "bullet", label: "Bullet list", icon: <List className="h-3.5 w-3.5" /> },
  { format: "ordered", label: "Numbered list", icon: <ListOrdered className="h-3.5 w-3.5" /> },
  { format: "link", label: "Link", icon: <Link2 className="h-3.5 w-3.5" /> },
];

type EditorSnapshot = {
  value: string;
  start: number;
  end: number;
};

export function MarkdownEditor({
  id,
  value,
  onChange,
  placeholder,
  maxLength,
  maxHeight = 320,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  maxHeight?: number;
}) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [preview, setPreview] = React.useState(false);
  const historyRef = React.useRef<EditorSnapshot[]>([]);
  const futureRef = React.useRef<EditorSnapshot[]>([]);
  const lastInternalValue = React.useRef(value);
  const typingGroup = React.useRef<{ at: number } | null>(null);

  React.useEffect(() => {
    const el = textareaRef.current;
    if (!el || preview) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  }, [value, preview, maxHeight]);

  React.useEffect(() => {
    if (value === lastInternalValue.current) return;
    // A reset or a different class's content replaced the draft: old undo
    // entries would restore text that no longer belongs to this field.
    historyRef.current = [];
    futureRef.current = [];
    typingGroup.current = null;
    lastInternalValue.current = value;
  }, [value]);

  const restoreSelection = (snapshot: EditorSnapshot) => {
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.focus();
      const start = Math.min(snapshot.start, snapshot.value.length);
      const end = Math.min(snapshot.end, snapshot.value.length);
      el.setSelectionRange(start, end);
    });
  };

  const pushHistory = (
    snapshot: EditorSnapshot,
    kind: "typing" | "command",
    at: number,
  ) => {
    const mergeTyping =
      kind === "typing" && typingGroup.current !== null && at - typingGroup.current.at < 900;
    if (!mergeTyping) {
      historyRef.current.push(snapshot);
      if (historyRef.current.length > 100) historyRef.current.shift();
    }
    futureRef.current = [];
    typingGroup.current = kind === "typing" ? { at } : null;
  };

  const commitValue = (
    next: string,
    start: number,
    end: number,
    kind: "typing" | "command",
    at: number,
  ) => {
    if (next === lastInternalValue.current) return;
    const el = textareaRef.current;
    pushHistory(
      {
        value: lastInternalValue.current,
        start: el?.selectionStart ?? lastInternalValue.current.length,
        end: el?.selectionEnd ?? lastInternalValue.current.length,
      },
      kind,
      at,
    );
    lastInternalValue.current = next;
    onChange(next);
    if (kind === "command") {
      restoreSelection({ value: next, start, end });
    }
  };

  const undo = () => {
    const previous = historyRef.current.pop();
    if (!previous) return;
    const el = textareaRef.current;
    const current = lastInternalValue.current;
    futureRef.current.push({
      value: current,
      start: el?.selectionStart ?? current.length,
      end: el?.selectionEnd ?? current.length,
    });
    lastInternalValue.current = previous.value;
    typingGroup.current = null;
    onChange(previous.value);
    restoreSelection(previous);
  };

  const redo = () => {
    const next = futureRef.current.pop();
    if (!next) return;
    const el = textareaRef.current;
    const current = lastInternalValue.current;
    historyRef.current.push({
      value: current,
      start: el?.selectionStart ?? current.length,
      end: el?.selectionEnd ?? current.length,
    });
    if (historyRef.current.length > 100) historyRef.current.shift();
    lastInternalValue.current = next.value;
    typingGroup.current = null;
    onChange(next.value);
    restoreSelection(next);
  };

  const formatSelection = (format: MarkdownFormat, at: number) => {
    const el = textareaRef.current;
    if (!el || preview) return;
    const result = applyMarkdownFormat(
      { value, start: el.selectionStart, end: el.selectionEnd },
      format,
    );
    commitValue(result.value, result.start, result.end, "command", at);
  };

  return (
    <div className="overflow-hidden rounded-lg border border-[#DADADA] bg-white focus-within:border-[#111111]">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-[#E5E5E5] bg-[#FAFAFA] px-1.5 py-1.5">
        <div role="toolbar" aria-label="Markdown formatting" className="flex flex-wrap items-center gap-0.5">
          {TOOLS.map((tool, index) => (
            <React.Fragment key={tool.format}>
              {index === 1 || index === 3 ? (
                <span aria-hidden="true" className="mx-0.5 h-4 w-px bg-[#DADADA]" />
              ) : null}
              <button
                type="button"
                title={tool.label}
                aria-label={tool.label}
                disabled={preview}
                onMouseDown={(event) => event.preventDefault()}
                onClick={(event) => formatSelection(tool.format, event.timeStamp)}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded text-[#5A5A5A] transition-colors hover:bg-white hover:text-[#111111]",
                  preview && "cursor-not-allowed opacity-40",
                )}
              >
                {tool.icon}
              </button>
            </React.Fragment>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setPreview((current) => !current)}
          aria-pressed={preview}
          className="ml-auto flex h-7 items-center gap-1.5 rounded px-2 text-[11.5px] font-semibold text-[#5A5A5A] transition-colors hover:bg-white hover:text-[#111111]"
        >
          {preview ? (
            <>
              <PencilLine className="h-3.5 w-3.5" />
              Write
            </>
          ) : (
            <>
              <Eye className="h-3.5 w-3.5" />
              Preview
            </>
          )}
        </button>
      </div>

      {preview ? (
        <div className="min-h-[120px] px-3 py-2.5">
          {value.trim() ? (
            <MarkdownContent
              content={value}
              className="text-[13px] [&_p]:text-[13px] [&_li]:text-[13px] [&_ul]:text-[13px] [&_ol]:text-[13px]"
            />
          ) : (
            <p className="text-[12.5px] text-[#6F6F6F]">Nothing to preview yet.</p>
          )}
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          id={id}
          rows={4}
          maxLength={maxLength}
          value={value}
          onChange={(event) => {
            const el = event.currentTarget;
            const next = el.value;
            commitValue(
              next,
              el.selectionStart ?? next.length,
              el.selectionEnd ?? next.length,
              "typing",
              event.timeStamp,
            );
          }}
          onKeyDown={(event) => {
            const modifier = event.ctrlKey || event.metaKey;
            if (!modifier) return;
            const key = event.key.toLowerCase();
            if (key === "z") {
              event.preventDefault();
              if (event.shiftKey) redo();
              else undo();
            } else if (key === "y") {
              event.preventDefault();
              redo();
            }
          }}
          placeholder={placeholder}
          style={{ maxHeight }}
          className="block min-h-[120px] w-full resize-none overflow-y-auto border-0 bg-white px-3 py-2.5 text-[13px] leading-relaxed text-[#111111] outline-none placeholder:text-[#9A9A9A]"
        />
      )}

      <div className="flex items-center justify-end border-t border-[#E5E5E5] bg-[#FAFAFA] px-2.5 py-1 text-[11px] text-[#6F6F6F]">
        {maxLength ? `${value.length}/${maxLength}` : `${value.length} characters`}
      </div>
    </div>
  );
}
