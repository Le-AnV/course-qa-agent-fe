"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  widthClass?: string;
}

export function Modal({ isOpen, onClose, title, subtitle, children, widthClass = "max-w-md" }: ModalProps) {
  const titleId = React.useId();
  const panelRef = React.useRef<HTMLDivElement | null>(null);
  // Held in a ref so the open/close effect can depend on `isOpen` alone: an
  // inline `onClose` would otherwise re-run it every render and re-steal focus.
  const onCloseRef = React.useRef(onClose);
  React.useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  React.useEffect(() => {
    if (!isOpen) return;
    // The opener (row action, menu item, ...) gets focus back on close, so
    // keyboard users do not land on <body> after dismissing the dialog.
    const restoreTo = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    // Radix Select restores focus to its trigger when it closes. If a dialog
    // opens from that selection, re-assert focus inside after that handoff.
    const focusTimer = window.setTimeout(() => {
      if (panelRef.current?.isConnected) panelRef.current.focus();
    }, 0);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) {
        event.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;
      // The panel itself counts as outside so the first Shift+Tab wraps to the
      // last control instead of escaping to the page behind the dialog.
      const insideDialog =
        !!active && panelRef.current.contains(active) && active !== panelRef.current;
      if (insideDialog && !(event.shiftKey ? active === first : active === last)) return;
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKeyDown, true);
      if (restoreTo?.isConnected) restoreTo.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-[#111111]/25 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          "relative w-full bg-white rounded-2xl border border-[#DADADA] shadow-lg overflow-hidden flex flex-col focus:outline-none",
          widthClass
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0F0F0]">
          <div>
            <h2 id={titleId} className="text-[17px] font-semibold text-[#111111]">{title}</h2>
            {subtitle && <p className="text-[13px] text-[#5A5A5A] mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 text-[#6F6F6F] hover:text-[#111111] hover:bg-[#F7F7F7] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(100vh-150px)]">
          {children}
        </div>
      </div>
    </div>
  );
}
