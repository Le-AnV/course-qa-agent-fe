"use client";

import * as React from "react";
import Link from "next/link";
import { CourseBanner } from "@/components/shared/CourseBanner";
import { CourseTabs, CourseTabItem } from "@/components/shared/CourseTabs";
import { useParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { classesForRole, getClassById } from "@/lib/classes";

export default function StudentClassWorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const id = params.id as string;

  // Title/banner theo đúng lớp đang xem (trước đây cứng "Introduction to Artificial Intelligence").
  const cls = getClassById(id);
  const title = cls?.title ?? "Class workspace";
  const meta = cls ? `${cls.code} · ${cls.term}` : undefined;

  const tabs: CourseTabItem[] = [
    { id: "overview", label: "Overview", href: `/student/class/${id}/overview` },
    { id: "syllabus", label: "Syllabus", href: `/student/class/${id}/syllabus` },
    { id: "agent", label: "Q&A Agent", href: `/student/class/${id}/agent` },
    { id: "proposals", label: "My Proposals", href: `/student/class/${id}/proposals` },
    { id: "members", label: "Members", href: `/student/class/${id}/members` },
  ];

  // Trang agent chiếm full content: bỏ khung max-w-5xl,
  // các tab docs giữ layout cũ. Banner 1 chiều cao mọi tab nên đổi tab không nảy.
  const isAgentPage = pathname?.endsWith("/agent");

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC]">
      <CourseBanner
        title={title}
        backHref="/student/classes"
        accentColor="#EFF6FF"
        teacherName={cls?.teacherName ?? "Minh"}
        meta={meta}
      />
      <CourseTabs tabs={tabs} />

      {/* Mobile class-switcher: sidebar ẩn dưới lg nên cần chỗ đổi lớp nhanh.
          Sidebar đã có list đầy đủ — đây chỉ là chip chuyển lớp gọn. */}
      <ClassSwitcherChips currentId={id} />

      {isAgentPage ? (
        <div className="flex-1 min-h-0 overflow-hidden p-4 md:p-6">
          {children}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-5xl mx-auto">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

function ClassSwitcherChips({ currentId }: { currentId: string }) {
  const myClasses = classesForRole("student");
  if (myClasses.length < 2) return null;

  return (
    <div className="flex lg:hidden items-center gap-2 overflow-x-auto px-4 py-2 bg-white border-b border-[#E2E8F0] shrink-0">
      {myClasses.map((c) => {
        const active = c.id === currentId;
        return (
          <Link
            key={c.id}
            href={`/student/class/${c.id}/overview`}
            className={cn(
              "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-[12px] font-semibold transition-colors",
              active
                ? "border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]"
                : "border-[#E2E8F0] bg-white text-[#64748B]",
            )}
          >
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: c.accentColor }}
            />
            {c.code}
          </Link>
        );
      })}
    </div>
  );
}
