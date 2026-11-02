"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { ClassPageHeader } from "@/components/shared/ClassPageHeader";
import { cn } from "@/lib/utils";

interface TicketsInboxLayoutProps {
  title: string;
  subtitle: string;
  titleBadge?: React.ReactNode;
  headerActions?: React.ReactNode;
  searchValue: string;
  searchPlaceholder?: string;
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
  titleBadge,
  headerActions,
  searchValue,
  searchPlaceholder = "Search tickets",
  onSearchChange,
  filters,
  activeFilter,
  onFilterChange,
  leftListContent,
  rightDetailContent,
}: TicketsInboxLayoutProps) {
  return (
    <div className="flex flex-col h-full space-y-5">
      <ClassPageHeader
        title={title}
        subtitle={subtitle}
        badge={titleBadge}
        actions={headerActions}
      />

      <div className="flex-1 bg-white border border-[#DADADA] rounded-lg overflow-hidden flex flex-col md:flex-row min-h-[520px]">
        {/* Left Column */}
        <div className="w-full md:w-[340px] lg:w-[380px] shrink-0 border-r border-[#F0F0F0] flex flex-col bg-white">
          <div className="p-3 border-b border-[#F0F0F0] space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1.5 h-4 w-4 text-[#6F6F6F]" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full bg-white border border-[#DADADA] rounded pl-8 pr-3 py-1.5 text-[12.5px] outline-none focus:border-[#111111]"
              />
            </div>
            <div className="flex items-center gap-1 bg-[#F7F7F7] p-0.5 rounded">
              {filters.map((f) => (
                <button
                  key={f.id}
                  onClick={() => onFilterChange(f.id)}
                  className={cn(
                    "flex-1 text-center py-1 rounded text-[12px] font-medium transition-all",
                    activeFilter === f.id
                      ? "bg-white text-[#111111] shadow-sm"
                      : "text-[#5A5A5A] hover:text-[#111111]"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
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
