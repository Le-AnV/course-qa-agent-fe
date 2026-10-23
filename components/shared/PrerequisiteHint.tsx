"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type Prerequisite = {
  id: string;
  code: string;
  name: string;
};

type PrerequisiteHintProps = {
  items: Prerequisite[];
  className?: string;
};

const GAP = 8;
const EDGE = 8;

/**
 * Hover/focus hint for the prerequisite marker. The panel is portalled to
 * `document.body` and positioned with fixed coordinates, so it cannot grow the
 * page or be clipped by the table card. It flips above the trigger when the
 * bottom of the viewport is too close.
 */
export function PrerequisiteHint({ items, className }: PrerequisiteHintProps) {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const panelId = React.useId();

  const place = React.useCallback(() => {
    const trigger = triggerRef.current;
    const panel = panelRef.current;
    if (!trigger || !panel) return;

    const triggerRect = trigger.getBoundingClientRect();
    const width = panel.offsetWidth;
    const height = panel.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const roomBelow = vh - triggerRect.bottom - GAP;
    const roomAbove = triggerRect.top - GAP;
    const below = roomBelow >= height || roomBelow >= roomAbove;

    const rawTop = below ? triggerRect.bottom + GAP : triggerRect.top - GAP - height;
    const rawLeft = triggerRect.left;

    panel.style.top = `${Math.min(Math.max(EDGE, rawTop), Math.max(EDGE, vh - height - EDGE))}px`;
    panel.style.left = `${Math.min(Math.max(EDGE, rawLeft), Math.max(EDGE, vw - width - EDGE))}px`;
  }, []);

  React.useEffect(() => {
    if (!open) return;

    place();
    const onMove = () => place();
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);

    return () => {
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
    };
  }, [open, place]);

  const label = `Prerequisites: ${items.map((item) => `${item.code} ${item.name}`).join(", ")}`;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-describedby={open ? panelId : undefined}
        aria-expanded={open}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
        }}
        className={cn(
          "inline-flex size-4 items-center justify-center rounded-sm text-[15px] leading-none font-bold text-red-600 outline-none transition-colors hover:text-red-700 focus-visible:ring-2 focus-visible:ring-red-500/20",
          className
        )}
      >
        *
      </button>
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={panelRef}
            id={panelId}
            role="tooltip"
            style={{ top: -9999, left: -9999 }}
            className="pointer-events-none fixed z-[70] w-max max-w-[calc(100vw-16px)] rounded-xl border border-[#DADADA] bg-white px-3.5 py-3 shadow-[0_18px_44px_-16px_rgba(17,17,17,0.28)] sm:max-w-[320px]"
          >
            <p className="text-[10.5px] font-semibold tracking-[0.08em] text-[#8A8A8A] uppercase">
              Prerequisites
            </p>
            <p className="mt-1 text-[12px] font-semibold text-[#111111]">
              Must pass before joining
            </p>
            <ul className="mt-2 space-y-1.5">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start gap-2 text-[11.5px] leading-snug text-[#5A5A5A]"
                >
                  <span className="mt-[5px] size-1 shrink-0 rounded-full bg-[#B9B9B9]" />
                  <span className="min-w-0 [overflow-wrap:anywhere]">
                    <span className="font-semibold text-[#111111]">{item.code}</span>
                    <span className="text-[#8A8A8A]"> - </span>
                    {item.name}
                  </span>
                </li>
              ))}
            </ul>
          </div>,
          document.body
        )}
    </>
  );
}
