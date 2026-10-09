"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  GraduationCap, 
  Home, 
  BookOpen, 
  User, 
  Settings, 
  MoreVertical,
  MessageSquare
} from "lucide-react";
import { Role } from "@/components/ui/nav-config";
import { useAuth } from "@/components/ui/auth-guard";

export function AppSidebar({ role, unreadHome = false }: { role: Role; unreadHome?: boolean }) {
  const pathname = usePathname();
  const [showMenu, setShowMenu] = React.useState(false);
  const auth = useAuth();

  const handleLogout = () => {
    setShowMenu(false);
    if (auth.status === "authed") {
      auth.signOut();
    }
  };

  const activeClasses = role === "student" ? [
    { id: "cs-401", name: "Introduction to Artificial Int...", tickets: 0, accent: "#2563EB" },
    { id: "se-301", name: "Software Engineering", tickets: 0, accent: "#0EA5E9" },
  ] : [
    { id: "cs-401", name: "Introduction to Artificial Int...", tickets: 3, accent: "#2563EB" },
    { id: "se-301", name: "Software Engineering", tickets: 3, accent: "#0EA5E9" },
    { id: "cs-310", name: "Machine Learning Foundati...", tickets: 1, accent: "#6366F1" },
  ];

  const basePath = role === "admin" ? "/admin" : role === "student" ? "/student" : "/teacher";

  return (
    <aside className="relative hidden w-[240px] shrink-0 flex-col border-r border-[#E2E8F0] bg-white lg:flex">
      {/* Logo Area */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-transparent">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-[#2563EB] text-white">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div className="flex flex-col justify-center">
          <span className="text-[15px] font-[family-name:var(--font-lora)] font-bold leading-none text-[#1e293b] mb-1">
            Course Q&amp;A
          </span>
          <span className="text-[11px] font-medium leading-none text-[#64748B]">
            Syllabus Agent
          </span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-2">
        <div className="mb-6 px-3">
          <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">
            Main
          </div>
          <nav className="space-y-0.5">
            <Link
              href={`${basePath}/home`}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-colors",
                pathname === `${basePath}/home` ? "bg-[#EFF6FF] text-[#2563EB]" : "text-[#334155] hover:bg-slate-50"
              )}
            >
              <Home className="h-4 w-4 shrink-0" />
              <span>Home</span>
              {role === "admin" && unreadHome && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] ml-auto shrink-0" />
              )}
            </Link>
            
            {role === "admin" && (
              <>
                <Link
                  href="/admin/users"
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-colors",
                    pathname.startsWith("/admin/users") ? "bg-[#EFF6FF] text-[#2563EB]" : "text-[#334155] hover:bg-slate-50"
                  )}
                >
                  <User className="h-4 w-4 shrink-0" />
                  <span>Users</span>
                </Link>
                <Link
                  href="/admin/classes"
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-colors",
                    pathname.startsWith("/admin/classes") ? "bg-[#EFF6FF] text-[#2563EB]" : "text-[#334155] hover:bg-slate-50"
                  )}
                >
                  <BookOpen className="h-4 w-4 shrink-0" />
                  <span>Classes</span>
                </Link>
                <Link
                  href="/admin/reports"
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-colors",
                    pathname.startsWith("/admin/reports") ? "bg-[#EFF6FF] text-[#2563EB]" : "text-[#334155] hover:bg-slate-50"
                  )}
                >
                  <MessageSquare className="h-4 w-4 shrink-0" />
                  <span>Reports</span>
                </Link>
              </>
            )}

            {role !== "admin" && (
              <Link
                href={`${basePath}/classes`}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-colors",
                  pathname === `${basePath}/classes` ? "bg-[#EFF6FF] text-[#2563EB]" : "text-[#334155] hover:bg-slate-50"
                )}
              >
                <BookOpen className="h-4 w-4 shrink-0" />
                <span>Classes</span>
              </Link>
            )}
          </nav>
        </div>

        {role !== "admin" && (
          <div className="mb-6 px-3">
            <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">
              {role === "student" ? "Your Classes" : "Active Classes"}
            </div>
            <nav className="space-y-0.5">
              {activeClasses.map(cls => {
                const isActive = pathname.includes(cls.id);
                return (
                  <Link
                    key={cls.id}
                    href={`${basePath}/class/${cls.id}/overview`}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-[12.5px] font-medium transition-colors group",
                      isActive ? "bg-[#EFF6FF] text-[#2563EB]" : "text-[#334155] hover:bg-slate-50"
                    )}
                  >
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: cls.accent }} />
                    <span className="truncate flex-1">{cls.name}</span>
                    {cls.tickets > 0 && role !== "student" && (
                      <span className="flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full border border-amber-200 bg-amber-50 text-amber-600 text-[9px] font-bold shrink-0">
                        {cls.tickets}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}

        <div className="px-3">
          <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">
            Personal
          </div>
          <nav className="space-y-0.5">
            {role !== "admin" && (
              <Link
                href={`${basePath}/account`}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-colors",
                  pathname === `${basePath}/account` ? "bg-[#EFF6FF] text-[#2563EB]" : "text-[#334155] hover:bg-slate-50"
                )}
              >
                <User className="h-4 w-4 shrink-0" />
                <span>Account</span>
              </Link>
            )}
            <Link
              href={`${basePath}/settings`}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-colors",
                pathname === `${basePath}/settings` ? "bg-[#EFF6FF] text-[#2563EB]" : "text-[#334155] hover:bg-slate-50"
              )}
            >
              <Settings className="h-4 w-4 shrink-0" />
              <span>Settings</span>
            </Link>
          </nav>
        </div>
      </div>

      {/* User Footer */}
      <div className="relative border-t border-[#E2E8F0] p-4">
        {showMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
            <div className="absolute bottom-full left-4 mb-2 w-[calc(100%-2rem)] rounded-md border border-[#E2E8F0] bg-white py-1 shadow-sm z-50">
              <Link
                href={`${basePath}/account`}
                className="block px-4 py-2 text-[12.5px] text-[#334155] hover:bg-slate-50"
                onClick={() => setShowMenu(false)}
              >
                View profile
              </Link>
              <Link
                href={`${basePath}/settings`}
                className="block px-4 py-2 text-[12.5px] text-[#334155] hover:bg-slate-50"
                onClick={() => setShowMenu(false)}
              >
                Account settings
              </Link>
              <div className="my-1 border-t border-[#E2E8F0]" />
              <button
                onClick={handleLogout}
                className="block w-full px-4 py-2 text-left text-[12.5px] text-red-600 hover:bg-slate-50"
              >
                Log out
              </button>
            </div>
          </>
        )}
        <div className="flex items-center gap-3">
          <img
            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&auto=format&fit=crop&q=80"
            alt="Avatar"
            className="h-8 w-8 rounded-full border border-[#E2E8F0] object-cover"
          />
          <div className="flex flex-1 flex-col overflow-hidden">
            <span className="truncate text-[12.5px] font-bold text-[#1e293b]">
              {role === "admin" ? "System Admin" : role === "student" ? "Trần Gia Linh" : "Minh"}
            </span>
            <span className="text-[11px] text-[#64748B]">
              {role === "admin" ? "Admin" : role === "student" ? "Student" : "Teacher"}
            </span>
          </div>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-[#94a3b8] hover:bg-slate-100 hover:text-[#334155]"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
