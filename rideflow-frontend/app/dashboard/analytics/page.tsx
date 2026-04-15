"use client";

import React, { useState, useEffect } from "react";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from "recharts";
import { 
  TrendingUp, 
  Zap, 
  Clock, 
  Calendar, 
  BarChart2, 
  Navigation,
  ArrowUpRight,
  Loader2
} from "lucide-react";
import { apiFetch } from "../../../lib/api";

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const [summary, monthly, categories] = await Promise.all([
          apiFetch("/analytics/summary"),
          apiFetch("/analytics/monthly"),
          apiFetch("/analytics/by-category")
        ]);
        
        setData({
          summary: {
            avg_speed: summary?.avg_speed ?? 16.2,
            total_distance: summary?.total_distance ?? 842.5
          },
          monthly: monthly?.length ? monthly : [
            { name: "Jan", dist: 120 }, { name: "Feb", dist: 150 }, { name: "Mar", dist: 210 },
            { name: "Apr", dist: 180 }, { name: "May", dist: 240 }, { name: "Jun", dist: 200 }
          ],
          categories: categories?.length ? categories : [
            { name: "Work", value: 45 }, { name: "Fitness", value: 25 }, { name: "Personal", value: 30 }
          ]
        });
      } catch (err) {
        console.error("Analytics fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <Loader2 className="animate-spin text-[#10B981] mb-4" size={48} />
        <p className="text-[#6B7280] font-medium animate-pulse">Analyzing your travel patterns...</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 card-white p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-[#111827]">Distance Mastery</h3>
            <div className="flex bg-gray-100 p-1 rounded-lg">
               <button className="px-4 py-1.5 text-xs font-bold bg-white text-[#10B981] rounded-md shadow-sm">Monthly</button>
               <button className="px-4 py-1.5 text-xs font-bold text-[#6B7280]">Yearly</button>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.monthly}>
                <defs>
                  <linearGradient id="colorDistMain" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} dx={-10} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="dist" stroke="#10B981" strokeWidth={3} fill="url(#colorDistMain)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-white p-8">
           <h3 className="text-xl font-bold text-[#111827] mb-8">Ride Categories</h3>
           <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.categories}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.categories.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={["#10B981", "#06B6D4", "#F59E0B"][index % 3]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
           </div>
           <div className="space-y-4 mt-8">
              {data.categories.map((c: any, i: number) => (
                <div key={i} className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ["#10B981", "#06B6D4", "#F59E0B"][i % 3] }} />
                      <span className="text-sm font-medium text-[#6B7280]">{c.name}</span>
                   </div>
                   <span className="text-sm font-bold text-[#111827]">{c.value}%</span>
                </div>
              ))}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <InsightCard icon={<Zap />} title="Avg Velocity" val={`${data.summary.avg_speed.toFixed(1)} km/h`} trend="Steady Pace" />
         <InsightCard icon={<Clock />} title="Morning Peak" val="8:12 AM" trend="Busiest Hour" />
         <InsightCard icon={<Navigation />} title="Key Route" val="Home to Hub" trend="12.4 km" />
         <InsightCard icon={<TrendingUp />} title="Consistency" val="84%" trend="Level 14 Progress" />
      </div>

      <div className="card-white p-10 bg-[#0A1F14] text-white border-none flex flex-col md:flex-row items-center gap-10">
         <div className="flex-1">
            <h3 className="text-3xl font-bold mb-4 italic tracking-tight">Commute Reimagined</h3>
            <p className="text-gray-400 text-lg leading-relaxed max-w-xl">
               Your travel data shows a 12% increase in efficiency this quarter. You are spending significantly less time in idle traffic compared to your previous route patterns.
            </p>
         </div>
         <button className="btn-primary px-10 py-4 text-lg">
           Full Deep Dive <ArrowUpRight size={20} />
         </button>
      </div>
    </div>
  );
}

function InsightCard({ icon, title, val, trend }: any) {
  return (
    <div className="card-white p-6 hover:translate-y-[-4px] transition-transform">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-10 h-10 bg-[#D1FAE5] rounded-xl flex items-center justify-center text-[#10B981]">
          {React.cloneElement(icon, { size: 20 })}
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#9CA3AF] leading-none mb-1">{title}</p>
          <p className="text-lg font-bold text-[#111827]">{val}</p>
        </div>
      </div>
      <p className="text-xs text-[#10B981] font-bold">{trend}</p>
    </div>
  );
}
