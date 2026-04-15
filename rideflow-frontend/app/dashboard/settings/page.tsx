"use client";

import React, { useState, useEffect } from "react";
import { 
  User, 
  Shield, 
  Bell, 
  Settings as SettingsIcon, 
  LogOut, 
  Check, 
  Loader2, 
  Globe, 
  Palette, 
  IndianRupee,
  Camera
} from "lucide-react";
import toast from "react-hot-toast";
import { apiFetch } from "../../../lib/api";
import { logout } from "../../../lib/auth";

export default function SettingsPage() {
  const [tab, setTab] = useState("Profile");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const data = await apiFetch("/auth/me");
    if (data) setUser(data);
  };

  const handleSave = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      const path = tab === "Profile" ? "/auth/profile" : "/auth/password";
      const res = await apiFetch(path, {
        method: "PUT",
        body: JSON.stringify({
          name: user.name,
          email: user.email,
          gender: user.gender,
          phone: user.phone
        })
      });
      if (res) toast.success("Account updated successfully! ✨");
    } catch (err) {
      toast.error("Update failed");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { name: "Profile", icon: <User size={18} /> },
    { name: "Security", icon: <Shield size={18} /> },
    { name: "Preferences", icon: <SettingsIcon size={18} /> }
  ];

  return (
    <div className="max-w-5xl mx-auto py-4">
      <div className="flex flex-col lg:flex-row gap-12">
        {/* NAV TABS */}
        <aside className="lg:w-72 space-y-2">
          {tabs.map((t) => (
            <button
              key={t.name}
              onClick={() => setTab(t.name)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-200 outline-none ${
                tab === t.name 
                  ? "bg-white text-[#10B981] font-bold shadow-sm border border-gray-100" 
                  : "text-[#6B7280] hover:bg-white/50 hover:text-[#111827]"
              }`}
            >
              <div className={`${tab === t.name ? 'text-[#10B981]' : 'text-gray-400'}`}>
                {t.icon}
              </div>
              <span className="text-base">{t.name}</span>
            </button>
          ))}
          <div className="h-px bg-gray-200 my-8 opacity-50" />
          <button 
            onClick={() => { logout(); window.location.href = "/"; }}
            className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-red-500 hover:bg-red-50 font-bold transition-all outline-none"
          >
            <LogOut size={18} />
            Logout Account
          </button>
        </aside>

        {/* CONTENT */}
        <div className="flex-1">
          <div className="card-white p-10 lg:p-12">
            <h2 className="text-3xl font-extrabold text-[#111827] mb-12 tracking-tight">{tab} Management</h2>
            
            <form onSubmit={handleSave} className="space-y-10">
              {tab === "Profile" && (
                <div className="space-y-10 animate-in fade-in duration-300">
                  <div className="flex items-center gap-8">
                    <div className="relative group">
                      <div className="w-24 h-24 rounded-3xl bg-[#F8F9FB] border-2 border-gray-100 overflow-hidden flex items-center justify-center text-3xl font-extrabold text-[#10B981] group-hover:border-[#10B981]/50 transition-all">
                        {user?.name?.charAt(0) || "U"}
                      </div>
                      <button type="button" className="absolute -bottom-2 -right-2 bg-white border border-gray-200 p-2 shadow-lg rounded-xl text-gray-500 hover:text-[#10B981] transition-colors outline-none">
                        <Camera size={16} />
                      </button>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-[#111827]">{user?.name || "Loading..."}</h4>
                      <p className="text-sm font-bold uppercase tracking-widest text-[#10B981] mt-1">Commuter Pro</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <SettingInput label="Display Name" val={user?.name} onChange={(v: string) => setUser({ ...user, name: v })} />
                    <SettingInput label="Email Address" val={user?.email} disabled />
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9CA3AF]">Gender</label>
                       <select 
                         className="input-base"
                         value={user?.gender || ""}
                         onChange={(e) => setUser({ ...user, gender: e.target.value })}
                       >
                         <option value="" disabled>Select gender</option>
                         <option value="male">Male</option>
                         <option value="female">Female</option>
                         <option value="other">Other</option>
                       </select>
                    </div>
                    <SettingInput label="Phone Number" val={user?.phone} onChange={(v: string) => setUser({ ...user, phone: v })} />
                  </div>
                </div>
              )}

              {tab === "Security" && (
                <div className="space-y-8 animate-in fade-in duration-300">
                  <SettingInput label="Current Password" type="password" placeholder="••••••••" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <SettingInput label="New Password" type="password" />
                    <SettingInput label="Confirm New Password" type="password" />
                  </div>
                  <div className="p-5 bg-[#F8F9FB] border border-gray-100 rounded-2xl flex items-center gap-4 text-xs text-[#6B7280]">
                     <div className="w-6 h-6 rounded-full bg-[#10B981]/10 flex items-center justify-center text-[#10B981] shrink-0">
                       <Check size={14} />
                     </div>
                     Account security is active. Changing your password will require re-authentication on all devices.
                  </div>
                </div>
              )}

              {tab === "Preferences" && (
                <div className="space-y-8 animate-in fade-in duration-300">
                  <ToggleItem label="Smart Notifications" desc="Get real-time insights based on your morning commute." active />
                  <ToggleItem label="Eco Mode" desc="Prioritize low-emission suggestions in your analytics." active />
                  <div className="h-px bg-gray-100 my-4" />
                  <div className="md:w-1/2">
                     <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9CA3AF] mb-3 block">Base Cost per KM (₹)</label>
                     <div className="relative">
                        <IndianRupee size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="number" className="input-base pl-12" defaultValue={18} />
                     </div>
                  </div>
                </div>
              )}

              <div className="mt-12 flex justify-end pt-10 border-t border-gray-50">
                <button 
                  type="submit"
                  disabled={loading}
                  className="btn-primary min-w-[160px] py-4 shadow-xl shadow-[#10B981]/20"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : "Update Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingInput({ label, val = "", placeholder = "", type = "text", disabled = false, onChange }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9CA3AF]">{label}</label>
      <input 
        type={type}
        disabled={disabled}
        defaultValue={val}
        placeholder={placeholder}
        onChange={(e) => onChange && onChange(e.target.value)}
        className={`input-base ${disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed border-none' : ''}`}
      />
    </div>
  );
}

function ToggleItem({ label, desc, active = false }: any) {
  const [on, setOn] = useState(active);
  return (
    <div className="flex items-center justify-between p-2">
      <div>
        <h4 className="text-base font-bold text-[#111827]">{label}</h4>
        <p className="text-sm text-[#6B7280]">{desc}</p>
      </div>
      <button 
        type="button"
        onClick={() => setOn(!on)}
        className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 outline-none ${
          on ? 'bg-[#10B981]' : 'bg-gray-200'
        }`}
      >
        <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ${on ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}
