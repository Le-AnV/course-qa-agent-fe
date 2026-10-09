"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface TicketsInboxLayoutProps {
  title: string;
  subtitle: string;
  searchValue: string;
  onSearchChange: (val: string) => void;
  filters: { id: string; label: string }[];
  activeFilter: string;
  onFilterChange: (id: string) => void;
  leftListContent: React.ReactNode;
  rightDetailContent: React.ReactNode;
}

export function TicketsInboxLayout({
  title,
  subtitle,
  searchValue,
  onSearchChange,
  filters,
  activeFilter,
  onFilterChange,
  leftListContent,
  rightDetailContent,
}: TicketsInboxLayoutProps) {
  return (
    <div className="flex flex-col h-full space-y-5">
      <div>
        <h2 className="text-xl font-bold text-[#172033]">{title}</h2>
        <p className="text-[13px] text-[#64748B] mt-0.5">{subtitle}</p>
      </div>
      
      <div className="flex-1 bg-white border border-[#E2E8F0] rounded-lg overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        {/* Left Column */}
        <div className="w-full md:w-[340px] lg:w-[380px] shrink-0 border-r border-[#E2E8F0] flex flex-col bg-white">
          <div className="p-3 border-b border-[#E2E8F0] space-y-2 bg-[#F8FAFC]/50">
            <div className="relative">
              <Search className="absolute left-2.5 top-1.5 h-4 w-4 text-[#64748B]" />
              <input
                type="text"
                placeholder="Search tickets"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full bg-white border border-[#E2E8F0] rounded pl-8 pr-3 py-1.5 text-[12.5px] outline-none focus:border-[#2563EB]"
              />
            </div>
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded">
              {filters.map((f) => (
                <button
                  key={f.id}
                  onClick={() => onFilterChange(f.id)}
                  className={cn(
                    "flex-1 text-center py-1 rounded text-[12px] font-medium transition-all",
                    activeFilter === f.id
                      ? "bg-white text-[#2563EB] shadow-sm"
                      : "text-[#64748B] hover:text-[#172033]"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto divide-y divide-[#E2E8F0]">
            {leftListContent}
          </div>
        </div>
        
        {/* Right Column */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          {rightDetailContent}
        </div>
      </div>
    </div>
  );
}
