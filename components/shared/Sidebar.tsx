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
  Mail,
  History,
  Activity,
} from "lucide-react";
import { Role, settingsHrefForRole } from "@/components/ui/nav-config";
import { useAuth } from "@/components/ui/auth-guard";
import { useProfile } from "@/features/profile/profile-context";
import { initialsFor, roleBadgeLabel } from "@/features/profile/validation";

// Class lists come from the backend (student enrollments / trainer ownership).
// Admins have no class workspace, so they get no class list at all.
function useSidebarClasses(role: Role) {
  const [realClasses, setRealClasses] = React.useState<
    { id: string; code: string; title: string; accentColor: string }[] | null
  >(null);
  React.useEffect(() => {
    if (role === "admin") return;
    let cancelled = false;
    (async () => {
      try {
        const { studentApi, accentFor } = await import("@/lib/student-api");
        const list = await studentApi.classes();
        if (!cancelled) {
          setRealClasses(
            list.map((c) => ({ id: c.id, code: c.code, title: c.name, accentColor: accentFor(c.id) })),
          );
        }
      } catch {
        if (!cancelled) setRealClasses([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [role]);
  return realClasses ?? [];
}

/**
 * One nav body for both containers: the desktop rail (collapsible) and the
 * below-lg slide-over drawer. Keeps the two from drifting apart.
 */
export function SidebarNavBody({
  role,
  unreadHome = false,
  collapsed = false,
  onNavigate,
  onExpand,
}: {
  role: Role;
  unreadHome?: boolean;
  collapsed?: boolean;
  onNavigate?: () => void;
  onExpand?: () => void;
}) {
  const pathname = usePathname();
  // Accordion Classes: mặc định mở khi đang ở trong 1 lớp (kể cả lần render đầu).
  const [classesOpen, setClassesOpen] = React.useState<boolean | null>(null);
  const myClasses = useSidebarClasses(role);

  const basePath = role === "admin" ? "/admin" : role === "student" ? "/student" : "/teacher";

  // Settings page exists only for admin/teacher shells — there is no
  // student/settings route, so hide the link for students instead of
  // pointing at a 404 (BUG-02).
  const settingsHref = settingsHrefForRole(role);

  // Parent highlight: sáng mục Classes khi đang ở trong 1 lớp con.
  const inClassWorkspace = pathname.startsWith(`${basePath}/class/`);
  const classesActive =
    pathname === `${basePath}/classes` || inClassWorkspace;
  const open = classesOpen ?? inClassWorkspace;

  const linkCls = (active: boolean) =>
    cn(
      "flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-colors",
      collapsed && "justify-center px-2",
      active ? "bg-[var(--brand-soft)] text-[#111111] [&_svg]:text-[var(--brand-ink)]" : "text-[#111111] hover:bg-[#F7F7F7]",
    );

  // Closing the drawer only when a real link is followed — the Classes
  // accordion toggle must be able to expand without kicking you out.
  const handleNavClick = (e: React.MouseEvent) => {
    if (!onNavigate) return;
    if ((e.target as HTMLElement).closest("a[href]")) onNavigate();
  };

  return (
    <div className="flex-1 overflow-y-auto py-2" onClick={handleNavClick}>
      <div className="mb-6 px-3">
        {!collapsed && (
          <div className="mb-2 px-3 text-[10px] font-medium text-[#6F6F6F]">
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
              <span className="w-1.5 h-1.5 rounded-full bg-[#111111] ml-auto shrink-0" />
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
              <Link
                href="/admin/history"
                title="History"
                className={linkCls(pathname.startsWith("/admin/history"))}
              >
                <History className="h-4 w-4 shrink-0" />
                {!collapsed && <span>History</span>}
              </Link>
              <Link
                href="/admin/email"
                title="Email"
                className={linkCls(pathname.startsWith("/admin/email"))}
              >
                <Mail className="h-4 w-4 shrink-0" />
                {!collapsed && <span>Email</span>}
              </Link>
              <Link
                href="/admin/system"
                title="System Health"
                className={linkCls(pathname.startsWith("/admin/system"))}
              >
                <Activity className="h-4 w-4 shrink-0" />
                {!collapsed && <span>System</span>}
              </Link>
            </>
          )}

          {role !== "admin" && (
            <>
              {/* Classes = accordion: vừa tới hub, vừa xổ list lớp con.
                  Gộp "Classes" + "Your/Active Classes" làm một — hết trùng lặp. */}
              <button
                onClick={() => {
                  if (collapsed) onExpand?.();
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
                        "h-3.5 w-3.5 shrink-0 text-[#6F6F6F] transition-transform",
                        open && "rotate-180",
                      )}
                    />
                  </>
                )}
              </button>
              {!collapsed && open && (
                <div className="mt-0.5 space-y-0.5 border-l-2 border-[#DADADA] ml-[22px] pl-2">
                  {myClasses.map((cls) => {
                    const isActive = pathname.includes(cls.id);
                    return (
                      <Link
                        key={cls.id}
                        href={`${basePath}/class/${cls.id}/overview`}
                        title={cls.title}
                        className={cn(
                          "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[12.5px] font-medium transition-colors",
                          isActive ? "bg-[var(--brand-soft)] text-[#111111]" : "text-[#111111] hover:bg-[#F7F7F7]",
                        )}
                      >
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: cls.accentColor }} />
                        <span className="truncate flex-1">{cls.title}</span>
                      </Link>
                    );
                  })}
                  <Link
                    href={`${basePath}/classes`}
                    className="block rounded-md px-2 py-1.5 text-[12px] font-semibold text-[#111111] hover:bg-[#F7F7F7]"
                  >
                    View all →
                  </Link>
                </div>
              )}
            </>
          )}
        </nav>
      </div>

      <div className="px-3">
        {!collapsed && (
          <div className="mb-2 px-3 text-[10px] font-medium text-[#6F6F6F]">
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
          {settingsHref && (
            <Link
              href={settingsHref}
              title="Settings"
              className={linkCls(pathname === settingsHref)}
            >
              <Settings className="h-4 w-4 shrink-0" />
              {!collapsed && <span>Settings</span>}
            </Link>
          )}
        </nav>
      </div>
    </div>
  );
}

export function AppSidebar({ role, unreadHome = false }: { role: Role; unreadHome?: boolean }) {
  const [showMenu, setShowMenu] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);
  const auth = useAuth();

  const handleLogout = () => {
    setShowMenu(false);
    if (auth.status === "authed") {
      auth.signOut();
    }
  };

  // Identity block — real profile (AI-29), not a hardcoded demo name.
  const { profile, loading: profileLoading } = useProfile();
  const displayName = profile?.username ?? (profileLoading ? "Loading…" : "Account");
  const roleLabel = roleBadgeLabel(profile?.role ?? role);
  const settingsHref = settingsHrefForRole(role);

  return (
    <aside
      className={cn(
        "relative hidden shrink-0 flex-col border-r border-[#DADADA] bg-white transition-[width] lg:flex",
        collapsed ? "w-[68px]" : "w-[240px]",
      )}
    >
      {/* Logo Area */}
      <div className={cn("flex items-center gap-2.5 px-5 py-5", collapsed && "justify-center px-2")}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-[var(--brand-line)] bg-[var(--brand-soft)] text-[var(--brand-ink)] shadow-xs">
          <GraduationCap className="h-5 w-5" />
        </div>
        {!collapsed && (
          <div className="flex flex-1 flex-col justify-center overflow-hidden">
            <span className="font-heading text-[15px] font-bold leading-none text-[#111111] mb-1">
              Course Q&amp;A
            </span>
            <span className="text-[11px] font-medium leading-none text-[#5A5A5A]">
              Syllabus Agent
            </span>
          </div>
        )}
      </div>

      {/* Nút thu/phóng: dải full-width riêng dưới logo — không tranh mép với icon web. */}
      <div className={cn("px-3 pb-1", collapsed && "px-2")}>
        <button
          onClick={() => setCollapsed((v) => !v)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          className={cn(
            "flex w-full items-center gap-2 rounded-md px-3 py-1.5",
            "text-[11.5px] font-medium text-[#6F6F6F] hover:bg-[#F7F7F7] hover:text-[#111111] transition-colors",
            collapsed && "justify-center px-0",
          )}
        >
          <PanelLeft className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>

      <SidebarNavBody
        role={role}
        unreadHome={unreadHome}
        collapsed={collapsed}
        onExpand={() => setCollapsed(false)}
      />

      {/* User Footer */}
      <div className="relative border-t border-[#DADADA] p-4">
        {showMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
            <div className="absolute bottom-full left-4 mb-2 w-[calc(100%-2rem)] rounded-md border border-[#DADADA] bg-white py-1 shadow-sm z-50">
              <Link
                href="/account"
                className="block px-4 py-2 text-[12.5px] text-[#111111] hover:bg-[#F7F7F7]"
                onClick={() => setShowMenu(false)}
              >
                View profile
              </Link>
              {settingsHref && (
                <Link
                  href={settingsHref}
                  className="block px-4 py-2 text-[12.5px] text-[#111111] hover:bg-[#F7F7F7]"
                  onClick={() => setShowMenu(false)}
                >
                  Account settings
                </Link>
              )}
              <div className="my-1 border-t border-[#DADADA]" />
              <button
                onClick={handleLogout}
                className="block w-full px-4 py-2 text-left text-[12.5px] text-[#9D4C38] hover:bg-[#F7F7F7]"
              >
                Log out
              </button>
            </div>
          </>
        )}
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F7F7F7] text-[11px] font-semibold text-[#111111]">
            {initialsFor(displayName)}
          </div>
          {!collapsed && (
            <>
              <div className="flex flex-1 flex-col overflow-hidden">
                <span className="truncate text-[12.5px] font-bold text-[#111111]">
                  {displayName}
                </span>
                <span className="text-[11px] text-[#5A5A5A]">{roleLabel}</span>
              </div>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-[#6F6F6F] hover:bg-[#F7F7F7] hover:text-[#111111]"
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
