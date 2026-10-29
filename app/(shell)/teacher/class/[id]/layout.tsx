"use client";

import * as React from "react";
import { CourseBanner } from "@/components/shared/CourseBanner";
import { CourseTabs, CourseTabItem } from "@/components/shared/CourseTabs";
import { PageContainer } from "@/components/shared/PageShell";
import { useParams, usePathname } from "next/navigation";
import { studentApi, termFor, type StudentClass } from "@/lib/student-api";
import { peekClassDetail } from "@/lib/class-cache";
import { useIsomorphicLayoutEffect } from "@/hooks/use-isomorphic-layout-effect";

export default function ClassWorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const id = params.id as string;
  const [cls, setCls] = React.useState<StudentClass | null>(null);
  const [pendingCount, setPendingCount] = React.useState(0);
  const scrollRef = React.useRef<HTMLDivElement | null>(null);

  // Seed the banner from the session cache before the first paint. A fetch in
  // an effect only lands after paint, so an uncached class showed the loading
  // placeholder (and previously a generic title) for ~400ms and then swapped.
  // Layout effect, not useState: storage is unavailable during SSR, and a
  // different initial state on the client would be a hydration mismatch.
  useIsomorphicLayoutEffect(() => {
    setCls(peekClassDetail(id));
  }, [id]);

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

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const detail = await studentApi.classDetail(id).catch(() => null);
        if (!cancelled) setCls(detail);
      } catch {
        if (!cancelled) setCls(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const tabs: CourseTabItem[] = [
    { id: "overview", label: "Overview", href: `/teacher/class/${id}/overview` },
    { id: "syllabus", label: "Syllabus", href: `/teacher/class/${id}/syllabus` },
    { id: "agent", label: "Q&A Chat", href: `/teacher/class/${id}/agent` },
    { id: "tickets", label: "Tickets", href: `/teacher/class/${id}/tickets` },
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
    <div className="flex flex-col h-full min-h-0 overflow-hidden bg-[#F5F5F5]">
      <CourseBanner
        title={cls?.name ?? null}
        backHref="/teacher/classes"
        accentColor="#F7F7F7"
        teacherName={cls?.trainer_name ?? ""}
        meta={cls ? `${cls.code} · ${termFor(cls)}` : undefined}
      />
      <CourseTabs tabs={tabs} />

      {isAgentPage ? (
        <div className="flex-1 min-h-0 overflow-hidden">
          <PageContainer className="h-full pt-3 pb-3">{children}</PageContainer>
        </div>
      ) : (
        <div ref={scrollRef} className="flex-1 overflow-y-auto [scrollbar-gutter:stable_both-edges]">
          <PageContainer>{children}</PageContainer>
        </div>
      )}
    </div>
  );
}
