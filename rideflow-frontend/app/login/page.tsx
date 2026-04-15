"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Users, Car, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({ email: false, password: false, message: "" });
  const [loginMode, setLoginMode] = useState<"user" | "driver" | "admin">("user");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({ email: false, password: false, message: "" });
    
    if (!formData.email || !formData.password) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('username', formData.email);
      params.append('password', formData.password);

      const res = await fetch("http://localhost:8000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params,
      });

      const data = await res.json();

      if (res.ok) {
        // Validate role matches login mode
        const userRole = data.user.role;
        
        if (userRole !== loginMode) {
          const modeLabel = loginMode === "user" ? "Passenger" : loginMode === "driver" ? "Driver" : "Admin";
          toast.error(`Account found, but it is not a ${modeLabel} account.`);
          setLoading(false);
          return;
        }

        localStorage.setItem("rideflow_token", data.access_token);
        localStorage.setItem("rideflow_user", JSON.stringify(data.user));
        toast.success(`Welcome back, ${data.user.name}! 👋`);
        
        if (data.user.role === "admin") {
          router.push("/dashboard/admin");
        } else {
          router.push("/dashboard");
        }
      } else {
        const detail = data.detail;
        if (detail.includes("email")) {
          setErrors(prev => ({ ...prev, email: true, message: detail }));
        } else if (detail.includes("password")) {
          setErrors(prev => ({ ...prev, password: true, message: detail }));
          setFormData(prev => ({ ...prev, password: "" })); // Clear password
        }
        toast.error(detail);
      }
    } catch (error) {
      toast.error("Cannot connect to server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    setErrors({ ...errors, [field]: false, message: "" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F3F4F6] px-6 font-inter">
      <div className="max-w-md w-full card-white p-10">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-1 text-3xl font-bold mb-4 outline-none">
            <span className="text-[#111827]">Ride</span>
            <span className="text-[#10B981]">Flow</span>
          </Link>
          <h2 className="text-2xl font-bold text-[#111827]">Login to your account</h2>
          <p className="text-[#6B7280] text-sm mt-2">Enter your credentials to access your dashboard</p>
        </div>

        {/* ROLE SELECTOR */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <button 
            type="button"
            onClick={() => setLoginMode("user")}
            className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-300 outline-none ${
              loginMode === "user" 
                ? "bg-[#10B981]/10 border-[#10B981] text-[#10B981] shadow-md shadow-[#10B981]/10" 
                : "bg-white border-gray-100 text-gray-400 hover:border-gray-200 hover:bg-gray-50"
            }`}
          >
            <Users size={24} />
            <span className="text-[10px] font-black uppercase tracking-widest">Passenger</span>
          </button>

          <button 
            type="button"
            onClick={() => setLoginMode("driver")}
            className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-300 outline-none ${
              loginMode === "driver" 
                ? "bg-[#3B82F6]/10 border-[#3B82F6] text-[#3B82F6] shadow-md shadow-[#3B82F6]/10" 
                : "bg-white border-gray-100 text-gray-400 hover:border-gray-200 hover:bg-gray-50"
            }`}
          >
            <Car size={24} />
            <span className="text-[10px] font-black uppercase tracking-widest">Driver</span>
          </button>

          <button 
            type="button"
            onClick={() => setLoginMode("admin")}
            className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-300 outline-none ${
              loginMode === "admin" 
                ? "bg-[#6366F1]/10 border-[#6366F1] text-[#6366F1] shadow-md shadow-[#6366F1]/10" 
                : "bg-white border-gray-100 text-gray-400 hover:border-gray-200 hover:bg-gray-50"
            }`}
          >
            <ShieldCheck size={24} />
            <span className="text-[10px] font-black uppercase tracking-widest">Admin</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#6B7280]">Email Address</label>
            <input 
              type="email" 
              required
              placeholder="name@example.com"
              className={`input-base ${errors.email ? 'border-[#EF4444] focus:ring-[#EF4444]/20' : ''}`}
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
            />
            {errors.email && <p className="text-[#EF4444] text-sm font-medium ml-1 mt-1">{errors.message}</p>}
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-[#6B7280]">Password</label>
              <Link href="/forgot-password" title="Forgot Password Page" className="text-xs text-[#10B981] font-semibold hover:underline">Forgot Password?</Link>
            </div>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                required
                placeholder="••••••••"
                className={`input-base pr-12 ${errors.password ? 'border-[#EF4444] focus:ring-[#EF4444]/20' : ''}`}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#111827] transition-colors"
                title={showPassword ? "Hide Password" : "Show Password"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && <p className="text-[#EF4444] text-sm font-medium ml-1 mt-1">{errors.message}</p>}
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className={`w-full py-4 rounded-2xl text-white font-bold transition-all shadow-xl flex items-center justify-center gap-2 ${
              loginMode === "user" ? "bg-[#10B981] shadow-[#10B981]/20 hover:bg-[#0D9668]" : 
              loginMode === "driver" ? "bg-[#3B82F6] shadow-[#3B82F6]/20 hover:bg-[#2563EB]" : 
              "bg-[#6366F1] shadow-[#6366F1]/20 hover:bg-[#4F46E5]"
            }`}
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : `Login as ${loginMode === "user" ? "Passenger" : loginMode === "driver" ? "Driver" : "Admin"}`}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-gray-100 text-center">
          <p className="text-sm text-[#6B7280]">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-[#10B981] font-bold hover:underline">Sign up for free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
