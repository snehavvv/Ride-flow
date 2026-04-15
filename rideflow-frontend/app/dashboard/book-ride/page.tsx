"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MapPin, Search, ShieldCheck, Camera, Gift, Bell } from "lucide-react";
import { getUser } from "../../../lib/auth";
import { apiFetch } from "../../../lib/api";
import { toast } from "react-hot-toast";

import dynamic from "next/dynamic";

const BookingMap = dynamic(() => import("../../../components/BookingMap"), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center font-bold text-gray-400">Loading Map...</div>
});

interface User {
  id: number;
  name: string;
  email: string;
  role: 'passenger' | 'driver' | 'admin';
  gender?: 'male' | 'female' | 'other';
  phone?: string;
}

const CITIES = [
  { name: "Mumbai", lat: 19.0760, lng: 72.8777 },
  { name: "Delhi", lat: 28.6139, lng: 77.2090 },
  { name: "Bangalore", lat: 12.9716, lng: 77.5946 },
  { name: "Hyderabad", lat: 17.3850, lng: 78.4867 },
  { name: "Chennai", lat: 13.0827, lng: 80.2707 },
  { name: "Kolkata", lat: 22.5726, lng: 88.3639 },
  { name: "Pune", lat: 18.5204, lng: 73.8567 },
];

const POPULAR_LOCATIONS: Record<string, {name: string, lat: number, lng: number}[]> = {
  "Mumbai": [
    { name: "Gateway of India", lat: 18.9220, lng: 72.8347 },
    { name: "CST Station", lat: 18.9402, lng: 72.8355 },
    { name: "Juhu Beach", lat: 19.1075, lng: 72.8263 },
    { name: "Mumbai Airport (T2)", lat: 19.0887, lng: 72.8680 }
  ],
  "Delhi": [
    { name: "India Gate", lat: 28.6129, lng: 77.2295 },
    { name: "Connaught Place", lat: 28.6315, lng: 77.2167 },
    { name: "IGI Airport", lat: 28.5562, lng: 77.1000 },
    { name: "Red Fort", lat: 28.6562, lng: 77.2410 }
  ],
  "Bangalore": [
    { name: "Kempegowda Airport", lat: 13.1986, lng: 77.7066 },
    { name: "Majestic Bus Stand", lat: 12.9767, lng: 77.5729 },
    { name: "MG Road Metro", lat: 12.9754, lng: 77.6061 },
    { name: "Indiranagar", lat: 12.9784, lng: 77.6408 },
    { name: "Koramangala", lat: 12.9352, lng: 77.6245 }
  ]
};

const NEIGHBORHOODS: Record<string, string[]> = {
  "Mumbai": ["Colaba", "Bandra", "Juhu", "Andheri", "Borivali", "Dadar", "Worli", "Malad", "Thane", "Powai", "Chembur"],
  "Delhi": ["Connaught Place", "South Extension", "Dwarka", "Karol Bagh", "Rohini", "Hauz Khas", "Saket", "Lajpat Nagar", "Pitampura"],
  "Bangalore": ["Indiranagar", "Koramangala", "Whitefield", "HSR Layout", "Marathahalli", "Bellandur", "Malleshwaram", "Jayanagar", "Electronic City", "Hebbal", "Yelahanka", "Banashankari", "Rajajinagar", "Sadashivnagar"]
};

