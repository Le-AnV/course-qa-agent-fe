"use client";

import * as React from "react";
import { Inbox, Search } from "lucide-react";
import { AdminPageShell } from "@/components/shared/AdminPageShell";

type Tab = "Open" | "Resolved" | "Dismissed";

// NOTE: there is no moderation-reports API yet — the ticket system (with
// reporting) lands in a later sprint. This page therefore renders an honest
// empty state instead of hardcoded sample rows. Tabs + search stay functional
// so the layout is already correct when real data arrives.
const TABS: Tab[] = ["Open", "Resolved", "Dismissed"];

export default function AdminReportsPage() {
  const [search, setSearch] = React.useState("");
  const [tab, setTab] = React.useState<Tab>("Open");

  return (
    <AdminPageShell title="Reports" subtitle="System moderation and review.">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#64748B]" />
          <input
            type="text"
            placeholder="Search reports"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-[#E2E8F0] rounded-lg pl-9 pr-4 py-2 text-[13.5px] outline-none focus:border-[#2563EB] shadow-sm transition-shadow"
          />
        </div>
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3.5 py-1.5 text-[13px] rounded-md transition-all ${
                tab === t
                  ? "font-semibold bg-white text-[#2563EB] shadow-sm"
                  : "font-medium text-[#64748B] hover:text-[#172033]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-sm p-10 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-4">
          <Inbox className="w-6 h-6" />
        </div>
        <h2 className="text-[15px] font-bold text-[#172033]">No {tab.toLowerCase()} reports</h2>
        <p className="text-[13px] text-[#64748B] mt-1 max-w-md">
          {search
            ? `Nothing matches "${search}" — moderation reports will appear here once the ticket system lands.`
            : "Moderation reports will appear here once the ticket system lands."}
        </p>
      </div>
    </AdminPageShell>
  );
}
