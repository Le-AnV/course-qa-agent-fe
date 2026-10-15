"use client";

import * as React from "react";
import { AdminPageShell, ADMIN_CARD } from "@/components/shared/AdminPageShell";

export default function GlobalSettingsPage() {
  const [theme, setTheme] = React.useState("light");
  const [language, setLanguage] = React.useState("en");
  const [notice, setNotice] = React.useState<string | null>(null);
  const initial = React.useRef({ theme: "light", language: "en" });
  const dirty = theme !== initial.current.theme || language !== initial.current.language;

  function handleSave() {
    initial.current = { theme, language };
    setNotice("Settings saved.");
  }

  function handleDiscard() {
    setTheme(initial.current.theme);
    setLanguage(initial.current.language);
    setNotice(null);
  }

  return (
    <AdminPageShell title="Settings" subtitle="Appearance, notifications and language for your workspace.">
      {notice && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-emerald-700 text-[13px]">{notice}</div>
      )}

      <div className={`${ADMIN_CARD} p-6`}>
        <h2 className="text-[16px] font-bold text-[#172033] mb-1">Appearance</h2>
        <p className="text-[13px] text-[#64748B] mb-4">Choose how the interface looks on this device.</p>
        <div className="space-y-2">
          {["light", "dark", "system"].map((t) => (
            <label key={t} className={`flex items-center gap-2.5 p-2.5 rounded border cursor-pointer transition-colors ${theme === t ? "border-[#2563EB] bg-[#EAF2FF]" : "border-[#E2E8F0] hover:bg-slate-50"}`}>
              <input type="radio" name="theme" checked={theme === t} onChange={() => { setTheme(t); setNotice(null); }} className="hidden" />
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${theme === t ? "border-[#2563EB]" : "border-slate-300"}`}>
                {theme === t && <div className="w-2 h-2 rounded-full bg-[#2563EB]" />}
              </div>
              <span className="text-[13px] text-[#172033] capitalize">{t} theme</span>
            </label>
          ))}
        </div>
      </div>

      <div className={`${ADMIN_CARD} p-6`}>
        <h2 className="text-[16px] font-bold text-[#172033] mb-1">Notifications</h2>
        <p className="text-[13px] text-[#64748B] mb-4">Get notified about activity in your classes.</p>
        <div className="space-y-3">
          {["New ticket received", "New proposal submitted", "New member joined", "Syllabus import status"].map((label) => (
            <label key={label} className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-[#2563EB] border-[#E2E8F0]" />
              <span className="text-[13.5px] text-[#334155]">{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className={`${ADMIN_CARD} p-6`}>
        <h2 className="text-[16px] font-bold text-[#172033] mb-1">Language</h2>
        <p className="text-[13px] text-[#64748B] mb-4">Pick the display language.</p>
        <div className="space-y-2">
          {[
            { id: "vi", label: "Tiếng Việt" },
            { id: "en", label: "English" },
          ].map((l) => (
            <label key={l.id} className={`flex items-center gap-2.5 p-2.5 rounded border cursor-pointer transition-colors ${language === l.id ? "border-[#2563EB] bg-[#EAF2FF]" : "border-[#E2E8F0] hover:bg-slate-50"}`}>
              <input type="radio" name="language" checked={language === l.id} onChange={() => { setLanguage(l.id); setNotice(null); }} className="hidden" />
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${language === l.id ? "border-[#2563EB]" : "border-slate-300"}`}>
                {language === l.id && <div className="w-2 h-2 rounded-full bg-[#2563EB]" />}
              </div>
              <span className="text-[13px] text-[#172033]">{l.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
        <button onClick={handleDiscard} className="px-4 py-2 text-[13px] font-semibold text-[#64748B] hover:bg-slate-100 rounded-md transition-colors">
          Discard changes
        </button>
        <button onClick={handleSave} disabled={!dirty}
          className="px-4 py-2 bg-[#2563EB] text-white text-[13px] font-semibold rounded-md hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50">
          Save settings
        </button>
      </div>
    </AdminPageShell>
  );
}
