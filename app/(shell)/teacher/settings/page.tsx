"use client";

import * as React from "react";
import { Save } from "lucide-react";

export default function GlobalSettingsPage() {
  const [theme, setTheme] = React.useState("light");
  const [language, setLanguage] = React.useState("en");

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-xl font-bold text-[#172033]">Settings</h1>
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-lg p-6">
        <h3 className="text-[14px] font-bold text-[#172033] mb-4">Appearance</h3>
        <div className="space-y-2">
          {["light", "dark", "system"].map(t => (
            <label key={t} className={`flex items-center gap-2.5 p-2.5 rounded border cursor-pointer transition-colors ${theme === t ? 'border-[#2563EB] bg-[#EAF2FF]' : 'border-[#E2E8F0] hover:bg-slate-50'}`}>
              <input type="radio" name="theme" checked={theme === t} onChange={() => setTheme(t)} className="hidden" />
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${theme === t ? 'border-[#2563EB]' : 'border-slate-300'}`}>
                {theme === t && <div className="w-2 h-2 rounded-full bg-[#2563EB]" />}
              </div>
              <span className="text-[13px] text-[#172033] capitalize">{t} theme</span>
            </label>
          ))}
        </div>
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-lg p-6">
        <h3 className="text-[14px] font-bold text-[#172033] mb-4">Notifications</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2.5 text-[13px] text-[#172033] py-2 cursor-pointer">
            <input type="checkbox" defaultChecked className="w-4 h-4 text-[#2563EB] rounded border-[#E2E8F0]" />
            New ticket received
          </label>
          <label className="flex items-center gap-2.5 text-[13px] text-[#172033] py-2 cursor-pointer">
            <input type="checkbox" defaultChecked className="w-4 h-4 text-[#2563EB] rounded border-[#E2E8F0]" />
            New proposal submitted
          </label>
          <label className="flex items-center gap-2.5 text-[13px] text-[#172033] py-2 cursor-pointer">
            <input type="checkbox" defaultChecked className="w-4 h-4 text-[#2563EB] rounded border-[#E2E8F0]" />
            New member joined
          </label>
          <label className="flex items-center gap-2.5 text-[13px] text-[#172033] py-2 cursor-pointer">
            <input type="checkbox" defaultChecked className="w-4 h-4 text-[#2563EB] rounded border-[#E2E8F0]" />
            Syllabus import status
          </label>
        </div>
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-lg p-6">
        <h3 className="text-[14px] font-bold text-[#172033] mb-4">Language</h3>
        <div className="space-y-2">
          {[
            { id: "vi", label: "Tiếng Việt" },
            { id: "en", label: "English" }
          ].map(l => (
            <label key={l.id} className={`flex items-center gap-2.5 p-2.5 rounded border cursor-pointer transition-colors ${language === l.id ? 'border-[#2563EB] bg-[#EAF2FF]' : 'border-[#E2E8F0] hover:bg-slate-50'}`}>
              <input type="radio" name="language" checked={language === l.id} onChange={() => setLanguage(l.id)} className="hidden" />
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${language === l.id ? 'border-[#2563EB]' : 'border-slate-300'}`}>
                {language === l.id && <div className="w-2 h-2 rounded-full bg-[#2563EB]" />}
              </div>
              <span className="text-[13px] text-[#172033]">{l.label}</span>
            </label>
          ))}
        </div>
      </div>

      <button className="px-4 py-2 bg-[#2563EB] text-white rounded text-[13px] font-semibold hover:bg-blue-700 transition-colors">
        Save settings
      </button>
    </div>
  );
}
