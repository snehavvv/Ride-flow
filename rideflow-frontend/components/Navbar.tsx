"use client";

import React, { useState } from "react";
import { Bell, User, Search, Settings, LogOut, Check } from "lucide-react";

export default function Navbar() {
  const [unreadCount, setUnreadCount] = useState(3);
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <nav className="h-20 bg-white/5 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-8 sticky top-0 z-40">
      <div className="flex items-center gap-6 flex-1">
        <div className="relative max-w-md w-full group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-blue-400 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search rides, goals, or analytics..." 
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all placeholder:text-white/20"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all relative group"
          >
            <Bell size={20} className="text-white/60 group-hover:text-white transition-colors" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 border-2 border-[#050505] rounded-full text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-[#0a0a0b] border border-white/10 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in duration-200">
              <div className="flex justify-between items-center mb-4 px-2">
                <h4 className="font-bold font-outfit">Notifications</h4>
                <button className="text-[10px] uppercase tracking-widest text-blue-400 font-bold hover:text-blue-300">Mark all read</button>
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                <NotificationItem 
                  title="Goal Completed! 🎉" 
                  message="You hit your 100 km weekly distance goal." 
                  time="2m ago"
                  unread
                />
                <NotificationItem 
                  title="Milestone Reached" 
                  message="Congratulations on crossing 500km total!" 
                  time="1h ago"
                  unread
                />
                <NotificationItem 
                  title="Weekly Insight" 
                  message="Your commute efficiency improved by 12%." 
                  time="Yesterday"
                />
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-4 border-l border-white/10">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold">Alex Ross</p>
            <p className="text-[10px] uppercase tracking-tighter text-white/40">Premium Account</p>
          </div>
          <button className="w-10 h-10 rounded-xl border border-white/10 overflow-hidden hover:border-blue-500/50 transition-colors shadow-lg shadow-black/40">
            <img src="https://ui-avatars.com/api/?name=Alex+Ross&background=0284c7&color=fff" alt="User" />
          </button>
        </div>
      </div>
    </nav>
  );
}

function NotificationItem({ title, message, time, unread = false }) {
  return (
    <div className={`p-3 rounded-xl border border-white/5 transition-all hover:bg-white/5 cursor-pointer flex gap-3 ${unread ? 'bg-blue-500/5' : ''}`}>
      <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${unread ? 'bg-blue-500' : 'bg-transparent'}`} />
      <div className="flex-1">
        <p className="text-sm font-bold mb-0.5">{title}</p>
        <p className="text-xs text-white/50 leading-relaxed mb-1">{message}</p>
        <p className="text-[10px] text-white/20 uppercase font-medium">{time}</p>
      </div>
    </div>
  );
}
