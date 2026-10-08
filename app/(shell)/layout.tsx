import { AppShell } from "@/components/ui/app-shell";

/** Every route inside this group renders inside the AppShell (navbar + sidebar). */
export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
