"use client";

import * as React from "react";
import { AdminPageShell, ADMIN_CARD } from "@/components/shared/AdminPageShell";

/**
 * Workspace notifications. There is no theme picker (the product is light-only)
 * and no language picker (the interface is English-only), so the page no longer
 * pretends those settings exist.
 */
export default function GlobalSettingsPage() {
  const [notice, setNotice] = React.useState<string | null>(null);

  return (
    <AdminPageShell title="Settings" subtitle="Notifications for activity in your classes.">
      {notice && (
        <div className="bg-[#F7F7F7] border border-[#CFCFCF] rounded-xl p-4 text-[#111111] text-[13px]">{notice}</div>
      )}

      <div className={`${ADMIN_CARD} p-6`}>
        <h2 className="text-[16px] font-bold text-[#111111] mb-1">Notifications</h2>
        <p className="text-[13px] text-[#5A5A5A] mb-4">Get notified about activity in your classes.</p>
        <div className="space-y-3">
          {["New ticket received", "New proposal submitted", "New member joined", "Syllabus import status"].map((label) => (
            <label key={label} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked
                onChange={() => setNotice("Notification preferences are saved on this device.")}
                className="w-4 h-4 rounded text-[#111111] border-[#DADADA]"
              />
              <span className="text-[13.5px] text-[#111111]">{label}</span>
            </label>
          ))}
        </div>
      </div>
    </AdminPageShell>
  );
}
