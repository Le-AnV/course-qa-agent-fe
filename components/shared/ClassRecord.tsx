"use client";

import type { ReactNode } from "react";
import { BookOpen, FileText, Users } from "lucide-react";
import { accentFor, termFor, type StudentClass } from "@/lib/student-api";

type ClassRecordRole = "teacher" | "student";

function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: ReactNode;
  icon: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-1 text-center md:flex-row md:items-center md:gap-2.5 md:text-left">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-white/15 bg-white/10 text-[#D6E5F3] md:h-7 md:w-7">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="truncate text-[10px] font-medium text-[#D6E5F3] md:text-[11px]">{label}</p>
        <p className="text-[15px] font-bold leading-tight tabular-nums text-white md:text-[17px]">{value}</p>
      </div>
    </div>
  );
}

export function ClassRecord({
  cls,
  role,
}: {
  cls: StudentClass | null;
  role: ClassRecordRole;
}) {
  if (!cls) return <ClassRecordSkeleton />;

  return (
    <section
      aria-labelledby="class-overview-title"
      className="relative isolate overflow-hidden rounded-xl border border-[#45698B] border-l-4 bg-[linear-gradient(112deg,#294D72_0%,#365F85_68%,#47759A_100%)] shadow-[0_8px_24px_rgba(23,51,83,0.12)]"
      style={{ borderLeftColor: accentFor(cls.id) }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-[58%]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.09) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.09) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          maskImage: "linear-gradient(to right, transparent, black 46%)",
          WebkitMaskImage: "linear-gradient(to right, transparent, black 46%)",
        }}
      />
      <div className="relative z-10 flex flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:gap-6 md:px-5 md:py-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
            <span className="inline-flex items-center rounded-md border border-white/20 bg-white/10 px-2.5 py-1 text-[11.5px] font-bold tracking-[0.04em] text-[#E5EFF8]">
              {cls.code}
            </span>
            <h2
              id="class-overview-title"
              className="max-w-full text-balance text-[26px] font-bold font-heading leading-tight text-white md:text-[28px]"
            >
              {cls.name}
            </h2>
          </div>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[12.5px] text-[#D6E5F3]">
            <span>{termFor(cls)}</span>
            <span aria-hidden="true">{"\u00B7"}</span>
            <span>
              <span className="font-medium">{role === "teacher" ? "Teacher: " : "Trainer: "}</span>
              <span className="font-semibold text-white">
                {cls.trainer_name ?? "\u2014"}
              </span>
            </span>
          </p>
        </div>

        <div className="grid w-full grid-cols-3 gap-1.5 rounded-lg border border-white/20 bg-white/[0.08] p-2 shadow-[0_1px_2px_rgba(16,34,59,0.06)] backdrop-blur-sm md:w-auto md:shrink-0 md:gap-4 md:p-3">
          <Stat
            label="Resources"
            value={cls.document_count}
            icon={<FileText className="h-4 w-4" />}
          />
          <Stat
            label="Members"
            value={cls.member_count}
            icon={<Users className="h-4 w-4" />}
          />
          <Stat label="Credits" value={cls.credits} icon={<BookOpen className="h-4 w-4" />} />
        </div>
      </div>
    </section>
  );
}

function ClassRecordSkeleton() {
  return (
    <section
      aria-hidden
      className="overflow-hidden rounded-xl border border-[#45698B] bg-[linear-gradient(112deg,#294D72_0%,#365F85_68%,#47759A_100%)] [--skeleton-sheen:rgba(255,255,255,0.08)]"
    >
      <div className="flex flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:gap-6 md:px-5 md:py-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="h-6 w-28 skeleton-shimmer rounded bg-white/10" />
            <div className="h-7 w-32 skeleton-shimmer rounded bg-white/15" />
          </div>
          <div className="mt-2 h-3 w-40 skeleton-shimmer rounded bg-white/15" />
        </div>
        <div className="grid w-full grid-cols-3 gap-1.5 rounded-lg border border-white/20 bg-white/[0.08] p-2 md:w-auto md:gap-4 md:p-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-1 md:flex-row md:items-center md:gap-2.5"
            >
              <div className="h-6 w-6 shrink-0 skeleton-shimmer rounded-md bg-white/10 md:h-7 md:w-7" />
              <div className="min-w-0 text-center md:text-left">
                <div className="mx-auto h-2.5 w-12 skeleton-shimmer rounded bg-white/10 md:mx-0" />
                <div className="mx-auto mt-1.5 h-4 w-6 skeleton-shimmer rounded bg-white/15 md:mx-0" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
