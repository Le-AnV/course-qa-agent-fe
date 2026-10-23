"use client";

import * as React from "react";
import Link from "next/link";
import { CourseBanner } from "@/components/shared/CourseBanner";
import { CourseTabs, CourseTabItem } from "@/components/shared/CourseTabs";
import { useParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { studentApi, accentFor, termFor, type StudentClass } from "@/lib/student-api";

export default function StudentClassWorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const id = params.id as string;
  const [cls, setCls] = React.useState<StudentClass | null>(null);
  const [myClasses, setMyClasses] = React.useState<StudentClass[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [detail, all] = await Promise.all([
          studentApi.classDetail(id).catch(() => null),
          studentApi.classes().catch(() => []),
        ]);
        if (!cancelled) {
          setCls(detail);
          setMyClasses(all);
        }
      } catch {
        if (!cancelled) {
          setCls(null);
          setMyClasses([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const title = cls?.name ?? "Class workspace";
  const meta = cls ? `${cls.code} · ${termFor(cls)}` : undefined;

  const tabs: CourseTabItem[] = [
    { id: "overview", label: "Overview", href: `/student/class/${id}/overview` },
    { id: "syllabus", label: "Syllabus", href: `/student/class/${id}/syllabus` },
    { id: "agent", label: "Q&A Chat", href: `/student/class/${id}/agent` },
    { id: "proposals", label: "My Proposals", href: `/student/class/${id}/proposals` },
    { id: "members", label: "Members", href: `/student/class/${id}/members` },
  ];

  // Trang agent chiếm full content: bỏ khung max-w-5xl,
  // các tab docs giữ layout cũ. Banner 1 chiều cao mọi tab nên đổi tab không nảy.
  const isAgentPage = pathname?.endsWith("/agent");

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden bg-[#F5F5F5]">
      <CourseBanner
        title={title}
        backHref="/student/classes"
        accentColor="#F7F7F7"
        teacherName={cls?.trainer_name ?? ""}
        meta={meta}
      />
      <CourseTabs tabs={tabs} />

      {/* Mobile class-switcher: sidebar ẩn dưới lg nên cần chỗ đổi lớp nhanh. */}
      <ClassSwitcherChips currentId={id} classes={myClasses} />

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

function ClassSwitcherChips({ currentId, classes }: { currentId: string; classes: StudentClass[] }) {
  if (classes.length < 2) return null;

  return (
    <div className="flex lg:hidden items-center gap-2 overflow-x-auto px-4 py-2 bg-white border-b border-[#DADADA] shrink-0">
      {classes.map((c) => {
        const active = c.id === currentId;
        return (
          <Link
            key={c.id}
            href={`/student/class/${c.id}/overview`}
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
