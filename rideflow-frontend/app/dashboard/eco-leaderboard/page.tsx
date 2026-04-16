"use client";

import React, { useEffect, useState } from "react";
import { apiFetch } from "../../../lib/api";
import { Loader2, Leaf, Trophy, TrendingUp, Info } from "lucide-react";

export default function EcoLeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userTotal, setUserTotal] = useState(0);

  const fetchStats = async () => {
    try {
      const data = await apiFetch("/booking/eco/leaderboard");
      setLeaderboard(data);
      
      // Calculate current user's total for the tree (simplified for demo)
      const total = data.reduce((acc: number, item: any) => acc + item.co2, 0) / 5; 
      setUserTotal(total);
    } catch (err) {
      console.error("Failed to fetch leaderboard", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatCO2 = (grams: number) => {
    if (grams < 1000) return `${Math.round(grams)}g`;
    return `${(grams / 1000).toFixed(1)} kg`;
  };

  if (loading) {
    return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="animate-spin text-[#10B981]" size={48} /></div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in zoom-in duration-500 max-w-6xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
           <h1 className="text-4xl font-black text-[#111827] tracking-tight flex items-center gap-3">
             Eco Warriors <Leaf className="text-[#10B981]" size={32} />
           </h1>
           <p className="text-gray-500 mt-2 font-medium">Join the green revolution. Every gram of CO₂ saved helps our planet breathe.</p>
        </div>
        <div className="bg-[#10B981]/10 px-6 py-3 rounded-2xl border border-[#10B981]/20 flex items-center gap-3">
           <Trophy className="text-amber-500" size={24} />
           <div>
              <p className="text-[10px] font-black text-[#10B981] uppercase tracking-widest">Your Impact</p>
              <p className="text-xl font-black text-[#111827]">{formatCO2(userTotal)} saved</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEADERBOARD COLUMN */}
        <div className="lg:col-span-2 space-y-6">
           <div className="card-white p-8">
              <h3 className="text-xl font-bold text-[#111827] mb-8 flex items-center gap-2">
                <TrendingUp size={20} className="text-[#10B981]"/> Top Contributors
              </h3>
              
              <div className="space-y-4">
                {leaderboard.map((player, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-[#10B981]/30 transition-all group">
                    <div className="flex items-center gap-4">
                       <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${
                         idx === 0 ? 'bg-amber-100 text-amber-600 shadow-sm' : 
                         idx === 1 ? 'bg-slate-100 text-slate-500' :
                         idx === 2 ? 'bg-orange-50 text-orange-600' : 'bg-white text-gray-400'
                       }`}>
                         {idx + 1}
                       </div>
                       <div>
                          <p className="font-bold text-[#111827]">{player.name}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">RideFlow Legend</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-lg font-black text-[#10B981]">{formatCO2(player.co2)}</p>
                       <div className="w-24 h-1.5 bg-gray-200 rounded-full mt-1 overflow-hidden">
                          <div 
                            className="h-full bg-[#10B981] rounded-full transition-all duration-1000" 
                            style={{ width: `${Math.min(100, (player.co2 / leaderboard[0].co2) * 100)}%` }} 
                          />
                       </div>
                    </div>
                  </div>
                ))}
              </div>
           </div>

           <div className="card-white p-6 bg-blue-50 border-blue-100 flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                 <Info size={20} />
              </div>
              <div>
                 <h4 className="font-bold text-blue-900">How is this calculated?</h4>
                 <p className="text-sm text-blue-700/80 mt-1 leading-relaxed">
                   We compare your ride&apos;s emissions with a standard 170g/km baseline. By choosing smaller vehicles, bikes, or shared rides, you contribute to a sustainable future.
                 </p>
              </div>
           </div>
        </div>

        {/* TREE COLUMN */}
        <div className="space-y-6">
           <div className="card-white p-8 bg-[#0A1F14] text-white overflow-hidden relative min-h-[500px] flex flex-col items-center justify-around">
              <div className="text-center">
                 <h3 className="text-2xl font-black mb-2">My Eco Tree</h3>
                 <p className="text-gray-400 text-sm font-medium">Watch your impact grow</p>
              </div>

              {/* ANIMATED TREE SVG */}
              <div className="relative w-64 h-64 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_20px_50px_rgba(16,185,129,0.3)]">
                   {/* Trunk */}
                   <path 
                     d="M48 95 L52 95 L51 60 L49 60 Z" 
                     fill="#422918" 
                     className="animate-in slide-in-from-bottom duration-1000"
                   />
                   
                   {/* Leaves (Size scales with userTotal) */}
                   <circle 
                     cx="50" cy="55" r={Math.min(25, 5 + (userTotal / 100))} 
                     fill="#10B981" 
                     className="transition-all duration-1000 ease-out opacity-80" 
                   />
                   <circle 
                     cx="40" cy="45" r={Math.min(20, 2 + (userTotal / 150))} 
                     fill="#059669" 
                     className="transition-all duration-1000 ease-out delay-100 opacity-90" 
                   />
                   <circle 
                     cx="60" cy="45" r={Math.min(20, 2 + (userTotal / 150))} 
                     fill="#059669" 
                     className="transition-all duration-1000 ease-out delay-200 opacity-90" 
                   />
                   <circle 
                     cx="50" cy="30" r={Math.min(15, 1 + (userTotal / 200))} 
                     fill="#34D399" 
                     className="transition-all duration-1000 ease-out delay-300 opacity-95" 
                   />

                   {/* Blossoms if high impact */}
                   {userTotal > 5000 && (
                     <>
                       <circle cx="45" cy="40" r="2" fill="#F472B6" className="animate-pulse" />
                       <circle cx="55" cy="35" r="2" fill="#F472B6" className="animate-pulse delay-500" />
                       <circle cx="50" cy="48" r="2" fill="#F472B6" className="animate-pulse delay-700" />
                     </>
                   )}
                </svg>
              </div>

              <div className="text-center w-full">
                 <div className="inline-block bg-white/10 px-4 py-2 rounded-full mb-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#10B981]">Stage: {userTotal < 1000 ? 'Sapling' : userTotal < 5000 ? 'Young Tree' : 'Ancient Oak'}</p>
                 </div>
                 <p className="text-xs text-gray-400 font-medium px-4">Great job! You&apos;ve offset as much CO₂ as a young tree does in 6 months.</p>
              </div>
           </div>

           <div className="card-white p-6 border-l-4 border-amber-500">
              <h4 className="font-bold text-gray-800">Next Milestone</h4>
              <div className="mt-4 flex items-center justify-between text-sm">
                 <span className="text-gray-500 font-medium">Reach 5kg</span>
                 <span className="text-[#10B981] font-black">+{formatCO2(Math.max(0, 5000 - userTotal))} left</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full mt-2">
                 <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(100, (userTotal / 5000) * 100)}%` }} />
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}