export default function BookRidePage() {
  const router = useRouter();
  const user = getUser();
  const [loading, setLoading] = useState(false);
  const [localUser, setLocalUser] = useState<User | null>(null);
  const [showWomenOnly, setShowWomenOnly] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await apiFetch('/auth/me');
        setLocalUser(user);
        if (user?.gender === 'female') {
          setShowWomenOnly(true);
        } else {
          setShowWomenOnly(false);
        }
      } catch (error) {
        console.error('Failed to fetch user profile', error);
        // Fallback to localStorage if API fails
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setLocalUser(parsedUser);
          if (parsedUser?.gender === 'female') {
            setShowWomenOnly(true);
          } else {
            setShowWomenOnly(false);
          }
        }
      }
    };

    fetchUser();
  }, []);

  const [selectedCity, setSelectedCity] = useState(CITIES[0]);
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [preferFemaleDriver, setPreferFemaleDriver] = useState(false);
  const [womenOnly, setWomenOnly] = useState(false);

  
  useEffect(() => {
    if (localUser?.gender === 'female') {
      setShowWomenOnly(true);
    } else {
      setShowWomenOnly(false);
    }
  }, [localUser]);

  // Search state
  const [pickupResults, setPickupResults] = useState<any[]>([]);
  const [dropoffResults, setDropoffResults] = useState<any[]>([]);
  const [searching, setSearching] = useState<{type: 'pickup' | 'dropoff', active: boolean}>({type: 'pickup', active: false});
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Coordinates for API submission
  const [pickupCoords, setPickupCoords] = useState<{lat: number, lng: number} | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<{lat: number, lng: number} | null>(null);
  
  // NEW: Multi-step state
  const [currentStep, setCurrentStep] = useState(0); // 0: Location, 1: Preferences, 2: Vehicle & Schedule
  
  // NEW: Selection states
  const [mood, setMood] = useState("🎵 Music On");
  const [comfort, setComfort] = useState<string[]>([]);
  const [vehicleType, setVehicleType] = useState("go");
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");

  // NEW: Parcel Features
  const [parcelDescription, setParcelDescription] = useState("");
  const [parcelPhoto, setParcelPhoto] = useState<string | null>(null);

  // NEW: Scheduling Features
  const [isReminder, setIsReminder] = useState(false);

  const calculateFare = (baseFare: number, vType: string) => {
    let multiplier = 1.0;
    if (vType === 'bike') multiplier = 0.6;
    if (vType === 'sedan') multiplier = 1.4;
    if (vType === 'xl') multiplier = 2.0;
    
    let total = baseFare * multiplier;
    if (vType === 'parcel') total += 40; // Delivery base
    if (comfort.includes("🐾 Pet Friendly")) total += 50;
    return Math.round(total);
  };

  
  // Forced props for map component
  const [forcedP, setForcedP] = useState<{lat: number, lng: number, label: string} | null>(null);
  const [forcedD, setForcedD] = useState<{lat: number, lng: number, label: string} | null>(null);

  // Geocoding logic
  const searchLocation = async (query: string, type: 'pickup' | 'dropoff') => {
    if (query.length < 3) {
      if (type === 'pickup') setPickupResults([]);
      else setDropoffResults([]);
      return;
    }

    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    searchTimeout.current = setTimeout(async () => {
      setSearching({type, active: true});
      try {
        // Bias search towards city center using viewbox
        const v = 0.5; // ~50km bias
        const viewbox = `${selectedCity.lng-v},${selectedCity.lat+v},${selectedCity.lng+v},${selectedCity.lat-v}`;
        
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&viewbox=${viewbox}&bounded=0&countrycodes=in&limit=15`, {
            headers: { 'User-Agent': 'RideFlow-App-V2' }
        });
        const data = await res.json();
        if (type === 'pickup') setPickupResults(data);
        else setDropoffResults(data);
      } catch (err) {
        console.error(err);
      } finally {
        setSearching({type, active: false});
      }
    }, 500);
  };

  // Selection handlers
  const handleSelect = (item: any, type: 'pickup' | 'dropoff') => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    const label = item.display_name.split(",")[0];

    if (type === 'pickup') {
      setPickup(label);
      setPickupCoords({lat, lng});
      setForcedP({lat, lng, label});
      setPickupResults([]);
    } else {
      setDropoff(label);
      setDropoffCoords({lat, lng});
      setForcedD({lat, lng, label});
      setDropoffResults([]);
    }
  };

  // When city changes, clear previous coordinates
  useEffect(() => {
    setPickup("");
    setDropoff("");
    setPickupCoords(null);
    setDropoffCoords(null);
    setForcedP(null);
    setForcedD(null);
  }, [selectedCity]);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickupCoords || !dropoffCoords) {
      toast.error("Please select both Pickup and Drop-off locations on the map!");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        pickup_location: pickup, 
        dropoff_location: dropoff,
        pickup_lat: pickupCoords.lat,
        pickup_lng: pickupCoords.lng,
        dropoff_lat: dropoffCoords.lat,
        dropoff_lng: dropoffCoords.lng,
        women_only: womenOnly,
        prefer_female_driver: preferFemaleDriver,
        // Pro Features
        ride_preferences: JSON.stringify({ mood, comfort }),
        vehicle_type: vehicleType,
        is_scheduled: isScheduled,
        scheduled_at: isScheduled ? scheduledAt : null,
        parcel_description: vehicleType === 'parcel' ? parcelDescription : null,
        parcel_photo_url: vehicleType === 'parcel' ? parcelPhoto : null,
      };

      await apiFetch("/booking/request", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      toast.success(isScheduled ? "Ride scheduled successfully!" : "Ride requested successfully!");
      router.push("/dashboard/my-rides");

    } catch (err: any) {
      toast.error(err.message || "Failed to request ride");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex items-center justify-between">
        <div>
           <h1 className="text-3xl font-bold text-[#111827]">Book a Ride</h1>
           <p className="text-gray-500 mt-2">Get to your destination safely and comfortably.</p>
        </div>
        
        {/* Step Indicator */}
        <div className="flex items-center gap-3">
           {[0, 1, 2].map((s) => (
             <div key={s} className="flex items-center gap-2">
                <div className={`h-2.5 w-12 rounded-full transition-all duration-500 ${currentStep >= s ? 'bg-[#10B981]' : 'bg-gray-200'}`} />
             </div>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* FORM COLUMN */}
        <div className="card-white p-8 space-y-8 min-h-[600px] flex flex-col">
          
          {currentStep === 0 && (
            <div className="space-y-6 animate-in slide-in-from-left duration-500 flex-1">
              <h3 className="text-xl font-bold text-gray-800 border-b border-gray-100 pb-4">Where to?</h3>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Target City</label>
                <select 
                  className="input-base text-sm font-bold bg-[#10B981]/5 border-[#10B981]/20 outline-none"
                  value={selectedCity.name}
                  onChange={(e) => {
                    const city = CITIES.find(c => c.name === e.target.value);
                    if (city) setSelectedCity(city);
                  }}
                >
                  {CITIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
              </div>

              {/* PICKUP SEARCH */}
              <div className="space-y-2 relative">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Pickup Location</label>
                  {NEIGHBORHOODS[selectedCity.name] && (
                    <select 
                      className="text-[10px] font-bold text-[#10B981] bg-transparent outline-none cursor-pointer"
                      onChange={async (e) => {
                        if (!e.target.value) return;
                        setPickup(e.target.value);
                        searchLocation(e.target.value, 'pickup');
                      }}
                    >
                      <option value="">Quick Area...</option>
                      {NEIGHBORHOODS[selectedCity.name].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  )}
                </div>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Street, Landmark or Area..." 
                    value={pickup}
                    onChange={(e) => {
                      setPickup(e.target.value);
                      if (e.target.value.length > 3) searchLocation(e.target.value, 'pickup');
                    }}
                    className="input-base pl-10 text-sm focus:border-[#10B981]"
                  />
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  {searching.type === 'pickup' && searching.active && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-300" size={16}/>}
                </div>
                {pickupResults.length > 0 && (
                  <div className="absolute z-[2000] w-full bg-white mt-1 rounded-xl shadow-2xl border border-gray-100 overflow-y-auto max-h-[300px] animate-in slide-in-from-top-2 duration-200">
                    {pickupResults.map((item, idx) => (
                      <div key={idx} onClick={() => handleSelect(item, 'pickup')} className="p-3 hover:bg-gray-50 cursor-pointer flex items-start gap-3 border-b border-gray-50 last:border-0 transition-colors">
                        <MapPin size={16} className="mt-1 text-gray-400 shrink-0" />
                        <div>
                          <p className="text-sm font-bold text-gray-800 line-clamp-1">{item.display_name.split(",")[0]}</p>
                          <p className="text-[10px] text-gray-500 line-clamp-1">{item.display_name.split(",").slice(1,4).join(",")}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Popular Places Suggestions */}
                {pickup === "" && POPULAR_LOCATIONS[selectedCity.name] && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {POPULAR_LOCATIONS[selectedCity.name].map(loc => (
                      <button 
                        key={loc.name}
                        onClick={() => {
                          setPickup(loc.name);
                          setPickupCoords({lat: loc.lat, lng: loc.lng});
                          setForcedP({lat: loc.lat, lng: loc.lng, label: loc.name});
                        }}
                        className="text-[10px] font-bold px-3 py-1 bg-gray-50 text-gray-500 rounded-full border border-gray-100 hover:border-[#10B981] hover:text-[#10B981] transition-all"
                      >
                        {loc.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* DROP-OFF SEARCH */}
              <div className="space-y-2 relative">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Drop-off Location</label>
                  {NEIGHBORHOODS[selectedCity.name] && (
                    <select 
                      className="text-[10px] font-bold text-[#10B981] bg-transparent outline-none cursor-pointer"
                      onChange={async (e) => {
                        if (!e.target.value) return;
                        setDropoff(e.target.value);
                        searchLocation(e.target.value, 'dropoff');
                      }}
                    >
                      <option value="">Quick Area...</option>
                      {NEIGHBORHOODS[selectedCity.name].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  )}
                </div>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Where to?" 
                    value={dropoff}
                    onChange={(e) => {
                      setDropoff(e.target.value);
                      if (e.target.value.length > 3) searchLocation(e.target.value, 'dropoff');
                    }}
                    className="input-base pl-10 text-sm focus:border-[#10B981]"
                  />
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-[#10B981]" size={18} />
                  {searching.type === 'dropoff' && searching.active && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-300" size={16}/>}
                </div>
                {dropoffResults.length > 0 && (
                  <div className="absolute z-[2000] w-full bg-white mt-1 rounded-xl shadow-2xl border border-gray-100 overflow-y-auto max-h-[300px] animate-in slide-in-from-top-2 duration-200">
                    {dropoffResults.map((item, idx) => (
                      <div key={idx} onClick={() => handleSelect(item, 'dropoff')} className="p-3 hover:bg-gray-50 cursor-pointer flex items-start gap-3 border-b border-gray-50 last:border-0 transition-colors">
                        <MapPin size={16} className="mt-1 text-[#10B981] shrink-0" />
                        <div>
                          <p className="text-sm font-bold text-gray-800 line-clamp-1">{item.display_name.split(",")[0]}</p>
                          <p className="text-[10px] text-gray-500 line-clamp-1">{item.display_name.split(",").slice(1,4).join(",")}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Popular Places Suggestions for Drop-off */}
                {dropoff === "" && POPULAR_LOCATIONS[selectedCity.name] && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {POPULAR_LOCATIONS[selectedCity.name].map(loc => (
                      <button 
                        key={loc.name}
                        onClick={() => {
                          setDropoff(loc.name);
                          setDropoffCoords({lat: loc.lat, lng: loc.lng});
                          setForcedD({lat: loc.lat, lng: loc.lng, label: loc.name});
                        }}
                        className="text-[10px] font-bold px-3 py-1 bg-[#10B981]/10 text-[#10B981] rounded-full border border-[#10B981]/20 hover:bg-[#10B981] hover:text-white transition-all"
                      >
                        {loc.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4">
                <button 
                  disabled={!pickupCoords || !dropoffCoords}
                  onClick={() => setCurrentStep(1)}
                  className="btn-primary w-full py-4 text-lg disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-[#10B981]/20 group"
                >
                  Confirm Points 
                  <span className="inline-block transition-transform group-hover:translate-x-1 ml-2">→</span>
                </button>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-8 animate-in slide-in-from-right duration-500 flex-1">
               <h3 className="text-xl font-bold text-gray-800 border-b border-gray-100 pb-4">Ride Mood 🎭</h3>
               
               <div className="space-y-4">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Conversation Style</label>
                  <div className="grid grid-cols-1 gap-3">
                    {["🤫 Silent Ride", "🎵 Music On", "💬 Chatty"].map((m) => (
                      <button key={m} onClick={() => setMood(m)} className={`p-4 border-2 rounded-2xl text-left transition-all ${mood === m ? 'border-[#10B981] bg-[#10B981]/5 ring-1 ring-[#10B981]' : 'border-gray-100 hover:border-gray-300'} flex items-center justify-between group`}>
                         <span className={`font-bold ${mood === m ? 'text-[#10B981]' : 'text-gray-600'}`}>{m}</span>
                         {mood === m && <ShieldCheck size={18} className="text-[#10B981]" />}
                      </button>
                    ))}
                  </div>
               </div>

               {!localUser?.gender && (
                 <div className="p-5 bg-pink-50/50 border border-pink-100 rounded-2xl space-y-3 animate-in fade-in zoom-in-95 duration-500">
                    <div className="flex items-center gap-2">
                       <ShieldCheck size={16} className="text-pink-600" />
                       <p className="text-xs font-bold text-pink-700 uppercase tracking-tight">Unlock Safety Features</p>
                    </div>
                    <p className="text-[11px] text-pink-600 font-medium">Please confirm your gender to access the Female Driver option:</p>
                    <div className="flex gap-2">
                       {["Male", "Female", "Other"].map(g => (
                         <button 
                           key={g}
                           onClick={async () => {
                             try {
                               const updated = await apiFetch("/auth/profile", {
                                 method: "PUT",
                                 body: JSON.stringify({ ...localUser, gender: g.toLowerCase() })
                               });
                               if (updated) {
                                  localStorage.setItem("rideflow_user", JSON.stringify(updated));
                                  setLocalUser(updated);
                                  toast.success(`Profile updated to ${g}! ✨`);
                               }
                             } catch (e) { toast.error("Update failed"); }
                           }}
                           className="flex-1 py-2 bg-white border border-pink-200 rounded-xl text-[10px] font-black uppercase text-pink-600 hover:bg-pink-100 transition-colors"
                         >
                           {g}
                         </button>
                       ))}
                    </div>
                 </div>
               )}

               <div className="space-y-4">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Comfort Extras</label>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { id: "❄️ AC Preferred", label: "❄️ AC Preferred" },
                      { id: "🪟 Window Seat", label: "🪟 Window Seat" },
                      { id: "🐾 Pet Friendly", label: "🐾 Pet Friendly (+₹50)" },
                      ...(localUser?.gender === "female" ? [{ id: "prefer_female_driver", label: "👩‍✈️ Women's Safety: Prefer Female Driver" }] : [])
                    ].map((c) => (
                      <label key={c.id} className="flex items-center justify-between p-4 border-2 border-gray-100 rounded-2xl cursor-pointer hover:bg-gray-50 transition-all">
                        <span className="text-sm font-bold text-gray-600">{c.label}</span>
                        <input 
                          type="checkbox" 
                          checked={c.id === "prefer_female_driver" ? preferFemaleDriver : comfort.includes(c.id)}
                          onChange={() => {
                            if (c.id === "prefer_female_driver") {
                               setPreferFemaleDriver(!preferFemaleDriver);
                               setWomenOnly(!preferFemaleDriver); // syncing for compatibility
                            } else {

                               if (comfort.includes(c.id)) setComfort(comfort.filter(x => x !== c.id));
                               else setComfort([...comfort, c.id]);
                            }
                          }}
                          className="w-5 h-5 accent-[#10B981] rounded-lg"
                        />
                      </label>
                    ))}
                  </div>
               </div>

               <div className="flex gap-4 pt-4 mt-auto">
                 <button onClick={() => setCurrentStep(0)} className="flex-1 py-4 font-bold text-gray-400 border-2 border-gray-100 rounded-2xl hover:bg-gray-50 transition-all">Back</button>
                 <button onClick={() => setCurrentStep(2)} className="flex-[2] btn-primary py-4 rounded-2xl font-bold">Choose Vehicle</button>
               </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right duration-500 flex-1">
               <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <h3 className="text-xl font-bold text-gray-800">Vehicle Type 🚕</h3>
               </div>

               <div className="space-y-3">
                  {[
                    { id: 'bike', label: 'Bike', icon: '/assets/bike.png', meta: 'Quick & Eco Friendly' },
                    { id: 'go', label: 'Go', icon: '/assets/go.png', meta: 'Reliable Everyday Cabs' },
                    { id: 'sedan', label: 'Sedan', icon: '/assets/sedan.png', meta: 'Spacious & Comfortable' },
                    { id: 'xl', label: 'XL', icon: '/assets/xl.png', meta: 'Ultimate Space for 6' },
                    { id: 'parcel', label: 'Parcel/Gift', icon: '/assets/parcel.png', meta: 'Safe Item Delivery' },
                  ].map((v) => {
                    const price = calculateFare(150, v.id); // Base distance logic replacement
                    return (
                      <button key={v.id} onClick={() => setVehicleType(v.id)} className={`w-full p-4 border-2 rounded-2xl flex items-center justify-between transition-all ${vehicleType === v.id ? 'border-[#10B981] bg-[#10B981]/5 ring-1 ring-[#10B981]' : 'border-gray-100 hover:border-gray-200'}`}>
                         <div className="flex items-center gap-4 text-left">
                            <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center p-1 border border-gray-100 shadow-sm overflow-hidden">
                               <img src={v.icon} alt={v.label} className="w-full h-full object-contain hover:scale-110 transition-transform duration-500" />
                            </div>
                            <div>
                               <p className="font-extrabold text-[#111827] leading-none mb-1">{v.label}</p>
                               <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{v.meta}</p>
                            </div>
                         </div>
                         <div className="text-right">
                            <p className="text-lg font-black text-[#111827] tracking-tight">₹{price}</p>
                            <p className="text-[10px] text-[#10B981] font-black uppercase">Instant</p>
                         </div>
                      </button>
                    )
                  })}
               </div>

               {vehicleType === 'parcel' && (
                 <div className="space-y-4 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 animate-in zoom-in-95 duration-500">
                    <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block">Delivery Details</label>
                    <textarea 
                      placeholder="What are we delivering? (e.g. Medium box, flower bouquet...)" 
                      className="w-full bg-white border border-gray-100 p-3 rounded-xl text-sm outline-none focus:border-[#10B981] font-medium"
                      value={parcelDescription}
                      onChange={(e) => setParcelDescription(e.target.value)}
                    />
                    <div className="flex items-center gap-4">
                       <button 
                         onClick={() => {
                           // Simulated photo upload
                           setParcelPhoto("https://images.unsplash.com/photo-1549465220-1d8c9d9c6703?q=80&w=2670&auto=format&fit=crop");
                           toast.success("Item photo captured!");
                         }}
                         className="flex-1 py-3 px-4 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-2"
                       >
                          📷 Take Photo
                       </button>
                       {parcelPhoto && (
                         <div className="w-12 h-12 rounded-lg border border-emerald-200 bg-cover bg-center" style={{backgroundImage: `url(${parcelPhoto})`}} />
                       )}
                    </div>
                 </div>
               )}

               <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
                  <div className="flex items-center justify-between">
                     <span className="text-sm font-bold text-gray-600 flex items-center gap-2"><Search size={16}/> Schedule for later?</span>
                     <input type="checkbox" checked={isScheduled} onChange={(e) => setIsScheduled(e.target.checked)} className="w-5 h-5 accent-emerald-600 rounded" />
                  </div>
                  {isScheduled && (
                    <div className="space-y-4 animate-in slide-in-from-top-4 duration-500">
                       <input 
                         type="datetime-local" 
                         className="w-full bg-white border border-gray-200 p-3 rounded-xl text-sm outline-none focus:border-[#10B981] font-bold text-gray-700" 
                         value={scheduledAt}
                         onChange={(e) => setScheduledAt(e.target.value)}
                       />
                       <div className="flex items-center justify-between p-3 bg-[#10B981]/5 rounded-xl border border-[#10B981]/10">
                          <div className="flex items-center gap-2">
                             <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-[#10B981] shadow-sm">
                                <Bell size={16} />
                             </div>
                             <div>
                                <p className="text-xs font-bold text-gray-800">30-min Reminder</p>
                                <p className="text-[10px] text-gray-400 font-medium tracking-tight">Notify me before pickup</p>
                             </div>
                          </div>
                          <input 
                             type="checkbox" 
                             checked={isReminder} 
                             onChange={async (e) => {
                                if (e.target.checked && Notification.permission !== "granted") {
                                   const res = await Notification.requestPermission();
                                   if (res !== "granted") {
                                      toast.error("Notifications are blocked");
                                      return;
                                   }
                                }
                                setIsReminder(e.target.checked);
                             }} 
                             className="w-5 h-5 accent-emerald-600 rounded cursor-pointer" 
                          />
                       </div>
                    </div>
                  )}
               </div>

               <div className="flex gap-4 pt-4 mt-auto">
                 <button onClick={() => setCurrentStep(1)} className="flex-1 py-4 font-bold text-gray-400 border-2 border-gray-100 rounded-2xl hover:bg-gray-50 transition-all">Back</button>
                 <button onClick={handleBook} disabled={loading} className="flex-[2] btn-primary py-4 rounded-2xl text-lg font-bold shadow-xl shadow-[#10B981]/20">
                    {loading ? <Loader2 size={24} className="animate-spin mx-auto" /> : `Confirm ${vehicleType.toUpperCase()}`}
                 </button>
               </div>
            </div>
          )}

        </div>

        {/* MAP COLUMN */}
        <div className="lg:col-span-2 card-white p-2 h-[700px] lg:h-[800px] relative overflow-hidden shadow-2xl">
           <div className="absolute top-6 left-6 z-[1000] bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg border border-white/20 pointer-events-none">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-0.5">Navigation Status</p>
              <p className="text-sm font-black text-gray-800">
                {!pickupCoords ? "📍 SET PICKUP" : !dropoffCoords ? "📍 SET DROP-OFF" : "✅ READY TO RIDE"}
              </p>
           </div>
           
           <BookingMap 
             baseLat={selectedCity.lat}
             baseLng={selectedCity.lng}
             forcedPickup={forcedP}
             forcedDropoff={forcedD}
             onPickupSet={(lat, lng, label) => {
               setPickupCoords({lat, lng});
               setPickup(label);
             }}
             onDropoffSet={(lat, lng, label) => {
               setDropoffCoords({lat, lng});
               setDropoff(label);
             }}
           />
        </div>

      </div>
    </div>
  );
}
