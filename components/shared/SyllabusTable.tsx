"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SyllabusTableProps {
  toolbar: React.ReactNode;
  children: React.ReactNode;
}

export function SyllabusTable({ toolbar, children }: SyllabusTableProps) {
  return (
    <div className="space-y-4">
      {/* Toolbar */}
      {toolbar}
      
      {/* Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-[#E2E8F0] text-[11.5px] font-bold text-[#64748B] uppercase tracking-wider">
              <th className="py-3 px-4 w-16 text-center">Unit</th>
              <th className="py-3 px-4 w-1/4">Unit Name</th>
              <th className="py-3 px-4 w-1/3">Description</th>
              <th className="py-3 px-4">Content</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0] text-[13px]">
            {children}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface SyllabusRowProps {
  unitNumber: string;
  unitName: string;
  isDraft?: boolean;
  description: string;
  content: React.ReactNode;
  rowActions?: React.ReactNode;
}

export function SyllabusRow({
  unitNumber,
  unitName,
  isDraft,
  description,
  content,
  rowActions,
}: SyllabusRowProps) {
  return (
    <tr className="hover:bg-[#F8FAFC] transition-colors group">
      <td className="py-4 px-4 text-center font-mono font-bold text-[#64748B] bg-slate-50/40 align-top">
        {unitNumber}
      </td>
      <td className="py-4 px-4 align-top relative">
        <div className="flex items-start gap-2">
          <span className="font-bold text-[14px] text-[#172033]">{unitName}</span>
          {isDraft && (
            <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap mt-0.5">
              Draft
            </span>
          )}
        </div>
        {rowActions && (
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            {rowActions}
          </div>
        )}
      </td>
      <td className="py-4 px-4 text-[#64748B] leading-relaxed align-top">
        {description}
      </td>
      <td className="py-4 px-4 align-top">
        {content}
      </td>
    </tr>
  );
}
