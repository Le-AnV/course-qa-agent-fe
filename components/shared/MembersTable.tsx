"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface MembersTableProps {
  toolbar: React.ReactNode;
  children: React.ReactNode;
}

export function MembersTable({ toolbar, children }: MembersTableProps) {
  return (
    <div className="space-y-4">
      {toolbar}
      <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-[#E2E8F0] text-[11.5px] font-bold text-[#64748B] uppercase tracking-wider">
              <th className="py-3 px-4">Member</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4 text-right">Actions</th>
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
