"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { PAGE_COLUMN } from "@/components/shared/PageShell";
import { WorkspacePageHeader } from "@/components/shared/WorkspacePageHeader";

type AdminPageShellProps = {
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

/**
 * Single container for every /admin/* page (Operate mode).
 * Enforces the app-wide content column (see PageShell) plus the same H1/subtitle
 * scale and card/table grammar as Users/Classes.
 */
export function AdminPageShell({ title, subtitle, actions, children, className }: AdminPageShellProps) {
  return (
    <div className={cn(PAGE_COLUMN, "space-y-6 bg-[#E7EDF5]", className)}>
      <WorkspacePageHeader title={title} subtitle={subtitle} actions={actions} />
      {children}
    </div>
  );
}

export const ADMIN_CARD = "bg-white border border-[#DADADA] rounded-xl shadow-xs";
export const ADMIN_TABLE_HEAD =
  "bg-white border-b border-[#DADADA] text-[12px] font-medium text-[#6F6F6F]";
export const ADMIN_INPUT =
  "bg-white border border-[#CFCFCF] rounded-[10px] px-3 py-2 text-[13px] outline-none focus:border-[#B9B9B9] focus:ring-4 focus:ring-[#111111]/5 transition-colors w-full";
export const ADMIN_BTN_PRIMARY =
  "flex items-center gap-1.5 px-4 py-2 border border-[#CFCFCF] bg-white hover:bg-[#F7F7F7] text-[#111111] rounded-[10px] text-[13px] font-semibold transition-colors shadow-xs disabled:opacity-50";
export const ADMIN_BTN_SECONDARY =
  "flex items-center gap-1.5 px-4 py-2 border border-transparent bg-[#F7F7F7] hover:bg-[#F0F0F0] text-[#111111] rounded-[10px] text-[13px] font-semibold transition-colors disabled:opacity-50";
