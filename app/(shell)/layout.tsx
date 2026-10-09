import { AppLayoutShell } from "@/components/shared/AppLayoutShell";

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return <AppLayoutShell>{children}</AppLayoutShell>;
}
