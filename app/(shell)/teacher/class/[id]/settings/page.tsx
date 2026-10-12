"use client";

import * as React from "react";
import { Save, AlertTriangle } from "lucide-react";

export default function ClassSettingsPage() {
  const ACCENT_COLORS = ['#2563EB','#0EA5E9','#6366F1','#10B981','#F59E0B','#64748B'];
  const [selectedColor, setSelectedColor] = React.useState(ACCENT_COLORS[0]);

  return (
    <div className="max-w-3xl space-y-6 pb-12">
      <div>
        <h2 className="text-xl font-bold text-[#172033]">Course Settings</h2>
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-lg p-6">
        <h3 className="text-[14px] font-bold text-[#2563EB] mb-4">1. General</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-[12.5px] font-semibold text-[#64748B] mb-1">Course title</label>
            <input type="text" defaultValue="Introduction to Artificial Intelligence" className="w-full p-2.5 bg-white border border-[#E2E8F0] rounded text-[13px] text-[#172033] outline-none focus:border-[#2563EB]" />
          </div>
          <div>
            <label className="block text-[12.5px] font-semibold text-[#64748B] mb-1">Course code <span className="font-normal">(Optional)</span></label>
            <input type="text" defaultValue="CS 401" className="w-full p-2.5 bg-white border border-[#E2E8F0] rounded text-[13px] text-[#172033] outline-none focus:border-[#2563EB]" />
          </div>
          <div>
            <label className="block text-[12.5px] font-semibold text-[#64748B] mb-1">Course description <span className="font-normal">(Optional)</span></label>
            <textarea rows={2} className="w-full p-2.5 bg-white border border-[#E2E8F0] rounded text-[13px] text-[#172033] outline-none focus:border-[#2563EB]" />
          </div>
          <div>
            <label className="block text-[12.5px] font-semibold text-[#64748B] mb-2">Accent color</label>
            <div className="flex items-center gap-3">
              {ACCENT_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setSelectedColor(c)}
                  className={`w-6 h-6 rounded-full border-[2px] transition-all ${selectedColor === c ? 'border-slate-800 scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-lg p-6">
        <h3 className="text-[14px] font-bold text-[#2563EB] mb-4">2. Access</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-[12.5px] font-semibold text-[#64748B] mb-1">Class code</label>
            <input type="text" defaultValue="XYZ-890-ABC" readOnly className="w-full p-2.5 bg-slate-50 border border-[#E2E8F0] rounded text-[13px] text-[#172033] font-mono outline-none" />
          </div>
          <div className="space-y-2 mt-2">
            <label className="flex items-center gap-2.5 text-[13px] text-[#172033] cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4 text-[#2563EB] rounded border-[#E2E8F0]" />
              Allow students to join with class code
            </label>
            <label className="flex items-center gap-2.5 text-[13px] text-[#172033] cursor-pointer">
              <input type="checkbox" className="w-4 h-4 text-[#2563EB] rounded border-[#E2E8F0]" />
              Require approval before students join
            </label>
            <label className="flex items-center gap-2.5 text-[13px] text-[#172033] cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4 text-[#2563EB] rounded border-[#E2E8F0]" />
              Enable student Q&A Agent access
            </label>
          </div>
        </div>
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-lg p-6">
        <h3 className="text-[14px] font-bold text-[#2563EB] mb-4">3. Notifications</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2.5 text-[13px] text-[#172033] cursor-pointer">
            <input type="checkbox" defaultChecked className="w-4 h-4 text-[#2563EB] rounded border-[#E2E8F0]" />
            Notify about new tickets
          </label>
          <label className="flex items-center gap-2.5 text-[13px] text-[#172033] cursor-pointer">
            <input type="checkbox" defaultChecked className="w-4 h-4 text-[#2563EB] rounded border-[#E2E8F0]" />
            Notify about new proposals
          </label>
          <label className="flex items-center gap-2.5 text-[13px] text-[#172033] cursor-pointer">
            <input type="checkbox" defaultChecked className="w-4 h-4 text-[#2563EB] rounded border-[#E2E8F0]" />
            Notify about join requests
          </label>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="flex items-center gap-1.5 px-4 py-2 bg-[#2563EB] text-white rounded text-[13px] font-semibold hover:bg-blue-700 transition-colors">
          <Save className="w-4 h-4" /> Save settings
        </button>
      </div>

      <div className="mt-8 p-5 border border-rose-200 rounded-lg bg-rose-50/40">
        <h3 className="flex items-center gap-2 text-rose-700 font-bold text-[14px] mb-4">
          <AlertTriangle className="w-4 h-4" /> Danger Zone
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-[13px] font-semibold text-[#172033]">Archive class</h4>
              <p className="text-[12.5px] text-[#64748B]">Hide this class from your active list.</p>
            </div>
            <button className="px-4 py-1.5 border border-rose-300 text-rose-700 hover:bg-rose-100 rounded text-[12.5px] font-semibold transition-colors">
              Archive class
            </button>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-rose-200">
            <div>
              <h4 className="text-[13px] font-semibold text-rose-950">Delete class</h4>
              <p className="text-[12.5px] text-[#64748B]">Permanently remove this class and all data.</p>
            </div>
            <button className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[12.5px] font-semibold transition-colors">
              Delete class
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
