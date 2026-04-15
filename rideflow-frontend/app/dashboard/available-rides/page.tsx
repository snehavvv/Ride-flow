"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Loader2, MapPin, IndianRupee, Clock, ShieldCheck, 
  Power, TrendingUp, Star, CheckCircle2 
} from "lucide-react";
import { apiFetch } from "../../../lib/api";
import { toast } from "react-hot-toast";

export default function DriverDashboardPage() {
  const router = useRouter();
  const [rides, setRides] = useState<any[]>([]);
  const [driver, setDriver] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(false);
  const [updating, setUpdating] = useState(false);

  const fetchDriverProfile = async () => {
    try {
      const data = await apiFetch("/drivers/me");
      setDriver(data);
      setOnline(data.is_available);
    } catch (err) {
      console.error("Failed to load driver profile", err);
      toast.error("Driver profile not found. Are you registered as a driver?");
      router.push("/dashboard");
    }
  };


  const fetchAvailableRides = async () => {
    if (!online) return;
    try {
      const data = await apiFetch("/booking/available-rides");
      setRides(data);
    } catch (err) {
      console.error("Poll failed", err);
    }
  };

  const toggleAvailability = async () => {
    setUpdating(true);
    try {
      const newStatus = !online;
      await apiFetch("/drivers/availability", {
        method: "PUT",
        body: JSON.stringify({ is_available: newStatus })
      });
      setOnline(newStatus);
      toast.success(newStatus ? "You are now Online!" : "You are now Offline.");
      if (!newStatus) setRides([]);
    } catch (err) {
      toast.error("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchDriverProfile();
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    let ws: WebSocket | null = null;
    if (online && driver) {
      fetchAvailableRides();
      
      // Real-Time WebSocket for new rides
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//localhost:8000/ws/${driver.user_id}?role=driver&gender=${driver.gender || 'male'}`;
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "new_ride_request") {
            // Prepend new ride or just refresh
            setRides(prev => [data.ride, ...prev]);
            toast("New ride request received! 🚕", { icon: "🔔" });
          }
        } catch (e) {
          console.error("WS parse error", e);
        }
      };

      ws.onclose = () => console.log("WS closed");

      const handleRefresh = () => fetchAvailableRides();
      window.addEventListener("refresh_data", handleRefresh);

      return () => {
         if (ws) ws.close();
         window.removeEventListener("refresh_data", handleRefresh);
      };
    }
  }, [online, driver]); // Added driver to dependencies


  // Periodic location update (Simulation)
  useEffect(() => {
    if (online) {
      const pingLocation = async () => {
        try {
          await apiFetch("/drivers/location", {
            method: "PUT",
            body: JSON.stringify({ latitude: 19.0760, longitude: 72.8777 })
          });
        } catch (e) { /* silent */ }
      };
      pingLocation();
      const interval = setInterval(pingLocation, 30000);
      return () => clearInterval(interval);
    }
  }, [online]);

  const handleAccept = async (rideId: string) => {
    try {
      await apiFetch(`/booking/accept/${rideId}`, { method: "POST" });
      toast.success("Ride Accepted! Prepare for pickup.");
      router.push("/dashboard/active-ride");
    } catch (err: any) {
      toast.error(err.message || "Failed to accept ride");
    }
  };

  if (loading) {
     return <div className="flex h-screen items-center justify-center bg-[var(--bg-page)]"><Loader2 className="animate-spin text-[var(--accent-primary)]" size={40}/></div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto pb-12">
      
      {/* HEADER & TOGGLE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">Driver Hub</h1>
          <p className="text-[var(--text-muted)] mt-1">Managed your availability and active requests.</p>
        </div>

        <button 
          onClick={toggleAvailability}
          disabled={updating}
          className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-bold transition-all shadow-lg hover:scale-105 active:scale-95 ${
            online 
            ? "bg-[#10B981] text-white shadow-[#10B981]/20" 
            : "bg-gray-200 text-gray-600 shadow-gray-200/20"
          }`}
        >
          {updating ? <Loader2 className="animate-spin" size={20}/> : <Power size={20}/>}
          {online ? "ONLINE" : "OFFLINE"}
        </button>
      </div>

      {/* STATS STRIP */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-white p-6 flex items-center gap-4 border-l-4 border-blue-500">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><CheckCircle2 size={24}/></div>
          <div>
            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Total Rides</p>
            <p className="text-2xl font-black text-[var(--text-primary)]">{driver?.total_rides || 0}</p>
          </div>
        </div>
        <div className="card-white p-6 flex items-center gap-4 border-l-4 border-[var(--accent-primary)]">
          <div className="p-3 bg-emerald-50 text-[var(--accent-primary)] rounded-xl"><TrendingUp size={24}/></div>
          <div>
            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Total Earnings</p>
            <p className="text-2xl font-black text-[var(--text-primary)]">₹{driver?.total_earnings?.toLocaleString() || 0}</p>
          </div>
        </div>
        <div className="card-white p-6 flex items-center gap-4 border-l-4 border-amber-500">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><Star size={24}/></div>
          <div>
            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Driver Rating</p>
            <p className="text-2xl font-black text-[var(--text-primary)]">{driver?.rating || "N/A"}</p>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT Area */}
      {!online ? (
        <div className="glass rounded-3xl p-16 text-center border-2 border-dashed border-gray-200">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
             <Power className="text-gray-400" size={40} />
          </div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">You are currently Offline</h2>
          <p className="text-[var(--text-muted)] max-w-md mx-auto">Toggle the status bar above to go Online and start receiving ride requests from nearby passengers.</p>
        </div>
      ) : rides.length === 0 ? (
        <div className="glass rounded-3xl p-16 text-center border-2 border-dashed border-[var(--accent-primary)]/20 bg-white">
            <Loader2 className="animate-spin text-[var(--accent-primary)] mx-auto mb-6" size={48} />
            <h3 className="text-xl font-bold text-[var(--accent-primary)] mb-2">Searching for passengers...</h3>
            <p className="text-[var(--text-muted)] max-w-md mx-auto line-clamp-2 italic">
              "Great work! Staying online increases your chances of getting high-value rides."
            </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rides.map((ride: any) => (
             <div key={ride.ride_id} className="card-white p-6 hover:-translate-y-1 transition-transform border-t-8 border-[var(--accent-primary)] flex flex-col justify-between shadow-xl">
                <div>
                   <div className="flex justify-between items-start mb-6">
                      {ride.women_only ? (
                         <span className="bg-pink-500/10 text-pink-400 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest flex items-center gap-2 border border-pink-500/20">
                            <ShieldCheck size={14}/> Women Specific
                         </span>
                      ) : (
                         <span className="bg-indigo-500/10 text-indigo-400 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest border border-indigo-500/20">
                            General Ride
                         </span>
                      )}
                      
                      <span className="text-xs text-[var(--text-muted)] font-bold bg-gray-50 px-3 py-1 rounded-lg flex items-center gap-1.5 border border-gray-100">
                         <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></div>
                         {Math.floor((new Date().getTime() - new Date(ride.requested_at).getTime()) / 60000)}m ago
                      </span>
                   </div>

                   <div className="space-y-6 mb-8 relative">
                      <div className="absolute left-[11px] top-4 bottom-4 w-0.5 bg-gray-100 border-dashed border-l-2"></div>
                      <div className="flex items-start gap-4">
                         <div className="mt-1 w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 z-10 font-black text-[10px] border border-blue-100">A</div>
                         <div>
                            <p className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-tighter">Pickup Location</p>
                            <p className="text-sm font-bold text-[var(--text-primary)] leading-tight">{ride.pickup_location}</p>
                         </div>
                      </div>
                      <div className="flex items-start gap-4">
                         <div className="mt-1 w-6 h-6 rounded-full bg-emerald-50 text-[var(--accent-primary)] flex items-center justify-center shrink-0 z-10 font-black text-[10px] border border-emerald-100">B</div>
                         <div>
                            <p className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-tighter">Destination</p>
                            <p className="text-sm font-bold text-[var(--text-primary)] leading-tight">{ride.dropoff_location}</p>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t-2 border-gray-50 bg-gray-50/30 -mx-6 -mb-6 p-6 rounded-b-3xl">
                   <div>
                      <p className="text-2xl font-black text-[var(--text-primary)] flex items-center gap-1">
                         <IndianRupee size={20} className="text-[var(--accent-primary)]"/>
                         {ride.fare}
                      </p>
                      <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-tighter">{ride.distance_km} KM EST. DISTANCE</p>
                   </div>
                   <button onClick={() => handleAccept(ride.ride_id)} className="btn-primary px-10 py-4 shadow-lg shadow-emerald-500/20 text-sm tracking-wider">Accept Now</button>
                </div>
             </div>
          ))}
        </div>
      )}
    </div>
  );
}
