import Link from "next/link";
import { MessagesSquare } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-10 sm:px-8 md:flex-row md:items-end md:justify-between lg:px-10">
        <div className="max-w-md">
          <Link
            href="/"
            className="inline-flex items-center gap-3"
            aria-label="Course Q&A Agent home"
          >
            <span className="flex size-9 items-center justify-center rounded-xl border border-[#CFCFCF] bg-white text-[#111111] shadow-xs">
              <MessagesSquare className="size-5" aria-hidden="true" />
            </span>
            <span className="font-semibold tracking-tight text-slate-950">Course Q&amp;A Agent</span>
          </Link>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Course questions answered from the materials that belong to your class.
          </p>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-slate-600">
          <Link href="#how-it-works" className="hover:text-slate-950">How it works</Link>
          <Link href="#workspace" className="hover:text-slate-950">Workspace</Link>
          <Link href="/login" className="text-[var(--brand-ink)] hover:text-[var(--brand-ink)]">Log in</Link>
        </div>
      </div>
      <div className="border-t border-slate-100 px-5 py-5 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Course Q&amp;A Agent
      </div>
    </footer>
  );
}
