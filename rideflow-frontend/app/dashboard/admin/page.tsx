"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Users, Car, ShieldCheck, History, XCircle, CheckCircle2 } from "lucide-react";
import { apiFetch } from "../../../lib/api";
import { toast } from "react-hot-toast";

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (typeof window !== "undefined") {
       const params = new URLSearchParams(window.location.search);
       const tab = params.get("tab");
       if (tab && ["overview", "users", "drivers", "rides"].includes(tab)) {
          setActiveTab(tab);
       }
    }
  }, []);
  
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [rides, setRides] = useState<any[]>([]);

  useEffect(() => {
    loadData();

    // Listen for WebSocket global refresh events
    const handleRefresh = () => {
      loadData();
    };
    window.addEventListener("refresh_data", handleRefresh);
    
    return () => {
      window.removeEventListener("refresh_data", handleRefresh);
    };
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, u, d, r] = await Promise.all([
         apiFetch("/admin/analytics/overview"),
         apiFetch("/admin/users"),
         apiFetch("/admin/drivers"),
         apiFetch("/admin/rides")
      ]);
      setStats(s);
      setUsers(u);
      setDrivers(d);
      setRides(r.reverse()); // latest first
    } catch (err) {
      toast.error("Failed to fetch admin data");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveDriver = async (driverId: string) => {
     try {
        await apiFetch(`/admin/drivers/${driverId}/approve`, { method: "PUT" });
        toast.success("Driver approved!");
        loadData();
     } catch(err) {
        toast.error("Failed to approve driver");
     }
  };

  const handleRejectDriver = async (driverId: string) => {
     try {
        await apiFetch(`/admin/drivers/${driverId}/reject`, { method: "PUT" });
        toast.success("Driver rejected!");
        loadData();
     } catch(err) {
        toast.error("Failed to reject driver");
     }
  };

  const tabs = [
     { id: "overview", label: "Overview" },
     { id: "users", label: "All Users" },
     { id: "drivers", label: "Drivers" },
     { id: "rides", label: "Ride History" }
  ];

  if (loading) {
    return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="animate-spin text-[#10B981]" size={48} /></div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in max-w-7xl mx-auto">
       <div className="flex glass rounded-xl p-1 mb-8">
          {tabs.map((t) => (
             <button 
               key={t.id}
               onClick={() => setActiveTab(t.id)}
               className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${
                  activeTab === t.id ? 'bg-[var(--accent-primary)] text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'
               }`}
             >
                {t.label}
             </button>
          ))}
       </div>

       {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
             <div className="card-white p-6 border-l-4 border-sky-500">
                <p className="text-xs font-bold text-slate-500 uppercase">Total Users</p>
                <p className="text-4xl font-black text-slate-800 mt-2">{stats?.total_users}</p>
             </div>
             <div className="card-white p-6 border-l-4 border-[var(--accent-primary)]">
                <p className="text-xs font-bold text-slate-500 uppercase">Active Drivers</p>
                <p className="text-4xl font-black text-slate-800 mt-2">{stats?.total_drivers}</p>
             </div>
             <div className="card-white p-6 border-l-4 border-purple-500">
                <p className="text-xs font-bold text-slate-500 uppercase">Total Rides Processed</p>
                <p className="text-4xl font-black text-slate-800 mt-2">{stats?.total_rides}</p>
             </div>
             <div className="card-white p-6 border-l-4 border-amber-500">
                <p className="text-xs font-bold text-slate-500 uppercase">Platform Revenue</p>
                <p className="text-4xl font-black text-slate-800 mt-2">₹{stats?.total_revenue}</p>
             </div>
          </div>
       )}

       {activeTab === "users" && (
          <div className="card-white overflow-hidden border border-slate-100">
             <table className="w-full text-left border-collapse">
                <thead>
                   <tr className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-wider font-bold">
                      <th className="p-4 border-b border-slate-100">Name / Email</th>
                      <th className="p-4 border-b border-slate-100">Gender</th>
                      <th className="p-4 border-b border-slate-100">Role</th>
                      <th className="p-4 border-b border-slate-100">Joined</th>
                   </tr>
                </thead>
                <tbody className="text-sm border-b border-slate-100">
                   {users.map(u => (
                      <tr key={u.user_id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                         <td className="p-4">
                            <p className="font-bold text-slate-800">{u.name}</p>
                            <p className="text-slate-500 text-xs">{u.email}</p>
                         </td>
                         <td className="p-4 capitalize text-slate-600">{u.gender || '-'}</td>
                         <td className="p-4">
                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-widest border ${u.role === 'admin' ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border-[var(--accent-primary)]/20' : u.role === 'driver' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                               {u.role}
                            </span>
                         </td>
                         <td className="p-4 text-slate-500">{new Date(u.created_at).toLocaleDateString()}</td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
       )}

       {activeTab === "drivers" && (
          <div className="card-white overflow-hidden border border-slate-100">
             <table className="w-full text-left border-collapse">
                <thead>
                   <tr className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-wider font-bold">
                      <th className="p-4 border-b border-slate-100">Driver Name</th>
                      <th className="p-4 border-b border-slate-100">Vehicle Info</th>
                      <th className="p-4 border-b border-slate-100">Gender</th>
                      <th className="p-4 border-b border-slate-100">Stats</th>
                      <th className="p-4 border-b border-slate-100">Status</th>
                      <th className="p-4 border-b border-slate-100 text-right">Actions</th>
                   </tr>
                </thead>
                <tbody className="text-sm border-b border-slate-100">
                   {drivers.map(d => (
                      <tr key={d.driver_id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                         <td className="p-4">
                            <p className="font-bold text-slate-800">{d.name || 'Unknown'}</p>
                            <p className="text-slate-400 text-[10px] uppercase font-bold tracking-tighter">ID: {d.driver_id.substring(0,8)}</p>
                         </td>
                         <td className="p-4">
                            <p className="font-bold text-slate-800 uppercase">{d.vehicle_number}</p>
                            <p className="text-slate-500 text-xs capitalize">{d.vehicle_type}</p>
                         </td>
                         <td className="p-4 capitalize text-slate-600">{d.gender || '-'}</td>
                         <td className="p-4 whitespace-nowrap">
                            <p className="text-xs text-slate-500"><span className="font-bold text-slate-800">{d.total_rides}</span> Rides</p>
                            <p className="text-xs text-amber-500 font-bold">{d.rating} ★</p>
                         </td>
                         <td className="p-4">
                            {d.approval_status === 'pending' ? (
                               <span className="text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded text-xs font-bold uppercase tracking-widest">Pending</span>
                            ) : d.approval_status === 'rejected' ? (
                               <span className="text-red-600 bg-red-50 border border-red-200 px-2 py-1 rounded text-xs font-bold uppercase tracking-widest">Rejected</span>
                            ) : (
                               <span className="text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 px-2 py-1 rounded text-xs font-bold uppercase tracking-widest">Approved</span>
                            )}
                         </td>
                         <td className="p-4 text-right">
                            {d.approval_status === "pending" && (
                               <div className="flex justify-end gap-2">
                                  <button 
                                    onClick={() => handleRejectDriver(d.driver_id)}
                                    className="text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-lg shadow-red-500/20"
                                  >
                                    Reject
                                  </button>
                                  <button 
                                    onClick={() => handleApproveDriver(d.driver_id)}
                                    className="text-white bg-[var(--accent-primary)] hover:bg-[#059669] px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-lg shadow-emerald-500/20"
                                  >
                                    Approve
                                  </button>
                               </div>
                            )}
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
       )}

       {activeTab === "rides" && (
          <div className="card-white overflow-hidden border border-slate-100">
             <table className="w-full text-left border-collapse">
                <thead>
                   <tr className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-wider font-bold">
                      <th className="p-4 border-b border-slate-100">Type</th>
                      <th className="p-4 border-b border-slate-100">Route</th>
                      <th className="p-4 border-b border-slate-100">Fare</th>
                      <th className="p-4 border-b border-slate-100">Status</th>
                      <th className="p-4 border-b border-slate-100">Rating</th>
                   </tr>
                </thead>
                <tbody className="text-sm border-b border-slate-100">
                   {rides.map(r => (
                      <tr key={r.ride_id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                         <td className="p-4">
                            {r.women_only ? (
                               <ShieldCheck size={16} className="text-pink-500"/>
                            ) : (
                               <Car size={16} className="text-slate-400" />
                            )}
                         </td>
                         <td className="p-4 min-w-[200px]">
                            <p className="text-xs text-slate-800 font-medium truncate max-w-[200px] mb-1"><span className="text-blue-500 font-bold">P:</span> {r.pickup_location}</p>
                            <p className="text-xs text-slate-800 font-medium truncate max-w-[200px]"><span className="text-emerald-500 font-bold">D:</span> {r.dropoff_location}</p>
                         </td>
                         <td className="p-4 font-bold text-slate-800">₹{r.fare}</td>
                         <td className="p-4">
                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest border ${r.status === 'completed' ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border-[var(--accent-primary)]/20' : r.status === 'cancelled' ? 'bg-red-50 text-red-500 border-red-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                               {r.status}
                            </span>
                         </td>
                         <td className="p-4">
                            {r.rating ? (
                               <div className="text-xs">
                                  <span className="text-amber-500 font-bold">{r.rating} ★</span>
                                  <p className="text-slate-500 truncate max-w-[150px] italic">"{r.feedback}"</p>
                               </div>
                            ) : (
                               <span className="text-slate-400">-</span>
                            )}
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
       )}

    </div>
  );
}
