"use client";

import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { Modal } from "@/components/shared/Modal";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
  busyLabel?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "default",
  busyLabel = "Working...",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [busy, setBusy] = React.useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      setBusy(true);
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={busy ? () => {} : onCancel} title={title} widthClass="max-w-sm">
      <div className="flex items-start gap-3">
        <span
          className={
            tone === "danger"
              ? "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#ECD2CB] bg-[#FBF5F4] text-[#C4644C]"
              : "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#DADADA] bg-[#F7F7F7] text-[#5A5A5A]"
          }
        >
          <AlertTriangle className="h-4 w-4" />
        </span>
        <div className="text-[13px] leading-relaxed text-[#5A5A5A]">{description}</div>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="rounded-[8px] border border-[#DADADA] bg-white px-3.5 py-2 text-[13px] font-semibold text-[#111111] transition-colors hover:bg-[#F7F7F7] disabled:opacity-50"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={() => void handleConfirm()}
          disabled={busy}
          className={
            tone === "danger"
              ? "rounded-[8px] bg-[#C4644C] px-3.5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[#9D4C38] disabled:opacity-50"
              : "rounded-[8px] border border-[#CFCFCF] bg-white px-3.5 py-2 text-[13px] font-semibold text-[#111111] shadow-xs transition-colors hover:bg-[#F7F7F7] disabled:opacity-50"
          }
        >
          {busy ? busyLabel : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
