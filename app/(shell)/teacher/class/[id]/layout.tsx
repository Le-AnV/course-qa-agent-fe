"use client";

import * as React from "react";
import { CourseBanner } from "@/components/shared/CourseBanner";
import { CourseTabs, CourseTabItem } from "@/components/shared/CourseTabs";
import { useParams } from "next/navigation";
import { studentApi, termFor, type StudentClass } from "@/lib/student-api";

export default function ClassWorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
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
    { id: "tickets", label: "Tickets", href: `/teacher/class/${id}/tickets` },
    { id: "members", label: "Members", href: `/teacher/class/${id}/members` },
    { id: "settings", label: "Course Settings", href: `/teacher/class/${id}/settings` },
  ];

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC]">
      <CourseBanner
        title={cls?.name ?? "Class workspace"}
        backHref="/teacher/classes"
        accentColor="#EFF6FF"
        teacherName={cls?.trainer_name ?? ""}
        meta={cls ? `${cls.code} · ${termFor(cls)}` : undefined}
      />
      <CourseTabs tabs={tabs} />

      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
