"use client";

import * as React from "react";
import { CourseTabs, CourseTabItem } from "@/components/shared/CourseTabs";
import { PageContainer } from "@/components/shared/PageShell";
import { useParams, usePathname } from "next/navigation";
import { studentApi } from "@/lib/student-api";
import { useIsomorphicLayoutEffect } from "@/hooks/use-isomorphic-layout-effect";

export default function ClassWorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const id = params.id as string;
  const [pendingCount, setPendingCount] = React.useState(0);
  const scrollRef = React.useRef<HTMLDivElement | null>(null);

  // The tab content lives in its own scroll container, which Next does not
  // reset on client navigation. Reset it before paint so a new tab never
  // opens scrolled to wherever the previous one was.
  useIsomorphicLayoutEffect(() => {
    scrollRef.current?.scrollTo(0, 0);
  }, [pathname]);

  React.useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      studentApi
        .pendingRequests(id)
        .catch(() => null)
        .then((pending) => {
          if (!cancelled) setPendingCount(pending?.length ?? 0);
        });
    };
    refresh();
    window.addEventListener("class-pending-changed", refresh);
    return () => {
      cancelled = true;
      window.removeEventListener("class-pending-changed", refresh);
    };
  }, [id]);

  const tabs: CourseTabItem[] = [
    { id: "overview", label: "Overview", href: `/teacher/class/${id}/overview` },
    { id: "syllabus", label: "Syllabus", href: `/teacher/class/${id}/syllabus` },
    { id: "agent", label: "Q&A Chat", href: `/teacher/class/${id}/agent` },
    { id: "tickets", label: "Tickets", href: `/teacher/class/${id}/tickets` },
    { id: "quizzes", label: "Quiz Import", href: `/teacher/class/${id}/quizzes/import` },
    {
      id: "members",
      label: "Members",
      href: `/teacher/class/${id}/members`,
      badge: pendingCount,
    },
    { id: "settings", label: "Course Settings", href: `/teacher/class/${id}/settings` },
  ];

  // The chat fills the content area instead of the docs column.
  const isAgentPage = pathname?.endsWith("/agent");

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden bg-[#E7EDF5]">
      <CourseTabs tabs={tabs} />

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
