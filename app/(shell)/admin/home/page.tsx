"use client";

import * as React from "react";
import { AlertTriangle, User, FileText, Upload, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function AdminHomePage() {
  const [filter, setFilter] = React.useState("All");

  const notifications = [
    {
      id: 1,
      type: "report_content",
      icon: <AlertTriangle className="w-4 h-4 text-rose-600" />,
      bg: "bg-rose-50",
      title: "New content report",
      detail: "A ticket was reported for inappropriate content.",
      context: "Introduction to Artificial Intelligence",
      action: "Review report",
      unread: true,
      time: "2 hours ago",
    },
    {
      id: 2,
      type: "report_user",
      icon: <User className="w-4 h-4 text-amber-600" />,
      bg: "bg-amber-50",
      title: "New user report",
      detail: "A user profile was reported.",
      context: "Student: Trần Gia Linh",
      action: "Review report",
      unread: true,
      time: "3 hours ago",
    },
    {
      id: 3,
      type: "class_created",
      icon: <BookIcon className="w-4 h-4 text-blue-600" />,
      bg: "bg-blue-50",
      title: "New class created",
      detail: "Introduction to Artificial Intelligence",
      context: "Created by Nguyễn Văn Minh",
      action: "View class",
      unread: false,
      time: "Yesterday",
    },
    {
      id: 4,
      type: "syllabus_import",
      icon: <FileText className="w-4 h-4 text-emerald-600" />,
      bg: "bg-emerald-50",
      title: "Syllabus import completed",
      detail: "12 units were imported successfully.",
      context: "Software Engineering",
      action: "View class",
      unread: false,
      time: "Yesterday",
    },
    {
      id: 5,
      type: "user_import",
      icon: <Upload className="w-4 h-4 text-emerald-600" />,
      bg: "bg-emerald-50",
      title: "User import completed",
      detail: "20 users were imported successfully.",
      context: "users.xlsx",
      action: "View users",
      unread: false,
      time: "2 days ago",
    },
  ];

  return (
    <div className="max-w-[960px] mx-auto pb-12 space-y-6 bg-[#F8FAFC]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-[28px] font-bold text-[#172033] font-[family-name:var(--font-lora)] tracking-tight">Home</h1>
          <p className="text-[14px] text-[#64748B] mt-1">System updates and review queue.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-3">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setFilter("All")}
            className={`text-[13px] font-semibold pb-3 border-b-2 -mb-[13px] transition-colors ${
              filter === "All" ? "border-[#2563EB] text-[#2563EB]" : "border-transparent text-[#64748B] hover:text-[#172033]"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("Unread")}
            className={`flex items-center gap-1.5 text-[13px] font-semibold pb-3 border-b-2 -mb-[13px] transition-colors ${
              filter === "Unread" ? "border-[#2563EB] text-[#2563EB]" : "border-transparent text-[#64748B] hover:text-[#172033]"
            }`}
          >
            Unread
            <span className="flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold shrink-0">
              2
            </span>
          </button>
        </div>
        <button className="text-[12.5px] font-medium text-[#2563EB] hover:underline">
          Mark all as read
        </button>
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden">
        {notifications.filter(n => filter === "All" || n.unread).map((notif, i) => (
          <div key={notif.id} className={`flex items-start gap-4 p-5 transition-colors ${notif.unread ? "bg-[#EFF6FF]/50" : "bg-white"} ${i !== 0 ? 'border-t border-[#E2E8F0]' : ''}`}>
            <div className={`w-9 h-9 rounded-full ${notif.bg} flex items-center justify-center shrink-0`}>
              {notif.icon}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-[14px] font-bold text-[#172033]">{notif.title}</h3>
                {notif.unread && <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />}
              </div>
              <p className="text-[13px] text-[#334155] mt-1">{notif.detail}</p>
              <div className="flex items-center gap-3 mt-2 text-[12px] text-[#64748B]">
                <span className="font-medium text-[#475569]">{notif.context}</span>
                <span>•</span>
                <span>{notif.time}</span>
              </div>
            </div>
            
            <div className="shrink-0 pt-1">
              <button className="text-[13px] font-semibold text-[#2563EB] hover:underline whitespace-nowrap">
                {notif.action}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    </svg>
  );
}
