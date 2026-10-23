"use client";

import * as React from "react";
import { CourseBanner } from "@/components/shared/CourseBanner";
import { CourseTabs, CourseTabItem } from "@/components/shared/CourseTabs";
import { useParams, usePathname } from "next/navigation";
import { studentApi, termFor, type StudentClass } from "@/lib/student-api";

export default function ClassWorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const id = params.id as string;
  const [cls, setCls] = React.useState<StudentClass | null>(null);

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
    { id: "members", label: "Members", href: `/teacher/class/${id}/members` },
    { id: "settings", label: "Course Settings", href: `/teacher/class/${id}/settings` },
  ];

  // The chat fills the content area instead of the docs column.
  const isAgentPage = pathname?.endsWith("/agent");

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden bg-[#F5F5F5]">
      <CourseBanner
        title={cls?.name ?? "Class workspace"}
        backHref="/teacher/classes"
        accentColor="#F7F7F7"
        teacherName={cls?.trainer_name ?? ""}
        meta={cls ? `${cls.code} · ${termFor(cls)}` : undefined}
      />
      <CourseTabs tabs={tabs} />

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
