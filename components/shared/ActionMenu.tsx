"use client";

import * as React from "react";
import { MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";

export type ActionMenuItem = {
  label: string;
  icon?: React.ReactNode;
  danger?: boolean;
  onSelect: () => void;
};

type ActionMenuProps = {
  label: string;
  items: ActionMenuItem[];
  /** Open upward (e.g. last table row) so the menu is never clipped. */
  direction?: "down" | "up";
  className?: string;
};

/**
 * Click-activated row action menu (replaces hover-only `group-hover` menus).
 * Closes on outside click and Escape; exposes aria-haspopup/expanded.
 */
export function ActionMenu({ label, items, direction = "down", className }: ActionMenuProps) {
  const [open, setOpen] = React.useState(false);
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open ]);

  return (
    <div className={cn("relative inline-block", className)}>
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="p-1.5 text-slate-400 hover:text-[#172033] hover:bg-slate-100 rounded-md transition-colors"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            role="menu"
            className={cn(
              "absolute right-0 w-44 bg-white border border-[#E2E8F0] rounded-md shadow-lg z-50 py-1",
              direction === "down" ? "top-full mt-1" : "bottom-full mb-1"
            )}
          >
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  item.onSelect();
                }}
                className={cn(
                  "w-full text-left px-4 py-2 text-[12.5px] flex items-center gap-2 transition-colors",
                  item.danger
                    ? "text-rose-600 hover:bg-rose-50"
                    : "text-[#172033] hover:bg-slate-50"
                )}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
