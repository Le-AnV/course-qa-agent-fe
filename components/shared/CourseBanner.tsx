"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface CourseBannerProps {
  /** Null while the class detail is still loading — renders a placeholder bar. */
  title: string | null;
  backHref: string;
  backLabel?: string;
  accentColor?: string;
  teacherName?: string;
  /** Chip mã lớp + kỳ, vd "CS 401 · Fall 2026" */
  meta?: string;
}

/**
 * Banner workspace: MỘT chiều cao duy nhất cho mọi tab (đổi tab không nảy).
 * Grid 3 cột cân ([112px_1fr_112px]): trái = back, giữa = tên lớp căn giữa,
 * phải = giáo viên góc phải. 2 biên rộng bằng nhau nên title luôn chính giữa,
 * tên lớp dài chỉ truncate trong cột giữa, không đẩy lệch layout.
 */
export function CourseBanner({
  title,
  backHref,
  backLabel = "My Classes",
  accentColor = "#FFFFFF",
  teacherName,
  meta,
}: CourseBannerProps) {
  return (
    <div
      className="relative w-full border-b border-[#DADADA] overflow-hidden select-none shrink-0"
      style={{ backgroundColor: accentColor }}
    >
      <div className="relative z-10 grid grid-cols-[88px_minmax(0,1fr)_88px] sm:grid-cols-[128px_minmax(0,1fr)_128px] items-center gap-2 px-4 py-1.5 md:px-6">
        {/* Trái: back — rộng cố định để title luôn giữa */}
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-[12px] font-medium text-[#111111] hover:underline min-w-0"
          title={backLabel}
        >
          <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:inline truncate">{backLabel}</span>
        </Link>

        {/* Giữa: tên lớp + mã lớp/kỳ trên MỘT dòng để banner thấp nhất */}
        <div className="flex min-w-0 items-baseline justify-center gap-2 text-center">
          {/* A skeleton instead of a generic "Class workspace" label: the class
              name arrives a beat after mount and a text swap reads as a flash. */}
          {title ? (
            <h1 className="min-w-0 truncate text-[15px] md:text-[16px] font-bold tracking-tight text-[#111111] leading-snug">
              {title}
            </h1>
          ) : (
            <div
              aria-hidden
              className="h-[20px] w-40 skeleton-shimmer rounded bg-black/5 md:h-[21px]"
            />
          )}
          {meta && (
            <>
              <span
                aria-hidden
                className="hidden lg:inline text-[14px] md:text-[15px] font-normal text-[#BDBDBD]"
              >
                |
              </span>
              <span className="hidden lg:inline max-w-[240px] truncate text-[14px] md:text-[15px] font-bold tracking-tight text-[#111111]">
                {meta}
              </span>
            </>
          )}
        </div>

        {/* Phải: giáo viên góc phải, rộng cố định; mobile giữ chỗ để không lệch giữa */}
        <div className="min-w-0 text-right">
          <p
            className="hidden sm:block truncate text-[10.5px] leading-none"
            title={teacherName ? `Teacher: ${teacherName}` : undefined}
          >
            <span className="font-medium text-[#94a3b8]">Teacher: </span>
            <span className="font-semibold text-[#111111]">{teacherName ?? "—"}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
