"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type AdminPageShellProps = {
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

/**
 * Single container for every /admin/* page (Operate mode).
 * Enforces: max-w 960, same padding, same H1/subtitle scale,
 * same card/table grammar as Users/Classes.
 */
export function AdminPageShell({ title, subtitle, actions, children, className }: AdminPageShellProps) {
  return (
    <div className={cn("w-full max-w-[960px] mx-auto px-6 pt-8 pb-12 space-y-6 bg-[#F8FAFC]", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-[28px] font-bold text-[#172033] font-heading tracking-tight">{title}</h1>
          <p className="text-[14px] text-[#64748B] mt-1">{subtitle}</p>
        </div>
        {actions && <div className="flex gap-2 shrink-0">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

export const ADMIN_CARD = "bg-white border border-[#E2E8F0] rounded-lg shadow-sm";
export const ADMIN_TABLE_HEAD =
  "bg-slate-50 border-b border-[#E2E8F0] text-[11px] font-bold text-[#64748B] uppercase tracking-wider";
export const ADMIN_INPUT =
  "bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#2563EB] shadow-sm w-full";
export const ADMIN_BTN_PRIMARY =
  "flex items-center gap-1.5 px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-[8px] text-[13px] font-semibold transition-colors shadow-sm disabled:opacity-50";
export const ADMIN_BTN_SECONDARY =
  "flex items-center gap-1.5 px-4 py-2 border border-[#E2E8F0] bg-white hover:bg-slate-50 text-[#334155] rounded-[8px] text-[13px] font-semibold transition-colors shadow-sm";
