"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface NotificationItem {
  id: string;
  icon: LucideIcon;
  iconColorClass: string;
  iconBgClass: string;
  title: string;
  detail: string;
  context: string;
  actionLabel: string;
  onAction: () => void;
  isRead: boolean;
  timestamp?: string;
}

export function NotificationFeed({
  notifications,
  onMarkAllRead,
  emptyStateText = "No notifications",
}: {
  notifications: NotificationItem[];
  onMarkAllRead?: () => void;
  emptyStateText?: string;
}) {
  const [filter, setFilter] = React.useState<"all" | "unread">("all");

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !n.isRead;
    return true;
  });

  return (
    <div className="w-full max-w-[960px] mx-auto pb-12">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center bg-slate-100 p-1 rounded-md">
          <button
            onClick={() => setFilter("all")}
            className={cn(
              "px-3 py-1.5 text-[12.5px] font-medium rounded transition-all",
              filter === "all" ? "bg-white text-[#2563EB] shadow-sm" : "text-[#64748B] hover:text-[#172033]"
            )}
          >
            All
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={cn(
              "px-3 py-1.5 text-[12.5px] font-medium rounded transition-all",
              filter === "unread" ? "bg-white text-[#2563EB] shadow-sm" : "text-[#64748B] hover:text-[#172033]"
            )}
          >
            Unread
          </button>
        </div>
        {onMarkAllRead && (
          <button
            onClick={onMarkAllRead}
            className="text-[12.5px] font-medium text-[#2563EB] hover:underline"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-[13.5px] text-[#64748B]">
            {emptyStateText}
          </div>
        ) : (
          <div className="divide-y divide-[#E2E8F0]">
            {filtered.map((n) => (
              <div
                key={n.id}
                className={cn(
                  "p-4 flex items-start gap-4 transition-colors",
                  !n.isRead ? "bg-[#EAF2FF]/40" : "bg-white hover:bg-slate-50/50"
                )}
              >
                <div className={cn("w-9 h-9 rounded-md flex items-center justify-center shrink-0", n.iconBgClass, n.iconColorClass)}>
                  <n.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[13.5px] text-[#172033]">{n.title}</span>
                    {!n.isRead && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
                    )}
                  </div>
                  <div className="text-[13px] text-[#64748B] mt-0.5">{n.detail}</div>
                  <div className="text-[12px] text-[#64748B] mt-1.5 flex items-center gap-1.5">
                    {n.context}
                    {n.timestamp && (
                      <>
                        <span className="text-slate-300">&bull;</span>
                        <span>{n.timestamp}</span>
                      </>
                    )}
                  </div>
                </div>
                <button
                  onClick={n.onAction}
                  className="text-[12.5px] font-medium text-[#2563EB] hover:underline shrink-0"
                >
                  {n.actionLabel}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
