"use client";

import React from "react";
import { motion } from "framer-motion";
import { Car, Shield, BarChart3, Leaf, ArrowRight, Zap, Globe, Github } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-blue-500/30">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/40">
            <Car className="text-white w-6 h-6" />
          </div>
          <span className="text-2xl font-bold font-outfit tracking-tight">RideFlow</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/60">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#sustainability" className="hover:text-white transition-colors">Sustainability</a>
          <a href="#about" className="hover:text-white transition-colors">About</a>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="px-5 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors">
            Login
          </Link>
          <Link href="/register" className="px-5 py-2.5 bg-white text-black rounded-full text-sm font-bold hover:bg-white/90 transition-all shadow-lg shadow-white/10">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32 px-8 max-w-7xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md">
            <Zap size={14} className="text-blue-400" />
            <span className="text-xs font-semibold tracking-wide uppercase text-blue-400">Next Gen Ride Intelligence</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-bold font-outfit tracking-tight mb-8 leading-[1.1]">
            Management for the <br /> 
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Modern Commute.</span>
          </h1>
          <p className="max-w-2xl mx-auto text-white/50 text-lg md:text-xl mb-12 leading-relaxed font-inter">
            Effortlessly track your rides, monitor environmental impact, and optimize your travel costs with our advanced SaaS-driven platform.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link href="/dashboard" className="group flex items-center gap-3 px-8 py-4 bg-blue-600 rounded-full font-bold text-lg hover:bg-blue-500 transition-all shadow-xl shadow-blue-500/25">
              Launch Dashboard
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <button className="flex items-center gap-3 px-8 py-4 bg-white/5 border border-white/10 rounded-full font-bold text-lg hover:bg-white/10 transition-all backdrop-blur-md">
              View Features
            </button>
          </div>
        </motion.div>

        {/* Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 100 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="mt-24 relative p-2 rounded-[2.5rem] bg-gradient-to-br from-white/10 to-transparent border border-white/20 shadow-2xl overflow-hidden"
        >
          <div className="absolute inset-0 bg-blue-600/5 blur-[80px] -z-10" />
          <img 
            src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=2070" 
            alt="Dashboard Preview" 
            className="rounded-[2rem] w-full shadow-2xl opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" />
        </motion.div>
      </section>

      {/* Features Grid */}
      <section id="features" className="relative z-10 py-32 px-8 max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold font-outfit mb-6">Designed for Excellence</h2>
          <p className="text-white/40 text-lg">Every feature built to give you total control over your mobility.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard 
            icon={<BarChart3 className="text-blue-400" />}
            title="Advanced Analytics"
            description="Visualize your travel patterns with interactive charts and deep-dive metrics."
            delay={0.1}
          />
          <FeatureCard 
            icon={<Leaf className="text-green-400" />}
            title="Eco-Tracking"
            description="Monitor your carbon footprint and get smart suggestions for a greener commute."
            delay={0.2}
          />
          <FeatureCard 
            icon={<Shield className="text-purple-400" />}
            title="Privacy First"
            description="Your ride data is encrypted and securely stored with full user control."
            delay={0.3}
          />
        </div>
      </section>

      {/* CTA Footer */}
      <footer className="relative z-10 pt-32 pb-12 px-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Car size={18} />
            </div>
            <span className="text-xl font-bold font-outfit">RideFlow</span>
          </div>
          <div className="flex gap-12 text-sm text-white/40">
            <div className="space-y-4">
              <p className="text-white/80 font-bold uppercase tracking-widest text-xs">Product</p>
              <p className="hover:text-white cursor-pointer">Features</p>
              <p className="hover:text-white cursor-pointer">Pricing</p>
            </div>
            <div className="space-y-4">
              <p className="text-white/80 font-bold uppercase tracking-widest text-xs">Company</p>
              <p className="hover:text-white cursor-pointer">About</p>
              <p className="hover:text-white cursor-pointer">Careers</p>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/5 text-xs text-white/20 uppercase tracking-widest">
          <p>© 2026 RideFlow Intelligence Inc. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <Globe size={16} className="cursor-pointer hover:text-white transition-colors" />
            <Github size={16} className="cursor-pointer hover:text-white transition-colors" />
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description, delay }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
    >
      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
        {React.cloneElement(icon as React.ReactElement, { size: 24 })}
      </div>
      <h3 className="text-xl font-bold font-outfit mb-3">{title}</h3>
      <p className="text-white/40 leading-relaxed text-sm">
        {description}
      </p>
    </motion.div>
  );
}
