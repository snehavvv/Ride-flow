"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Car, MapPin, History, ShieldCheck, TrendingUp, Users, ArrowRight } from "lucide-react";
import { getUser, isAdmin, isDriver } from "../../lib/auth";
import { apiFetch } from "../../lib/api";
import { toast } from "react-hot-toast";
import DriverBadges from "../../components/DriverBadges";
import { motion } from "framer-motion";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [headerImage, setHeaderImage] = useState("");
  
  const user = getUser();
  const admin = isAdmin();
  const driver = isDriver();

  useEffect(() => {
    // Dynamic imagery logic based on role
    const imageQuery = admin ? 'business,technology' : driver ? 'luxury,car,night' : 'city,taxi,transport';
    setHeaderImage(`https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=2070`); // High quality fallback
    
    async function loadData() {
      try {
        if (admin) {
           const res = await apiFetch("/admin/analytics/overview");
           setStats(res);
           setHeaderImage("https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=2000&q=80");
        } else if (driver) {
           try {
              const res = await apiFetch("/drivers/me");
              setStats(res);
              setHeaderImage("https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=2000&q=80");
           } catch (e) {
              console.error("Driver profile missing", e);
              setStats({ approval_status: "not_found" });
           }
        } else {

           const rides = await apiFetch("/booking/my-rides");
           const totalSpent = rides.reduce((acc: number, r: any) => acc + (r.fare || 0), 0);
           setStats({ totalRides: rides.length, totalSpent });
           setHeaderImage("https://images.unsplash.com/photo-1494522855154-9297ac14b55f?auto=format&fit=crop&w=2000&q=80");
        }
      } catch (err) {
        console.error("Dashboard fetch error", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [admin, driver]);

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
         <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-16 h-16 rounded-full border-4 border-gray-100 border-t-[var(--accent-primary)]"
         />
      </div>
    );
  }

  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      variants={container} 
      initial="hidden" 
      animate="show" 
      className="space-y-8"
    >
      {/* Dynamic Header Banner */}
      <motion.div variants={item} className="relative w-full h-48 md:h-64 rounded-3xl overflow-hidden shadow-lg group border border-white">
        <div className="absolute inset-0 bg-white/10 z-10 transition-all duration-700 group-hover:bg-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/20 to-transparent z-10" />
        <img 
          src={headerImage} 
          alt="Dashboard Header" 
          className="absolute inset-0 w-full h-full object-cover scale-105 transition-transform duration-1000 group-hover:scale-100" 
        />
        <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10 z-20">
           <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-2 tracking-tight drop-shadow-md">
             {admin ? "Command Center" : driver ? `Hello, ${user?.name}` : `Welcome back, ${user?.name}`}
           </h1>
           <p className="text-gray-100 font-medium text-sm md:text-base max-w-xl drop-shadow-sm">
             {admin ? "Global platform analytics and user management." : driver ? "Your driving performance and active requests." : "Ready to plan your next journey?"}
           </p>
        </div>
      </motion.div>

      {/* --- ADMIN DASHBOARD --- */}
      {admin && (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Platform Overview</h2>
            <Link href="/dashboard/admin?tab=rides" className="btn-primary px-6 py-2">View All Bookings <ArrowRight size={16}/></Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard icon={<Users />} title="Total Users" value={stats?.total_users || 0} index={0} />
            <StatCard icon={<Car />} title="Approved Drivers" value={stats?.total_drivers || 0} index={1} />
            <StatCard icon={<History />} title="Total Rides" value={stats?.total_rides || 0} index={2} />
            <StatCard icon={<TrendingUp />} title="Total Revenue" value={`₹${stats?.total_revenue || 0}`} index={3} />
          </div>
        </motion.div>
      )}

      {/* --- DRIVER DASHBOARD --- */}
      {driver && (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
          <motion.div variants={item} className="flex flex-col md:flex-row items-center justify-between gap-6 glass p-8 border-l-4 border-[var(--accent-primary)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent-primary)] opacity-5 blur-[80px]" />
            <div className="flex items-center gap-6 text-left w-full md:w-auto relative z-10">
              <div className="w-20 h-20 bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] rounded-full flex items-center justify-center text-white shadow-lg shadow-[var(--accent-primary)]/20 font-black text-3xl shrink-0">
                 {user?.name?.[0]}
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-gray-900">{user?.name}</h2>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none">Verified Driver</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                  <span className={`text-xs font-bold uppercase tracking-widest leading-none flex items-center gap-1.5 ${stats?.is_available ? 'text-[var(--accent-primary)]' : 'text-gray-400'}`}>
                    <span className={`w-2 h-2 rounded-full ${stats?.is_available ? 'bg-[var(--accent-primary)] animate-pulse' : 'bg-gray-300'}`} />
                    {stats?.is_available ? 'Online' : 'Offline'}
                  </span>
                </div>
                <div className="mt-5">
                  <DriverBadges badges={stats?.badges} size="md" />
                </div>
              </div>
            </div>

            {stats?.approval_status === "approved" && (
              <button 
                onClick={async () => {
                  const updated = await apiFetch("/drivers/availability", {
                    method: "PUT",
                    body: JSON.stringify({ is_available: !stats.is_available })
                  });
                  setStats(updated);
                  toast.success(updated.is_available ? "You are now online" : "You are now offline");
                }}
                className={`relative z-10 w-full md:w-auto px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl hover:scale-105 active:scale-95 ${
                  stats?.is_available ? 'bg-red-500/20 text-red-500 border border-red-500/50 hover:bg-red-500 hover:text-white' : 'bg-[var(--accent-primary)] text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                }`}
              >
                {stats?.is_available ? "Go Offline" : "Go Online"}
              </button>
            )}
          </motion.div>

          {stats?.approval_status !== "approved" ? (
            <motion.div variants={item} className="glass p-10 text-center border-2 border-dashed border-amber-200 bg-amber-50">
              <h3 className="text-2xl font-bold text-amber-600 mb-3">Application Pending</h3>
              <p className="text-gray-500 font-medium">Your driver application is currently being reviewed by an admin. You&apos;ll be able to accept rides once approved.</p>
            </motion.div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard icon={<Car />} title="Total Rides" value={stats?.total_rides || 0} index={0} />
                <StatCard icon={<TrendingUp />} title="Earnings" value={`₹${stats?.total_earnings || 0}`} index={1} />
                <StatCard icon={<ShieldCheck />} title="Driver Rating" value={`${stats?.rating || 5.0} ★`} index={2} />
              </div>
              <motion.div variants={item} className="mt-10 glass p-10 relative overflow-hidden group border border-gray-100">
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] opacity-0 group-hover:opacity-5 transition-opacity duration-500" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Start Taking Rides</h3>
                <p className="text-gray-500 mb-8 max-w-lg font-medium">Check the available ride queue to find passengers near you and maximize your earnings today.</p>
                <Link href="/dashboard/available-rides" className="btn-primary inline-flex">
                  View Ride Queue <ArrowRight size={18} />
                </Link>
              </motion.div>
            </>
          )}
        </motion.div>
      )}

      {/* --- PASSENGER DASHBOARD --- */}
      {!admin && !driver && (
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div variants={item} className="glass p-8 border border-gray-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--accent-secondary)] opacity-10 blur-[60px]" />
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Where to?</h3>
            <p className="text-gray-500 mb-8 max-w-sm font-medium">Book a safe, comfortable, and eco-friendly ride to your next destination.</p>
            
            <Link href="/dashboard/book-ride" className="w-full flex items-center justify-between p-5 border border-gray-100 rounded-2xl hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/5 transition-all group/btn bg-white">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 bg-gray-50 text-[var(--accent-primary)] rounded-full flex items-center justify-center group-hover/btn:scale-110 transition-transform group-hover/btn:bg-[var(--accent-primary)] group-hover/btn:text-white shadow-sm border border-gray-100">
                  <MapPin size={24} />
                </div>
                <span className="font-bold text-gray-900 text-lg">Book a Ride Now</span>
              </div>
              <ArrowRight className="text-gray-300 group-hover/btn:text-[var(--accent-primary)] group-hover/btn:translate-x-1 transition-all" />
            </Link>
          </motion.div>

          <motion.div variants={item} className="glass p-8 border border-gray-100">
             <h3 className="text-xl font-bold text-gray-900 mb-6">Your Stats</h3>
             <div className="grid grid-cols-2 gap-4">
               <div className="p-6 bg-gray-50 border border-gray-100 rounded-2xl hover:bg-gray-100 transition-colors">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Rides Taken</p>
                  <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-primary)] to-emerald-600">{stats?.totalRides || 0}</p>
               </div>
               <div className="p-6 bg-gray-50 border border-gray-100 rounded-2xl hover:bg-gray-100 transition-colors">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Total Spent</p>
                  <p className="text-3xl font-black text-gray-900">₹{stats?.totalSpent || 0}</p>
               </div>
             </div>
          </motion.div>

          {user?.gender === "female" && (
             <motion.div variants={item} className="lg:col-span-2 glass p-6 bg-pink-50 border border-pink-100 flex flex-col sm:flex-row items-center gap-6 rounded-3xl relative overflow-hidden">
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-pink-500/5 blur-[50px] rounded-full" />
                <div className="w-16 h-16 bg-pink-500/10 text-pink-400 rounded-full flex items-center justify-center shrink-0 shadow-sm border border-pink-200">
                   <ShieldCheck size={32} />
                </div>
                <div className="text-center sm:text-left relative z-10">
                   <h4 className="text-pink-600 text-xl font-bold">Women Safety Focus Active</h4>
                   <p className="text-pink-900/60 mt-2 max-w-2xl text-sm leading-relaxed font-medium">As a female passenger, the platform ensures priority matching with verified female drivers and live trip sharing capabilities for your utmost security.</p>
                </div>
             </motion.div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

function StatCard({ icon, title, value, index }: { icon: React.ReactNode, title: string, value: string | number, index: number }) {
  return (
    <motion.div 
      variants={{
        hidden: { opacity: 0, scale: 0.9, y: 20 },
        show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
      }}
      className="card-white p-6 relative overflow-hidden group cursor-default border border-gray-100"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="w-12 h-12 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center text-[var(--accent-primary)] shadow-sm group-hover:scale-110 transition-transform duration-300">
          {React.cloneElement(icon as React.ReactElement, { size: 24 })}
        </div>
        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 group-hover:text-[var(--accent-primary)] transition-colors duration-300">
          <ArrowRight size={14} className="-rotate-45" />
        </div>
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 mb-2 relative z-10">{title}</p>
      <p className="text-3xl font-black text-gray-900 relative z-10 tracking-tight">{value}</p>
    </motion.div>
  );
}
