import Link from "next/link";
import { ArrowRight, Menu, MessagesSquare } from "lucide-react";

import { Button } from "@/components/ui/button";

const navigation = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#workspace", label: "Workspace" },
];

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ink)] focus-visible:ring-offset-4"
          aria-label="Course Q&A Agent home"
        >
          <span className="flex size-9 items-center justify-center rounded-xl border border-[#CFCFCF] bg-white text-[#111111] shadow-xs">
            <MessagesSquare className="size-5" aria-hidden="true" />
          </span>
          <span className="text-sm font-semibold tracking-tight text-slate-950 sm:text-base">
            Course Q&amp;A Agent
          </span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Main navigation">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ink)] focus-visible:ring-offset-4"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center lg:flex">
          <Button asChild className="h-10 border border-[var(--brand-pressed)]/30 bg-[var(--brand)] px-4 text-[#111111] shadow-xs hover:bg-[var(--brand-hover)]">
            <Link href="/login">
              Open workspace
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>

        <details className="group relative lg:hidden">
          <summary className="flex size-10 cursor-pointer list-none items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition-colors hover:bg-[var(--brand-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ink)] [&::-webkit-details-marker]:hidden">
            <Menu className="size-5" aria-hidden="true" />
            <span className="sr-only">Open menu</span>
          </summary>
          <nav
            className="absolute right-0 top-12 flex w-64 flex-col gap-1 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl shadow-slate-950/10"
            aria-label="Mobile navigation"
          >
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-950"
              >
                {item.label}
              </Link>
            ))}
            <Button asChild className="mt-2 h-10 border border-[var(--brand-pressed)]/30 bg-[var(--brand)] text-[#111111] shadow-xs hover:bg-[var(--brand-hover)]">
              <Link href="/login">Open workspace</Link>
            </Button>
          </nav>
        </details>
      </div>
    </header>
  );
}
