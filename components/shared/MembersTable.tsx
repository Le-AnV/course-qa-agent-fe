"use client";

import * as React from "react";

interface MembersTableProps {
  toolbar: React.ReactNode;
  children: React.ReactNode;
}

export function MembersTable({ toolbar, children }: MembersTableProps) {
  return (
    <div className="space-y-4">
      {toolbar}
      <div className="bg-white border border-[#DADADA] rounded-lg overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white border-b border-[#DADADA] text-[12px] font-medium text-[#6F6F6F]">
              <th className="py-3 px-4">Member</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4 text-right">Actions</th>
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
