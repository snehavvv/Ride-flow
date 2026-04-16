"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Star, Calendar, MapPin, CheckCircle2, Navigation, AlertCircle } from "lucide-react";
import { apiFetch } from "../../../lib/api";
import { toast } from "react-hot-toast";
import DriverBadges from "../../../components/DriverBadges";

export default function MyRidesPage() {
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Rating Modal State
  const [ratingRideId, setRatingRideId] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState("");

  const fetchRides = async () => {
    try {
      const data = await apiFetch("/booking/my-rides");
      setRides(data);
    } catch (err) {
      toast.error("Failed to load rides");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRides();
  }, []);

  const handleCancel = async (rideId: string) => {
    try {
      await apiFetch(`/booking/cancel/${rideId}`, { method: "POST" });
      toast.success("Ride cancelled");
      fetchRides();
    } catch (err) {
      toast.error("Could not cancel ride");
    }
  };

  const handleRate = async () => {
    if (!ratingRideId) return;
    try {
      await apiFetch(`/booking/rate/${ratingRideId}`, {
        method: "POST",
        body: JSON.stringify({ rating, feedback }),
      });
      toast.success("Feedback submitted! Thank you.");
      setRatingRideId(null);
      setRating(5);
      setFeedback("");
      fetchRides();
    } catch (err) {
      toast.error("Rating failed");
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
       case "pending": return "text-amber-600 bg-amber-50 border-amber-200";
       case "accepted": return "text-blue-600 bg-blue-50 border-blue-200";
       case "in_progress": return "text-purple-600 bg-purple-50 border-purple-200";
       case "completed": return "text-[#10B981] bg-[#10B981]/10 border-[#10B981]/20";
       case "cancelled": return "text-red-500 bg-red-50 border-red-200";
       default: return "text-gray-500 bg-gray-50 border-gray-200";
    }
  };

  if (loading) {
     return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-[#10B981]"/></div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-[#111827]">My Rides</h1>
        <p className="text-gray-500 mt-1">View your ride history and active bookings</p>
      </div>

      {rides.length === 0 ? (
        <div className="card-white p-16 text-center">
            <h3 className="text-xl font-bold text-gray-800 mb-2">No rides found</h3>
            <p className="text-gray-500 mb-6">Looks like you haven&apos;t booked any rides yet.</p>
            <button onClick={() => window.location.href='/dashboard/book-ride'} className="btn-primary px-8 py-3">Book Your First Ride</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {rides.map((ride: any) => (
             <div key={ride.ride_id} className="card-white p-6 border-l-4" style={{borderLeftColor: ride.status === 'completed' ? '#10B981' : ride.status === 'pending' ? '#F59E0B' : ride.status === 'cancelled' ? '#EF4444' : '#3B82F6'}}>
                <div className="flex flex-col md:flex-row justify-between gap-6">
                   
                   {/* Left Col */}
                   <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-3">
                         <span className={`text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full border ${getStatusColor(ride.status)}`}>
                            {ride.status.replace("_", " ")}
                         </span>
                         <span className="text-sm font-medium text-gray-500 flex items-center gap-1">
                            <Calendar size={14}/> 
                            {new Date(ride.requested_at).toLocaleDateString()} at {new Date(ride.requested_at).toLocaleTimeString([], {timeStyle: 'short'})}
                         </span>
                         {ride.women_only && (
                            <span className="text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full bg-pink-100 text-pink-600">
                               Women Only
                            </span>
                         )}
                      </div>

                      <div className="flex items-center gap-4">
                         <div className="flex flex-col items-center gap-1">
                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                            <div className="w-0.5 h-8 bg-gray-200"></div>
                            <div className="w-3 h-3 rounded-full bg-[#10B981]"></div>
                         </div>
                         <div className="flex flex-col justify-between h-14">
                            <p className="text-sm font-bold text-gray-700 truncate max-w-sm" title={ride.pickup_location}>{ride.pickup_location}</p>
                            <p className="text-sm font-bold text-gray-700 truncate max-w-sm" title={ride.dropoff_location}>{ride.dropoff_location}</p>
                         </div>
                      </div>
                   </div>

                   {/* Right Col */}
                   <div className="flex flex-col items-end justify-between min-w-[200px] border-t md:border-t-0 pt-4 md:pt-0 gap-4">
                      <div className="text-right">
                         <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Fare</p>
                         <p className="text-3xl font-black text-[#111827]">₹{ride.fare}</p>
                         <p className="text-xs text-gray-500 font-medium">Distance: {ride.distance_km} km</p>
                      </div>

                      <div className="flex gap-2 w-full md:w-auto">
                         {ride.status === "pending" && (
                            <button onClick={() => handleCancel(ride.ride_id)} className="w-full md:w-auto px-4 py-2 border border-red-200 text-red-500 rounded-lg text-sm font-bold hover:bg-red-50">Cancel</button>
                         )}
                         {ride.status === "completed" && !ride.rating && (
                            <button onClick={() => setRatingRideId(ride.ride_id)} className="w-full md:w-auto px-4 py-2 bg-amber-100 text-amber-700 rounded-lg text-sm font-bold hover:bg-amber-200 flex items-center justify-center gap-2 border border-amber-200">
                               Rate Driver <Star size={16}/>
                            </button>
                         )}
                         {ride.status === "completed" && ride.rating && (
                            <span className="text-sm font-bold text-amber-500 flex items-center gap-1">
                               You rated: {ride.rating} ★
                            </span>
                         )}
                      </div>
                   </div>

                </div>
             </div>
          ))}
        </div>
      )}

      {/* RATING MODAL */}
      {ratingRideId && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl relative animate-in zoom-in-95">
               <h3 className="text-2xl font-bold text-center mb-6">Rate your ride</h3>
               
               <div className="flex justify-center gap-2 mb-8">
                  {[1,2,3,4,5].map((star) => (
                     <button 
                        key={star}
                        onClick={() => setRating(star)}
                        className={`transition-transform hover:scale-110 outline-none ${star <= rating ? 'text-amber-400' : 'text-gray-200'}`}
                     >
                        <Star size={40} className={star <= rating ? 'fill-amber-400' : ''} />
                     </button>
                  ))}
               </div>

               <div className="space-y-2 mb-8">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Feedback (Optional)</label>
                  <textarea 
                     rows={3} 
                     className="input-base resize-none" 
                     placeholder="How was the driver?"
                     value={feedback}
                     onChange={(e) => setFeedback(e.target.value)}
                  />
               </div>

               <div className="flex gap-4">
                  <button onClick={() => setRatingRideId(null)} className="flex-1 py-3 border border-gray-200 rounded-xl font-bold text-gray-500 hover:bg-gray-50">Cancel</button>
                  <button onClick={handleRate} className="flex-1 py-3 bg-[#10B981] text-white rounded-xl font-bold hover:bg-[#059669]">Submit</button>
               </div>
            </div>
         </div>
      )}

    </div>
  );
}
