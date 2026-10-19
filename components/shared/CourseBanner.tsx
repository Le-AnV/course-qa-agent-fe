"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface CourseBannerProps {
  title: string;
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
      <div className="relative z-10 grid grid-cols-[112px_minmax(0,1fr)_112px] items-center gap-2 px-4 py-2.5 md:px-6">
        {/* Trái: back — rộng cố định để title luôn giữa */}
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-[12.5px] font-medium text-[#111111] hover:underline min-w-0"
          title={backLabel}
        >
          <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:inline truncate">{backLabel}</span>
        </Link>

        {/* Giữa: tên lớp to, căn giữa; mã lớp nhỏ bên dưới */}
        <div className="min-w-0 text-center">
          <h1 className="text-[18px] md:text-[20px] font-bold tracking-tight text-[#111111] truncate leading-snug">
            {title}
          </h1>
          {meta && (
            <p className="text-[11px] font-medium text-[#5A5A5A] truncate mt-0.5">
              {meta}
            </p>
          )}
        </div>

        {/* Phải: giáo viên góc phải, rộng cố định; mobile giữ chỗ để không lệch giữa */}
        <div className="min-w-0 text-right">
          <p className="hidden sm:block text-[10px] font-medium text-[#94a3b8] leading-none mb-1">
            Teacher
          </p>
          <p className="hidden sm:block truncate text-[12.5px] font-semibold text-[#111111] leading-none">
            {teacherName ?? "—"}
          </p>
        </div>
      </div>
    </div>
  );
}
