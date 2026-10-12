"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface CourseTabItem {
  id: string;
  label: string;
  href: string;
}

export function CourseTabs({ tabs }: { tabs: CourseTabItem[] }) {
  const pathname = usePathname();

  return (
    <div className="w-full bg-white border-b border-[#E2E8F0] shrink-0 overflow-x-auto">
      <div className="flex items-center gap-6 px-6 md:px-10 lg:px-10 min-w-max">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={cn(
                "py-3 text-[13.5px] whitespace-nowrap border-b-2 transition-all",
                isActive
                  ? "border-[#2563EB] text-[#2563EB] font-semibold"
                  : "border-transparent text-[#64748B] hover:text-[#172033] font-medium"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
