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
  MessageSquare,
  PanelLeft,
  ChevronDown,
} from "lucide-react";
import { Role } from "@/components/ui/nav-config";
import { useAuth } from "@/components/ui/auth-guard";
import { classesForRole } from "@/lib/classes";
import { useProfile } from "@/features/profile/profile-context";
import { initialsFor, roleBadgeLabel } from "@/features/profile/validation";

export function AppSidebar({ role, unreadHome = false }: { role: Role; unreadHome?: boolean }) {
  const pathname = usePathname();
  const [showMenu, setShowMenu] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);
  // Accordion Classes: mặc định mở khi đang ở trong 1 lớp (kể cả lần render đầu).
  const [classesOpen, setClassesOpen] = React.useState<boolean | null>(null);
  const auth = useAuth();

  const handleLogout = () => {
    setShowMenu(false);
    if (auth.status === "authed") {
      auth.signOut();
    }
  };

  // Một nguồn data duy nhất với trang My Classes + banner (lib/classes.ts).
  const myClasses = classesForRole(role);

  // Identity block — real profile (AI-29), not a hardcoded demo name.
  const { profile, loading: profileLoading } = useProfile();
  const displayName = profile?.username ?? (profileLoading ? "Loading…" : "Account");
  const roleLabel = roleBadgeLabel(profile?.role ?? role);

  const basePath = role === "admin" ? "/admin" : role === "student" ? "/student" : "/teacher";

  // Parent highlight: sáng mục Classes khi đang ở trong 1 lớp con.
  const inClassWorkspace = pathname.startsWith(`${basePath}/class/`);
  const classesActive =
    pathname === `${basePath}/classes` || inClassWorkspace;
  const open = classesOpen ?? inClassWorkspace;

  const linkCls = (active: boolean) =>
    cn(
      "flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-colors",
      collapsed && "justify-center px-2",
      active ? "bg-[#EFF6FF] text-[#2563EB]" : "text-[#334155] hover:bg-slate-50",
    );

  return (
    <aside
      className={cn(
        "relative hidden shrink-0 flex-col border-r border-[#E2E8F0] bg-white transition-[width] lg:flex",
        collapsed ? "w-[68px]" : "w-[240px]",
      )}
    >
      {/* Logo Area */}
      <div className={cn("flex items-center gap-2.5 px-5 py-5", collapsed && "justify-center px-2")}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-[#2563EB] text-white">
          <GraduationCap className="h-5 w-5" />
        </div>
        {!collapsed && (
          <div className="flex flex-1 flex-col justify-center overflow-hidden">
            <span className="font-[family-name:var(--font-lora)] text-[15px] font-bold leading-none text-[#1e293b] mb-1">
              Course Q&amp;A
            </span>
            <span className="text-[11px] font-medium leading-none text-[#64748B]">
              Syllabus Agent
            </span>
          </div>
        )}
      </div>

      {/* Nút thu/phóng: dải full-width riêng dưới logo — không tranh mép với icon web. */}
      <div className={cn("px-3 pb-1", collapsed && "px-2")}>
        <button
          onClick={() => setCollapsed((v) => !v)}
          title={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
          className={cn(
            "flex w-full items-center gap-2 rounded-md border border-[#E2E8F0] bg-white px-3 py-1.5",
            "text-[11.5px] font-semibold text-[#64748B] hover:bg-slate-50 hover:text-[#334155] transition-colors",
            collapsed && "justify-center px-0",
          )}
        >
          <PanelLeft className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Thu gọn</span>}
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-2">
        <div className="mb-6 px-3">
          {!collapsed && (
            <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">
              Main
            </div>
          )}
          <nav className="space-y-0.5">
            <Link
              href={`${basePath}/home`}
              title="Home"
              className={linkCls(pathname === `${basePath}/home`)}
            >
              <Home className="h-4 w-4 shrink-0" />
              {!collapsed && <span>Home</span>}
              {!collapsed && role === "admin" && unreadHome && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] ml-auto shrink-0" />
              )}
            </Link>

            {role === "admin" && (
              <>
                <Link
                  href="/admin/users"
                  title="Users"
                  className={linkCls(pathname.startsWith("/admin/users"))}
                >
                  <User className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>Users</span>}
                </Link>
                <Link
                  href="/admin/classes"
                  title="Classes"
                  className={linkCls(pathname.startsWith("/admin/classes"))}
                >
                  <BookOpen className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>Classes</span>}
                </Link>
                <Link
                  href="/admin/reports"
                  title="Reports"
                  className={linkCls(pathname.startsWith("/admin/reports"))}
                >
                  <MessageSquare className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>Reports</span>}
                </Link>
              </>
            )}

            {role !== "admin" && (
              <>
                {/* Classes = accordion: vừa tới hub, vừa xổ list lớp con.
                    Gộp "Classes" + "Your/Active Classes" làm một — hết trùng lặp. */}
                <button
                  onClick={() => {
                    if (collapsed) setCollapsed(false);
                    setClassesOpen(!open);
                  }}
                  title="Classes"
                  className={cn(linkCls(classesActive), "w-full")}
                >
                  <BookOpen className="h-4 w-4 shrink-0" />
                  {!collapsed && (
                    <>
                      <Link
                        href={`${basePath}/classes`}
                        className="flex-1 text-left"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Classes
                      </Link>
                      <ChevronDown
                        className={cn(
                          "h-3.5 w-3.5 shrink-0 text-[#94a3b8] transition-transform",
                          open && "rotate-180",
                        )}
                      />
                    </>
                  )}
                </button>
                {!collapsed && open && (
                  <div className="mt-0.5 space-y-0.5 border-l-2 border-[#E2E8F0] ml-[22px] pl-2">
                    {myClasses.map((cls) => {
                      const isActive = pathname.includes(cls.id);
                      return (
                        <Link
                          key={cls.id}
                          href={`${basePath}/class/${cls.id}/overview`}
                          title={cls.title}
                          className={cn(
                            "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[12.5px] font-medium transition-colors",
                            isActive ? "bg-[#EFF6FF] text-[#2563EB]" : "text-[#334155] hover:bg-slate-50",
                          )}
                        >
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: cls.accentColor }} />
                          <span className="truncate flex-1">{cls.title}</span>
                        </Link>
                      );
                    })}
                    <Link
                      href={`${basePath}/classes`}
                      className="block rounded-md px-2 py-1.5 text-[12px] font-semibold text-[#2563EB] hover:bg-[#EFF6FF]"
                    >
                      Xem tất cả →
                    </Link>
                  </div>
                )}
              </>
            )}
          </nav>
        </div>

        <div className="px-3">
          {!collapsed && (
            <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">
              Personal
            </div>
          )}
          <nav className="space-y-0.5">
            {/* AI-29: shared profile surface — one route for every role. */}
            <Link
              href="/account"
              title="Account"
              className={linkCls(pathname === "/account")}
            >
              <User className="h-4 w-4 shrink-0" />
              {!collapsed && <span>Account</span>}
            </Link>
            <Link
              href={`${basePath}/settings`}
              title="Settings"
              className={linkCls(pathname === `${basePath}/settings`)}
            >
              <Settings className="h-4 w-4 shrink-0" />
              {!collapsed && <span>Settings</span>}
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
                href="/account"
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
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#E2E8F0] bg-[#2563EB] text-[11px] font-bold text-white">
            {initialsFor(displayName)}
          </div>
          {!collapsed && (
            <>
              <div className="flex flex-1 flex-col overflow-hidden">
                <span className="truncate text-[12.5px] font-bold text-[#1e293b]">
                  {displayName}
                </span>
                <span className="text-[11px] text-[#64748B]">{roleLabel}</span>
              </div>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-[#94a3b8] hover:bg-slate-100 hover:text-[#334155]"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
