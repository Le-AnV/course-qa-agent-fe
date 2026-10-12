"use client";

import * as React from "react";
import { Save } from "lucide-react";

export default function AccountPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-xl font-bold text-[#172033]">Account</h1>
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-lg p-6">
        <h3 className="text-[14px] font-bold text-[#172033] mb-4">Profile</h3>
        <div className="flex items-center gap-4 mb-4">
          <img
            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&auto=format&fit=crop&q=80"
            alt="Avatar"
            className="w-16 h-16 rounded-full object-cover border border-[#E2E8F0]"
          />
          <button className="text-[12.5px] font-medium text-[#2563EB] hover:underline">
            Change avatar
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[12.5px] font-semibold text-[#64748B] mb-1">Full name</label>
            <input type="text" defaultValue="Nguyễn Văn Minh" className="w-full p-2.5 bg-white border border-[#E2E8F0] rounded text-[13px] text-[#172033] outline-none focus:border-[#2563EB]" />
          </div>
          <div>
            <label className="block text-[12.5px] font-semibold text-[#64748B] mb-1">Email</label>
            <input type="email" defaultValue="minh.nv@university.edu.vn" className="w-full p-2.5 bg-white border border-[#E2E8F0] rounded text-[13px] text-[#172033] outline-none focus:border-[#2563EB]" />
          </div>
          <div>
            <label className="block text-[12.5px] font-semibold text-[#64748B] mb-1">Role</label>
            <input type="text" value="Teacher" disabled className="w-full p-2.5 bg-slate-50 border border-[#E2E8F0] rounded text-[13px] text-[#64748B] outline-none cursor-not-allowed" />
          </div>
        </div>

        <button className="mt-5 px-4 py-2 bg-[#2563EB] text-white rounded text-[13px] font-semibold hover:bg-blue-700 transition-colors">
          Save changes
        </button>
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-lg p-6">
        <h3 className="text-[14px] font-bold text-[#172033] mb-4">Security</h3>
        <button className="px-4 py-2 border border-[#E2E8F0] rounded text-[13px] font-medium text-[#172033] hover:bg-slate-50 transition-colors">
          Change password
        </button>
      </div>
    </div>
  );
}
