"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MapPin, CheckCircle, XCircle, Gift, Package } from "lucide-react";
import { apiFetch } from "../../../lib/api";
import { toast } from "react-hot-toast";
import 'leaflet/dist/leaflet.css';

import dynamic from "next/dynamic";

const ActiveRideMap = dynamic(() => import("../../../components/ActiveRideMap"), { 
  ssr: false, 
  loading: () => <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center font-bold text-gray-400">Loading Map...</div>
});

export default function ActiveRidePage() {
  const router = useRouter();
  const [ride, setRide] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchActiveRide = async () => {
    try {
      const data = await apiFetch("/booking/driver-rides");
      // Find the first accepted or in_progress ride
      const active = data.find((r: any) => r.status === "accepted" || r.status === "in_progress");
      setRide(active || null);
    } catch (err) {
      toast.error("Failed to load active ride");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveRide();
  }, []);

  const handleComplete = async () => {
     if (!ride) return;
     try {
        await apiFetch(`/booking/complete/${ride.ride_id}`, { method: "POST" });
        toast.success("Ride Successfully Completed!");
        router.push("/dashboard");
     } catch (err) {
        toast.error("Failed to complete ride");
     }
  };

  const handleCancel = async () => {
     if (!ride) return;
     try {
        await apiFetch(`/booking/cancel/${ride.ride_id}`, { method: "POST" });
        toast.success("Ride Cancelled");
        router.push("/dashboard");
     } catch (err) {
        toast.error("Failed to cancel ride");
     }
  };

  if (loading) {
     return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-[#10B981]"/></div>;
  }

  if (!ride) {
     return (
       <div className="card-white p-16 text-center max-w-2xl mx-auto mt-10">
          <h3 className="text-xl font-bold text-gray-800 mb-2">No active ride</h3>
          <p className="text-gray-500 mb-6">You don't currently have an active ride assignment.</p>
          <button onClick={() => router.push('/dashboard/available-rides')} className="btn-primary px-8 py-3">Find Rides</button>
       </div>
     );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-[#111827]">Active Ride <span className="ml-2 bg-blue-100 text-blue-600 text-sm px-3 py-1 rounded-full uppercase tracking-widest align-middle border border-blue-200">IN PROGRESS</span></h1>
        <p className="text-gray-500 mt-1">Navigate to the drop-off location.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* DETAILS */}
        <div className="card-white p-6 space-y-6 flex flex-col justify-between">
           <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Navigation Data</p>
              
              <div className="relative pl-6 pb-6 border-l-2 border-dashed border-gray-200 ml-3">
                 <div className="absolute w-4 h-4 bg-blue-500 rounded-full -left-[9px] top-0 border-2 border-white shadow-sm" />
                 <p className="text-[10px] font-bold text-gray-400 uppercase">Pickup</p>
                 <p className="text-sm font-bold text-[#111827]">{ride.pickup_location}</p>
              </div>

              <div className="relative pl-6 ml-3">
                 <div className="absolute w-4 h-4 bg-[#10B981] rounded-full -left-[9px] top-0 border-2 border-white shadow-sm" />
                 <p className="text-[10px] font-bold text-gray-400 uppercase">Drop-off</p>
                 <p className="text-sm font-bold text-[#111827]">{ride.dropoff_location}</p>
              </div>

              <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
                 <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500 font-bold">Est. Distance</span>
                    <span className="text-sm font-black">{ride.distance_km} KM</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 font-bold">Expected Fare</span>
                    <span className="text-sm font-black text-[#10B981]">₹{ride.fare}</span>
                 </div>
              </div>

              {/* NEW: Passenger Preferences */}
              {ride.ride_preferences && (
                 <div className="mt-8 space-y-3">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-[#10B981]">Rider Preferences</p>
                    <div className="flex flex-wrap gap-2">
                       {(() => {
                          try {
                             const prefs = JSON.parse(ride.ride_preferences);
                             const items = [prefs.mood, ...(prefs.comfort || [])];
                             return items.map((item: string, idx: number) => (
                                <span key={idx} className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-2.5 py-1 rounded-full border border-emerald-100 flex items-center gap-1.5 uppercase shadow-sm">
                                   <div className="w-1 h-1 rounded-full bg-emerald-500" />
                                   {item}
                                </span>
                             ));
                          } catch (e) { return null; }
                       })()}
                    </div>
                 </div>
              )}
           </div>

           {/* NEW: Parcel Details */}
           {ride.vehicle_type === 'parcel' && (
              <div className="mt-8 p-4 bg-amber-50 border border-amber-100 rounded-2xl space-y-4 shadow-sm animate-in zoom-in-95 duration-500">
                 <div className="flex items-center gap-2 text-amber-700">
                    <Package size={18} />
                    <p className="text-[10px] font-black uppercase tracking-widest">Parcel Delivery</p>
                 </div>
                 <div className="space-y-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">What's being sent?</p>
                    <p className="text-sm font-medium text-gray-700 leading-relaxed bg-white/50 p-3 rounded-xl border border-white">
                       {ride.parcel_description || "No description provided."}
                    </p>
                 </div>
                 {ride.parcel_photo_url ? (
                    <div className="space-y-2">
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Item Snapshot</p>
                       <div className="w-full h-44 rounded-xl bg-cover bg-center border-2 border-white shadow-sm ring-1 ring-amber-100" style={{backgroundImage: `url(${ride.parcel_photo_url})`}} />
                    </div>
                 ) : (
                    <div className="p-6 bg-white/30 rounded-xl border border-dashed border-amber-200 text-center">
                       <p className="text-[10px] font-bold text-amber-600 uppercase">No photo attached</p>
                    </div>
                 )}
              </div>
           )}

           <div className="flex flex-col gap-3">
              <button onClick={handleComplete} className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2">
                 <CheckCircle size={20}/> Complete Ride
              </button>
              <button onClick={handleCancel} className="w-full py-3 text-red-500 font-bold hover:bg-red-50 rounded-xl border border-red-100 flex items-center justify-center gap-2 transition-colors">
                 <XCircle size={18}/> Cancel Ride
              </button>
           </div>
        </div>

          {/* MAP */}
          <div className="lg:col-span-2 card-white p-2 relative h-[500px]">
             {(!ride.pickup_lat || !ride.dropoff_lat) ? (
                <div className="w-full h-full bg-gray-100 rounded-xl flex items-center justify-center">
                   <p className="text-gray-400 font-bold">Map data unavailable for this specific ride.</p>
                </div>
             ) : (
                <ActiveRideMap ride={ride} />
             )}
          </div>
      </div>
    </div>
  );
}
