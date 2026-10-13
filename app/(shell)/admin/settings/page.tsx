"use client";

import * as React from "react";

export default function AdminSettingsPage() {
  return (
    <div className="max-w-[800px] mx-auto pb-12 space-y-8 bg-[#F8FAFC]">
      <div>
        <h1 className="text-[28px] font-bold text-[#172033] font-heading tracking-tight">Settings</h1>
        <p className="text-[14px] text-[#64748B] mt-1">Configure platform rules and defaults.</p>
      </div>

      <div className="space-y-6">
        {/* Section 1 */}
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-6 shadow-sm">
          <h2 className="text-[16px] font-bold text-[#172033] mb-4">Platform</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-[13px] font-semibold text-[#334155] mb-1.5">Application name</label>
              <input type="text" defaultValue="Course Q&A & Syllabus Agent" className="w-full max-w-md bg-slate-50 border border-[#E2E8F0] rounded-md px-3 py-2 text-[13.5px] text-[#172033] outline-none focus:border-[#2563EB]" />
            </div>
          </div>
        </div>

        {/* Section 2 */}
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-6 shadow-sm">
          <h2 className="text-[16px] font-bold text-[#172033] mb-4">File uploads</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-[13px] font-semibold text-[#334155] mb-1.5">Allowed file types</label>
              <input type="text" defaultValue="PDF, DOC, DOCX, PPT, PPTX, XLSX" className="w-full max-w-md bg-slate-50 border border-[#E2E8F0] rounded-md px-3 py-2 text-[13.5px] text-[#172033] outline-none focus:border-[#2563EB]" />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-[#334155] mb-1.5">Maximum file size (MB)</label>
              <input type="number" defaultValue={20} className="w-24 bg-slate-50 border border-[#E2E8F0] rounded-md px-3 py-2 text-[13.5px] text-[#172033] outline-none focus:border-[#2563EB]" />
            </div>
          </div>
        </div>

        {/* Section 3 */}
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-6 shadow-sm">
          <h2 className="text-[16px] font-bold text-[#172033] mb-4">Class access</h2>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-[#2563EB] border-[#E2E8F0]" />
              <span className="text-[13.5px] text-[#334155]">Allow Teachers to create classes</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-[#2563EB] border-[#E2E8F0]" />
              <span className="text-[13.5px] text-[#334155]">Allow Students to join using class code</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded text-[#2563EB] border-[#E2E8F0]" />
              <span className="text-[13.5px] text-[#334155]">Require Teacher approval before joining</span>
            </label>
          </div>
        </div>

        {/* Section 4 */}
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-6 shadow-sm">
          <h2 className="text-[16px] font-bold text-[#172033] mb-4">Moderation</h2>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-[#2563EB] border-[#E2E8F0]" />
              <span className="text-[13.5px] text-[#334155]">Allow content reports</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-[#2563EB] border-[#E2E8F0]" />
              <span className="text-[13.5px] text-[#334155]">Allow user/account reports</span>
            </label>
          </div>
        </div>

        {/* Section 5 */}
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-6 shadow-sm">
          <h2 className="text-[16px] font-bold text-[#172033] mb-4">Role overview</h2>
          <div className="space-y-4">
            <div className="flex gap-4 p-3 bg-slate-50 border border-slate-100 rounded-md">
              <span className="text-[12px] font-bold text-[#2563EB] uppercase tracking-wider w-20 shrink-0">Student</span>
              <span className="text-[13px] text-[#64748B]">access class materials, use Q&A Agent, manage own proposals</span>
            </div>
            <div className="flex gap-4 p-3 bg-slate-50 border border-slate-100 rounded-md">
              <span className="text-[12px] font-bold text-[#16A34A] uppercase tracking-wider w-20 shrink-0">Teacher</span>
              <span className="text-[13px] text-[#64748B]">create and manage classes, syllabus, resources, tickets, and members</span>
            </div>
            <div className="flex gap-4 p-3 bg-slate-50 border border-slate-100 rounded-md">
              <span className="text-[12px] font-bold text-[#9333EA] uppercase tracking-wider w-20 shrink-0">Admin</span>
              <span className="text-[13px] text-[#64748B]">manage users, view basic class information, review reports, configure platform settings</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
          <button className="px-4 py-2 text-[13px] font-semibold text-[#64748B] hover:bg-slate-100 rounded-md transition-colors">Discard changes</button>
          <button className="px-4 py-2 bg-[#2563EB] text-white text-[13px] font-semibold rounded-md hover:bg-blue-700 transition-colors shadow-sm">Save settings</button>
        </div>
      </div>
    </div>
  );
}
