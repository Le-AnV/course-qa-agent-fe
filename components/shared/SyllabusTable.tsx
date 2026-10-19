"use client";

import * as React from "react";

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
      <div className="bg-white border border-[#DADADA] rounded-lg overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white border-b border-[#DADADA] text-[12px] font-medium text-[#6F6F6F]">
              <th className="py-3 px-4 w-16 text-center">Unit</th>
              <th className="py-3 px-4 w-1/4">Unit Name</th>
              <th className="py-3 px-4 w-1/3">Description</th>
              <th className="py-3 px-4">Content</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#DADADA] text-[13px]">
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
    <tr className="hover:bg-[#FAFAFA] transition-colors group">
      <td className="py-4 px-4 text-center font-mono font-bold text-[#5A5A5A] bg-slate-50/40 align-top">
        {unitNumber}
      </td>
      <td className="py-4 px-4 align-top relative">
        <div className="flex items-start gap-2">
          <span className="font-bold text-[14px] text-[#111111]">{unitName}</span>
          {isDraft && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full bg-white text-[#8F6B16] border border-[#ECDCB8] whitespace-nowrap mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B4881F]" />
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
      <td className="py-4 px-4 text-[#5A5A5A] leading-relaxed align-top">
        {description}
      </td>
      <td className="py-4 px-4 align-top">
        {content}
      </td>
    </tr>
  );
}
