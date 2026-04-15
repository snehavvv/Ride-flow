"use client";

import React, { useState, useEffect } from "react";
import { 
  Bike, 
  BarChart2, 
  Leaf, 
  Target, 
  Zap, 
  IndianRupee, 
  ArrowRight,
  Gift,
  Bell,
  ShieldCheck
} from "lucide-react";
import Link from "next/link";
import { isLoggedIn } from "../lib/auth";

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    setIsAuth(isLoggedIn());
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);

    // Fetch Hero Video
    const fetchVideo = async () => {
      try {
        const res = await fetch("/api/hero-video");
        const data = await res.json();
        if (data.url) setVideoUrl(data.url);
      } catch (err) {
        console.error("Failed to fetch hero video:", err);
      }
    };
    fetchVideo();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const dashboardPath = isAuth ? "/dashboard" : "/login";

  return (
    <div className="min-h-screen font-inter bg-[var(--bg-page)] text-[var(--text-primary)]">
      {/* SECTION 1 — HERO */}
      <section className="relative min-h-screen bg-[#0A1F14] text-white flex flex-col overflow-hidden">
        {/* Background Video or Fallback Pattern */}
        {videoUrl ? (
          <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover z-0">
            <source src={videoUrl} type="video/mp4" />
          </video>
        ) : (
          <div className="absolute inset-0 opacity-[0.15] pointer-events-none z-0">
            <svg width="100%" height="100%">
              <pattern id="network" width="100" height="100" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.5" fill="#10B981" />
                <line x1="2" y1="2" x2="100" y2="100" stroke="#10B981" strokeWidth="0.5" />
                <line x1="2" y1="2" x2="100" y2="0" stroke="#10B981" strokeWidth="0.5" />
              </pattern>
              <rect width="100%" height="100%" fill="url(#network)" />
            </svg>
          </div>
        )}

        <div className="absolute inset-0 bg-black/60 z-10" />

        <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          scrolled ? "bg-white border-b border-gray-100 py-4 shadow-sm" : "bg-transparent py-6"
        }`}>
          <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
            <div className="flex items-center gap-1 text-2xl font-bold">
              <span className={scrolled ? "text-[#111827]" : "text-white"}>Ride</span>
              <span className="text-[#10B981]">Flow</span>
            </div>
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className={`text-sm font-medium hover:text-[#10B981] transition-colors ${
                scrolled ? "text-[#6B7280]" : "text-white"
              }`}>
                Dashboard
              </Link>
              <Link href="/register" className="btn-primary px-6 py-2">Get Started</Link>
            </div>
          </div>
        </nav>

        <div className="relative flex-1 flex flex-col items-center justify-center px-6 text-center z-20 pt-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0A1F14]/80 backdrop-blur-sm border border-[#10B981]/30 mb-8">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            <span className="text-sm font-medium text-white tracking-wide uppercase">Ride. Send. Protect.</span>
          </div>

          <h1 className="text-5xl md:text-[64px] font-extrabold leading-tight mb-6 max-w-4xl tracking-tight">
            The Future of <br />
            <span className="bg-gradient-to-r from-[#10B981] to-[#06B6D4] bg-clip-text text-transparent">Urban Mobility</span>
          </h1>

          <p className="text-gray-300 text-lg md:text-xl max-w-[650px] mb-10 leading-relaxed">
            From scheduled rides and safe commutes to parcel deliveries with photo verification. RideFlow is your all-in-one ecosystem for a smarter, safer, and greener city.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link href={dashboardPath} className="btn-primary px-8 py-3.5 text-base">
              Launch Dashboard <ArrowRight size={20} />
            </Link>
            <a href="#features" className="btn-secondary px-8 py-3.5 text-base">
              Explore Our Features
            </a>
          </div>
        </div>
      </section>

      {/* SECTION 2 — FEATURES */}
      <section id="features" className="py-24 bg-[#F3F4F6] px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-[#111827] mb-4">
              Designed for the way <br />
              <span className="bg-gradient-to-r from-[#10B981] to-[#06B6D4] bg-clip-text text-transparent">you move today</span>
            </h2>
            <p className="text-[#6B7280] text-lg max-w-xl mx-auto">
              Everything from daily commutes to logistics, wrapped in a beautiful, security-first experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
            <FeatureCard 
              icon={<Gift size={24} />} 
              title="Parcel & Gift Delivery" 
              desc="Send packages securely across the city with real-time photo verification and safe handling." 
            />
            <FeatureCard 
              icon={<ShieldCheck size={24} />} 
              title="Women Only Safety" 
              desc="Dedicated safety filters allowing female passengers to book rides specifically with verified female drivers." 
            />
            <FeatureCard 
              icon={<Bell size={24} />} 
              title="Scheduled Rides" 
              desc="Never be late again. Schedule your trips in advance and receive early reminders before pickup." 
            />
            <FeatureCard 
              icon={<Zap size={24} />} 
              title="Ride Customization" 
              desc="Choose your ride mood (silent or chatty) and comfort preferences like AC or pets." 
            />
            <FeatureCard 
              icon={<Leaf size={24} />} 
              title="Eco Tracking" 
              desc="Monitor your carbon footprint and compete on the eco-leaderboard for a greener commute." 
            />
            <FeatureCard 
              icon={<Target size={24} />} 
              title="Multi-Role Dashboard" 
              desc="Tailored experiences for Passengers, Drivers, and Admins to manage the entire ecosystem." 
            />
          </div>
        </div>
      </section>

      {/* SECTION 3 — CTA CARD */}
      <section className="py-24 bg-[#F3F4F6] px-6">
        <div className="max-w-[600px] mx-auto bg-[#0A1F14] rounded-2xl p-12 text-center shadow-2xl relative overflow-hidden group">
          <h2 className="text-3xl font-bold text-white mb-4 relative z-10">Start tracking today</h2>
          <p className="text-gray-400 mb-10 relative z-10">Join thousands of smart commuters optimizing their daily travel.</p>
          <div className="relative z-10">
            <Link href={dashboardPath} className="btn-primary px-10 py-4 text-lg">
              Open Dashboard <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      <footer className="py-12 bg-white px-6 border-t border-gray-100">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
          <div className="flex items-center gap-1 text-2xl font-bold mb-6">
            <span className="text-[#111827]">Ride</span>
            <span className="text-[#10B981]">Flow</span>
          </div>
          <p className="text-gray-400 text-sm">© 2025 RideFlow. Built for smarter commutes.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="card-white p-8 group">
      <div className="w-12 h-12 bg-[#D1FAE5] rounded-xl flex items-center justify-center text-[#10B981] mb-6 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-[#111827] mb-3">{title}</h3>
      <p className="text-[#6B7280] leading-relaxed text-sm">{desc}</p>
    </div>
  );
}
