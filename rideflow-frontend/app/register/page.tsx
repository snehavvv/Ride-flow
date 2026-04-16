"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Eye, EyeOff, Check, X, Car } from "lucide-react";
import toast from "react-hot-toast";
import { BASE_URL } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    gender: "",
    phone: "",
    apply_as_driver: false,
    vehicleNumber: "",
    vehicleType: "go"
  });
  const [emailError, setEmailError] = useState(false);

  const [strength, setStrength] = useState(0);
  const [criteria, setCriteria] = useState({
    length: false,
    upper: false,
    number: false,
    special: false
  });

  useEffect(() => {
    const pass = formData.password;
    const newCriteria = {
      length: pass.length >= 8,
      upper: /[A-Z]/.test(pass),
      number: /[0-9]/.test(pass),
      special: /[^A-Za-z0-9]/.test(pass)
    };
    setCriteria(newCriteria);
    
    const count = Object.values(newCriteria).filter(Boolean).length;
    setStrength(count);
  }, [formData.password]);

  const getStrengthConfig = () => {
    if (strength <= 2) return { width: "33%", color: "bg-red-500", label: "Weak" };
    if (strength === 3) return { width: "66%", color: "bg-amber-500", label: "Good" };
    return { width: "100%", color: "bg-[#10B981]", label: "Strong" };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword || !formData.phone) {
      toast.error("Please fill in all fields");
      return;
    }
    if (strength < 2 && formData.password.length < 6) {
      toast.error("Password is too weak");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    setEmailError(false);
    try {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          gender: formData.gender,
          phone: formData.phone,
          apply_as_driver: formData.apply_as_driver
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // Auto-login logic
        localStorage.setItem("rideflow_token", data.access_token);
        localStorage.setItem("rideflow_user", JSON.stringify({
          user_id: data.user_id,
          name: formData.name,
          email: formData.email,
          role: data.role,
          gender: formData.gender
        }));

        // If driver, register the vehicle info
        if (formData.apply_as_driver) {
          await fetch(`${BASE_URL}/drivers/register`, {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Authorization": `Bearer ${data.access_token}`
            },
            body: JSON.stringify({
              vehicle_number: formData.vehicleNumber,
              vehicle_type: formData.vehicleType
            }),
          });
        }

        toast.success("Registration successful! 🚀");
        setTimeout(() => router.push("/dashboard"), 1500);
      } else {
        if (data.detail && data.detail.includes("registered")) {
          setEmailError(true);
          toast.error("This email is already registered. Login instead.");
        } else {
          toast.error(data.detail || "Registration failed");
        }
      }
    } catch (error) {
      toast.error("Connecting to server failed");
    } finally {
      setLoading(false);
    }
  };

  const config = getStrengthConfig();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F3F4F6] px-6 py-12 font-inter">
      <div className="max-w-md w-full card-white p-10">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-1 text-3xl font-bold mb-4 outline-none">
            <span className="text-[#111827]">Ride</span>
            <span className="text-[#10B981]">Flow</span>
          </Link>
          <h2 className="text-2xl font-bold text-[#111827]">Create your account</h2>
          <p className="text-[#6B7280] text-sm mt-2 font-medium">Start tracking your rides smarter today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-[#6B7280] uppercase tracking-wider text-[10px]">Full Name</label>
            <input 
              type="text" 
              required
              placeholder="John Doe"
              className="input-base"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-[#6B7280] uppercase tracking-wider text-[10px]">Email Address</label>
            <input 
              type="email" 
              required
              placeholder="name@example.com"
              className={`input-base ${emailError ? 'border-[#EF4444] focus:ring-[#EF4444]/20' : ''}`}
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                setEmailError(false);
              }}
            />
            {emailError && <p className="text-[#EF4444] text-sm font-medium ml-1 mt-1">This email is already registered.</p>}
          </div>
          
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-[#6B7280] uppercase tracking-wider text-[10px]">Phone Number</label>
            <input 
              type="tel" 
              required
              placeholder="+1 (555) 000-0000"
              className="input-base"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="space-y-1.5 pt-1">
            <label className="text-sm font-bold text-[#6B7280] uppercase tracking-wider text-[10px]">Gender</label>
            <select 
              required
              className="input-base"
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
            >
              <option value="" disabled>Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-[#6B7280] uppercase tracking-wider text-[10px]">Password</label>
            <div className="relative">
              <input 
                type={showPass ? "text" : "password"} 
                required
                placeholder="Secure password"
                className="input-base pr-12"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <button 
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#111827] transition-colors"
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            
            {/* STRENGTH BAR */}
            {formData.password && (
              <div className="mt-3 space-y-2">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] font-bold text-[#9CA3AF] uppercase">Security Level</span>
                  <span className={`text-[10px] font-bold uppercase ${config.color.replace('bg-', 'text-')}`}>{config.label}</span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${config.color}`} 
                    style={{ width: config.width }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5 pt-1">
            <label className="text-sm font-bold text-[#6B7280] uppercase tracking-wider text-[10px]">Confirm Password</label>
            <div className="relative">
              <input 
                type={showConfirm ? "text" : "password"} 
                required
                placeholder="••••••••"
                className="input-base pr-12"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              />
              <button 
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#111827] transition-colors"
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className={`flex items-start gap-4 p-5 rounded-2xl border-2 transition-all duration-300 ${formData.apply_as_driver ? 'bg-[#10B981]/10 border-[#10B981]' : 'bg-gray-50 border-gray-100 hover:border-gray-200'}`}>
            <div className="pt-0.5">
              <input 
                type="checkbox" 
                id="apply_as_driver" 
                className="w-5 h-5 accent-[#10B981] rounded-lg cursor-pointer"
                checked={formData.apply_as_driver}
                onChange={(e) => setFormData({ ...formData, apply_as_driver: e.target.checked })}
              />
            </div>
            <label htmlFor="apply_as_driver" className="cursor-pointer">
              <span className="block text-sm font-black text-[#111827] uppercase tracking-wider mb-0.5 flex items-center gap-2">
                <Car size={14} className="text-[#10B981]" /> I want to drive with RideFlow
              </span>
              <span className="block text-[11px] font-medium text-gray-500 leading-relaxed">
                Unlock the Driver Hub and start earning. Provide your vehicle details below.
              </span>
            </label>
          </div>

          {formData.apply_as_driver && (
            <div className="space-y-4 p-5 rounded-2xl bg-[#10B981]/5 border border-[#10B981]/10 animate-in slide-in-from-top duration-300">
               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#10B981] uppercase tracking-wider">Vehicle Number</label>
                  <input 
                    type="text" 
                    required
                    placeholder="MH 01 AB 1234"
                    className="input-base border-[#10B981]/20 focus:border-[#10B981] focus:ring-[#10B981]/20"
                    value={formData.vehicleNumber}
                    onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                  />
               </div>
               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#10B981] uppercase tracking-wider">Vehicle Type</label>
                  <select 
                    className="input-base border-[#10B981]/20 focus:border-[#10B981] focus:ring-[#10B981]/20"
                    value={formData.vehicleType}
                    onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                  >
                    <option value="go">RideFlow Go (Hatchback)</option>
                    <option value="sedan">RideFlow Sedan</option>
                    <option value="xl">RideFlow XL (SUV)</option>
                    <option value="bike">RideFlow Bike</option>
                  </select>
               </div>
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full py-4 mt-6 shadow-xl shadow-[#10B981]/20">
            {loading ? <Loader2 className="animate-spin" size={20} /> : "Create Account"}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-gray-100 text-center">
          <p className="text-sm text-[#6B7280] font-medium">
            Already have an account?{" "}
            <Link href="/login" className="text-[#10B981] font-bold hover:underline">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
