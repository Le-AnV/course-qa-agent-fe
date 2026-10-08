"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { navItemsForRole, type Role } from "@/components/ui/nav-config";

type NavbarProps = {
  role: Role;
  signOut: () => void;
};

export function Navbar({ role, signOut }: NavbarProps) {
  const pathname = usePathname();
  const items = navItemsForRole(role);

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-card px-4">
      <Link href="/" className="text-sm font-semibold tracking-tight">
        Course QA Agent
      </Link>

      {/* Compact nav for small screens — same config as the sidebar */}
      <nav className="flex items-center gap-1 lg:hidden">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium",
                active
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
              )}
            >
              <item.icon className="size-3.5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <Badge variant="secondary" className="capitalize">
          {role}
        </Badge>
        <Button variant="ghost" size="sm" onClick={signOut}>
          Sign out
        </Button>
      </div>
    </header>
  );
}
