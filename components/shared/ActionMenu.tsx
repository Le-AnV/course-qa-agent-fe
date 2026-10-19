"use client";

import * as React from "react";
import { createPortal } from "react-dom";
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
  /** Preferred side; flipped automatically when there is no room for it. */
  direction?: "down" | "up";
  className?: string;
};

const GAP = 4;
const EDGE = 8;

/**
 * Click-activated row action menu (replaces hover-only `group-hover` menus).
 * The panel is portalled to `document.body` and positioned in viewport
 * coordinates, so a card's `overflow-hidden` can never clip it.
 * Closes on outside click and Escape; exposes aria-haspopup/expanded.
 */
export function ActionMenu({ label, items, direction = "down", className }: ActionMenuProps) {
  const [open, setOpen] = React.useState(false);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);

  // Measure the trigger and the panel, then place the panel imperatively.
  // Runs in a layout effect (before paint) so the panel never flashes.
  const place = React.useCallback(() => {
    const panel = panelRef.current;
    const button = buttonRef.current;
    if (!panel || !button) return;
    const b = button.getBoundingClientRect();
    const width = panel.offsetWidth;
    const height = panel.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const roomBelow = vh - b.bottom - GAP;
    const roomAbove = b.top - GAP;
    let down = direction === "down";
    if (down ? roomBelow < height && roomAbove > roomBelow : roomAbove < height && roomBelow > roomAbove) {
      down = !down;
    }
    const top = down ? b.bottom + GAP : b.top - GAP - height;
    panel.style.top = `${Math.min(Math.max(EDGE, top), Math.max(EDGE, vh - height - EDGE))}px`;
    panel.style.left = `${Math.min(Math.max(EDGE, b.right - width), vw - width - EDGE)}px`;
  }, [direction]);

  React.useLayoutEffect(() => {
    if (!open) return;
    place();
    const onMove = () => place();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, place]);

  return (
    <div className={cn("relative inline-block", className)}>
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="p-1.5 text-slate-400 hover:text-[#111111] hover:bg-slate-100 rounded-md transition-colors"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-40 cursor-default"
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />
            <div
              ref={panelRef}
              role="menu"
              style={{ top: -9999, left: -9999 }}
              className="fixed w-44 bg-white border border-[#DADADA] rounded-md shadow-lg z-50 py-1"
            >
              {items.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    // Hand focus back to the trigger before running the item, so a
                    // dialog opened from here can restore it on close.
                    buttonRef.current?.focus();
                    item.onSelect();
                  }}
                  className={cn(
                    "w-full text-left px-4 py-2 text-[12.5px] flex items-center gap-2 transition-colors",
                    item.danger
                      ? "text-[#C4644C] hover:bg-[#F7F7F7]"
                      : "text-[#111111] hover:bg-slate-50"
                  )}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>
          </>,
          document.body
        )}
    </div>
  );
}
