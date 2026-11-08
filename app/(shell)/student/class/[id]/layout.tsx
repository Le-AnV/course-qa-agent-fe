"use client";

import * as React from "react";
import Link from "next/link";
import { CourseTabs, CourseTabItem } from "@/components/shared/CourseTabs";
import { PageContainer } from "@/components/shared/PageShell";
import { useParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { studentApi, accentFor, type StudentClass } from "@/lib/student-api";
import { peekClasses } from "@/lib/class-cache";
import { classSectionFromPathname } from "@/lib/class-route";
import { useIsomorphicLayoutEffect } from "@/hooks/use-isomorphic-layout-effect";

export default function StudentClassWorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const id = params.id as string;
  const [myClasses, setMyClasses] = React.useState<StudentClass[]>([]);
  const scrollRef = React.useRef<HTMLDivElement | null>(null);

  // Seed the mobile class switcher from the session cache before the first
  // paint so it never flashes a placeholder on every entry into a class.
  useIsomorphicLayoutEffect(() => {
    const cachedList = peekClasses();
    if (cachedList) setMyClasses(cachedList);
  }, [id]);

  // See the teacher layout: the tab content scrolls independently of Next, so
  // reset it before paint on every tab change.
  useIsomorphicLayoutEffect(() => {
    scrollRef.current?.scrollTo(0, 0);
  }, [pathname]);

  React.useEffect(() => {
    let cancelled = false;
    studentApi
      .classes()
      .catch(() => [])
      .then((all) => {
        if (!cancelled) setMyClasses(all);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const tabs: CourseTabItem[] = [
    { id: "overview", label: "Overview", href: `/student/class/${id}/overview` },
    { id: "syllabus", label: "Syllabus", href: `/student/class/${id}/syllabus` },
    { id: "quizzes", label: "Quizzes", href: `/student/class/${id}/quizzes` },
    { id: "agent", label: "Q&A Chat", href: `/student/class/${id}/agent` },
    { id: "tickets", label: "My Tickets", href: `/student/class/${id}/tickets` },
    { id: "attendance", label: "Attendance", href: `/student/class/${id}/attendance` },
    { id: "members", label: "Members", href: `/student/class/${id}/members` },
  ];

  // Trang agent chiếm full content: bỏ khung max-w-5xl,
  // các tab docs giữ layout cũ. Nav 1 chiều cao mọi tab nên đổi tab không nảy.
  const isAgentPage = pathname?.endsWith("/agent");
  const classSection = classSectionFromPathname(pathname ?? "", "/student");

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden bg-[#E7EDF5]">
      <CourseTabs tabs={tabs} />

      {/* Mobile class-switcher: sidebar ẩn dưới lg nên cần chỗ đổi lớp nhanh. */}
      <ClassSwitcherChips
        currentId={id}
        currentSection={classSection}
        classes={myClasses}
      />

      {isAgentPage ? (
        <div className="flex-1 min-h-0 overflow-y-auto [scrollbar-gutter:stable]">
          <PageContainer className="h-full pt-3 pb-3">{children}</PageContainer>
        </div>
      ) : (
        <div ref={scrollRef} className="flex-1 overflow-y-auto [scrollbar-gutter:stable]">
          <PageContainer className="pt-3">{children}</PageContainer>
        </div>
      )}
    </div>
  );
}

function ClassSwitcherChips({
  currentId,
  currentSection,
  classes,
}: {
  currentId: string;
  currentSection: string;
  classes: StudentClass[];
}) {
  if (classes.length < 2) return null;

  return (
    <div className="flex lg:hidden items-center gap-2 overflow-x-auto px-4 py-2 bg-white border-b border-[#DADADA] shrink-0">
      {classes.map((c) => {
        const active = c.id === currentId;
        return (
          <Link
            key={c.id}
            href={`/student/class/${c.id}/${currentSection}`}
            className={cn(
              "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-[12px] font-semibold transition-colors",
              active
                ? "border-[#111111] bg-[#F7F7F7] text-[#111111]"
                : "border-[#DADADA] bg-white text-[#5A5A5A]",
            )}
          >
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: accentFor(c.id) }}
            />
            {c.code}
          </Link>
        );
      })}
    </div>
  );
}
