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
}

export function CourseBanner({
  title,
  backHref,
  backLabel = "My Classes",
  accentColor = "#EFF6FF",
  teacherName,
}: CourseBannerProps) {
  return (
    <div
      className="relative w-full border-b border-[#E2E8F0] overflow-hidden select-none shrink-0"
      style={{ backgroundColor: accentColor }}
    >
      {/* Subtle Dot Grid Background on the right */}
      <div 
        className="absolute inset-y-0 right-0 w-1/3 opacity-30" 
        style={{
          backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)',
          backgroundSize: '16px 16px'
        }}
      />
      
      <div className="relative z-10 px-6 py-5 md:px-10 lg:px-10 md:py-6">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[#2563EB] hover:underline mb-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {backLabel}
        </Link>
        <h1 className="text-[22px] md:text-[26px] font-bold tracking-tight text-[#172033]">
          {title}
        </h1>
        {teacherName && (
          <p className="text-[14px] text-[#64748B] mt-1 font-medium">
            Teacher: <span className="text-[#334155]">{teacherName}</span>
          </p>
        )}
      </div>
    </div>
  );
}
