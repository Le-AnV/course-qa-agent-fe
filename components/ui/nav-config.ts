import {
  LayoutDashboard,
  Palette,
  type LucideIcon,
  Home,
  BookOpen
} from "lucide-react";

/** Roles mirror the backend RBAC (AI-27). Client-side filtering is UX only. */
export type Role = "student" | "trainer" | "admin";

export const ROLES: Role[] = ["student", "trainer", "admin"];

/** localStorage keys written by the login flow (AI-25) after a successful login. */
export const AUTH_TOKEN_KEY = "qa.auth.token";
export const AUTH_ROLE_KEY = "qa.auth.role";

export type NavItem = {
  href: string;
  label: string;
  roles: Role[];
  icon: LucideIcon;
};

/**
 * Sidebar / mobile navbar menu — single source of truth.
 * Adding a menu item = one entry here, no JSX edits needed.
 * Routes that do not exist yet (other tickets) will 404 until those land.
 */
export const NAV_ITEMS: NavItem[] = [
// Shared Routes
  {
    href: "/styleguide",
    label: "Styleguide",
    roles: ["student", "trainer", "admin"],
    icon: Palette,
  },
  // Teacher Routes
  {
    href: "/teacher",
    label: "Teacher Portal",
    roles: ["trainer", "admin"],
    icon: BookOpen,
  },
  // Admin Routes
  {
    href: "/admin",
    label: "Admin Dashboard",
    roles: ["admin"],
    icon: LayoutDashboard,
  },
  // Student Routes
  {
    href: "/student",
    label: "Student Portal",
    roles: ["student"],
    icon: Home,
  },
];

export function navItemsForRole(role: Role): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}

/**
 * UX-only route gate (AC2): same rules as the menu above.
 * Paths without a NAV_ITEMS entry fall through — the backend (AI-27)
 * is the real enforcement either way.
 */
export function canAccessRoute(role: Role, pathname: string): boolean {
  // Allow root path so it can redirect properly
  if (pathname === "/") return true;

  const item = NAV_ITEMS.find(
    (entry) =>
      pathname === entry.href || pathname.startsWith(`${entry.href}/`),
  );
  return item ? item.roles.includes(role) : true;
}

/** Landing route per role — used by guards that bounce users on role mismatch. */
export function homeRouteFor(role: Role): string {
  if (role === "student") return "/student/home";
  if (role === "trainer") return "/teacher/home";
  if (role === "admin") return "/admin/home";
  return "/login";
}
