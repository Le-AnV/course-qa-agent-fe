"use client";

import * as React from "react";
import { ExternalLink } from "lucide-react";
import type { ClassInfo } from "@/lib/student-api";
import { normalizeLegacySchedule } from "@/lib/markdown";
import { MarkdownContent } from "@/components/shared/MarkdownContent";
import { cn } from "@/lib/utils";

/** True when the teacher has filled in at least one part of the class page. */
export function hasClassInfo(info: ClassInfo | null): boolean {
  if (!info) return false;
  return Boolean(
    info.description || info.meeting_url || info.group_url || info.schedule_note || info.note,
  );
}

const MARKDOWN_BASE =
  "[&_p]:text-[13.5px] [&_p]:leading-relaxed [&_li]:text-[13.5px] [&_ul]:text-[13.5px] [&_ol]:text-[13.5px]";

const MARKDOWN_CLASS = cn("max-w-[88ch]", MARKDOWN_BASE);

// Schedule text is teacher-authored and can grow unpredictably; stack its
// subsections vertically instead of splitting them into columns.
const SCHEDULE_MARKDOWN_CLASS = cn("max-w-none", MARKDOWN_BASE);

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border-b border-[#D5D5D5] pb-4 last:border-b-0 last:pb-0">
      <dt className="text-[12.5px] font-semibold text-[#5A5A5A]">{label}</dt>
      <dd className="mt-1.5 min-w-0 text-[13.5px] leading-relaxed text-[#111111]">{value}</dd>
    </div>
  );
}

function ExternalLinkValue({ href, label }: { href: string; label?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 font-semibold text-[#111111] underline decoration-[#CFCFCF] underline-offset-2 hover:decoration-[#111111]"
    >
      {label ?? href}
      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-[#6F6F6F]" />
    </a>
  );
}

/** Read-only rendering of the class page — empty parts are skipped, never blank rows. */
export function ClassInfoRows({ info }: { info: ClassInfo }) {
  const rows: { label: string; value: React.ReactNode }[] = [];

  if (info.description) {
    rows.push({
      label: "Description",
      value: <MarkdownContent content={info.description} className={MARKDOWN_CLASS} />,
    });
  }
  if (info.meeting_url) {
    rows.push({ label: "Online class", value: <ExternalLinkValue href={info.meeting_url} /> });
  }
  if (info.group_url) {
    rows.push({ label: "Class group", value: <ExternalLinkValue href={info.group_url} /> });
  }
  if (info.schedule_note) {
    rows.push({
      label: "Schedule",
      value: (
        <MarkdownContent
          content={normalizeLegacySchedule(info.schedule_note)}
          className={SCHEDULE_MARKDOWN_CLASS}
        />
      ),
    });
  }
  if (info.note) {
    rows.push({
      label: "More information",
      value: <MarkdownContent content={info.note} className={MARKDOWN_CLASS} />,
    });
  }

  return (
    <dl className="space-y-4">
      {rows.map((row) => (
        <InfoRow key={row.label} label={row.label} value={row.value} />
      ))}
    </dl>
  );
}

export function ClassInfoCard({
  info,
  title = "Class information",
  action,
  emptyMessage = "No class information yet.",
}: {
  info: ClassInfo | null;
  title?: string;
  action?: React.ReactNode;
  emptyMessage?: string;
}) {
  return (
    <section className="rounded-lg border border-[#DADADA] bg-white p-5 md:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <h3 className="text-[14px] font-bold text-[#111111]">{title}</h3>
        {action}
      </div>
      {hasClassInfo(info) && info ? (
        <ClassInfoRows info={info} />
      ) : (
        <p className="text-[13px] text-[#5A5A5A]">{emptyMessage}</p>
      )}
    </section>
  );
}
