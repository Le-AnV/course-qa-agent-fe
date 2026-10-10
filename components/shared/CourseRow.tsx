"use client";

import * as React from "react";
import { MoreVertical } from "lucide-react";

export interface CourseRowProps {
  id: string;
  title: string;
  code?: string;
  accentColor?: string;
  stats: string; // e.g., "12 units · 28 resources · 8 open tickets"
  actionLabel?: string;
  onManage: () => void;
  onEdit?: () => void;
  onCopyCode?: () => void;
  onViewMembers?: () => void;
}

export function CourseRow({
  title,
  code,
  accentColor = "#2563EB",
  stats,
  actionLabel = "Manage class \u2192",
  onManage,
  onEdit,
  onCopyCode,
  onViewMembers,
}: CourseRowProps) {
  const [showMenu, setShowMenu] = React.useState(false);

  return (
    <div
      onClick={onManage}
      className="group relative flex items-center gap-4 p-4 hover:bg-[#F8FAFC] transition-colors cursor-pointer"
    >
      {/* Accent Strip */}
      <div 
        className="w-1 h-10 rounded-full shrink-0"
        style={{ backgroundColor: accentColor }}
      />
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-[14.5px] font-bold text-[#172033] truncate">
            {title}
          </h3>
          {code && (
            <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold tracking-wider text-[#64748B] uppercase">
              {code}
            </span>
          )}
        </div>
        <p className="text-[12.5px] text-[#64748B] mt-1 truncate">
          {stats}
        </p>
      </div>
      
      {/* Actions */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onManage();
          }}
          className="text-[12.5px] font-semibold text-[#2563EB] hover:underline"
        >
          {actionLabel}
        </button>
        
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1.5 text-slate-400 hover:text-[#172033] hover:bg-slate-100 rounded-md transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          
          {showMenu && (
            <>
              {/* Invisible overlay to close menu */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                }}
              />
              <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-[#E2E8F0] rounded-md shadow-sm z-50 py-1">
                {onEdit && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      onEdit();
                    }}
                    className="w-full text-left px-4 py-2 text-[12.5px] text-[#172033] hover:bg-slate-50"
                  >
                    Edit class
                  </button>
                )}
                {onCopyCode && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      onCopyCode();
                    }}
                    className="w-full text-left px-4 py-2 text-[12.5px] text-[#172033] hover:bg-slate-50"
                  >
                    Copy class code
                  </button>
                )}
                {onViewMembers && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      onViewMembers();
                    }}
                    className="w-full text-left px-4 py-2 text-[12.5px] text-[#172033] hover:bg-slate-50"
                  >
                    View members
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
