"use client";

import * as React from "react";
import { CourseBanner } from "@/components/shared/CourseBanner";
import { CourseTabs, CourseTabItem } from "@/components/shared/CourseTabs";
import { useParams } from "next/navigation";

export default function StudentClassWorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const id = params.id as string;

  const tabs: CourseTabItem[] = [
    { id: "overview", label: "Overview", href: `/student/class/${id}/overview` },
    { id: "syllabus", label: "Syllabus", href: `/student/class/${id}/syllabus` },
    { id: "agent", label: "Q&A Agent", href: `/student/class/${id}/agent` },
    { id: "proposals", label: "My Proposals", href: `/student/class/${id}/proposals` },
    { id: "members", label: "Members", href: `/student/class/${id}/members` },
  ];

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC]">
      <CourseBanner 
        title="Introduction to Artificial Intelligence" 
        backHref="/student/classes"
        accentColor="#EFF6FF"
        teacherName="Minh"
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
