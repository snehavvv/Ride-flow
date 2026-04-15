"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  MapPin, 
  History, 
  BarChart3, 
  ShieldCheck, 
  Users, 
  Car, 
  Settings, 
  LogOut, 
  Bell, 
  User,
  Navigation,
  Leaf,
  Menu,
  X,
  ChevronDown
} from "lucide-react";
import { logout, getUser, isDriver, isAdmin } from "../../lib/auth";
import { useAuth } from "../../hooks/useAuth";
import { toast } from "react-hot-toast";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const user = getUser();
  
  const userIsAdmin = isAdmin();
  const userIsDriver = isDriver();

  React.useEffect(() => {
    if (mounted && user) {
      const role = userIsAdmin ? "admin" : userIsDriver ? "driver" : "passenger";
      // Use relative path for WebSocket if possible, but here we use absolute
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.hostname; // usually localhost
      const wsUrl = `${protocol}//${host}:8000/ws/${user.user_id}?role=${role}&gender=${user.gender || "unknown"}`;
      
      console.log("Connecting to WebSocket:", wsUrl);
      let ws = new WebSocket(wsUrl);
      
      ws.onopen = () => console.log("WebSocket Connected");

      ws.onmessage = (event) => {
         try {
            const data = JSON.parse(event.data);
            if (data.message) {
                toast.success(data.message, { 
                   duration: 6000, 
                   icon: '🚀',
                   style: { background: '#fff', color: '#111827', border: '1px solid #10B981', fontWeight: '600' }
                });
            }
            // Automatically trigger data refresh across the app
            window.dispatchEvent(new Event("refresh_data"));
         } catch(e) {}
      };


      return () => {
         ws.close();
      };
    }
  }, [mounted, user, userIsAdmin, userIsDriver]);


  const getNavItems = () => {
    if (userIsAdmin) {
      return [
        { name: "Overview", href: "/dashboard/admin", icon: <LayoutDashboard size={20} /> },
        { name: "Users", href: "/dashboard/admin?tab=users", icon: <Users size={20} /> },
        { name: "Drivers", href: "/dashboard/admin?tab=drivers", icon: <Car size={20} /> },
        { name: "Settings", href: "/dashboard/settings", icon: <Settings size={20} /> },
      ];
    }
    if (userIsDriver) {
      return [
        { name: "Driver Hub", href: "/dashboard", icon: <LayoutDashboard size={20} /> },
        { name: "Available Rides", href: "/dashboard/available-rides", icon: <MapPin size={20} /> },
        { name: "Active Ride", href: "/dashboard/active-ride", icon: <Navigation size={20} /> },
        { name: "Settings", href: "/dashboard/settings", icon: <Settings size={20} /> },
      ];
    }
    // Passenger defaults
    return [
      { name: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={20} /> },
      { name: "Book a Ride", href: "/dashboard/book-ride", icon: <MapPin size={20} /> },
      { name: "My Rides", href: "/dashboard/my-rides", icon: <History size={20} /> },
      { name: "Eco Tracker", href: "/dashboard/eco-leaderboard", icon: <Leaf size={20} /> },
      { name: "Settings", href: "/dashboard/settings", icon: <Settings size={20} /> },
    ];
  };

  const navItems = getNavItems();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] flex font-inter relative overflow-hidden">
      {/* Decorative background blobs for glassmorphism effect */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--accent-secondary)] opacity-10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[var(--accent-primary)] opacity-10 blur-[120px] rounded-full pointer-events-none" />

      {/* SIDEBAR - DESKTOP */}
      <aside className="hidden lg:flex flex-col w-[280px] glass-panel fixed h-full z-40 border-r border-slate-200">
        <div className="p-8">
          <Link href="/" className="flex items-center gap-1 text-2xl font-bold">
            <span>Ride</span>
            <span className="text-[#10B981]">Flow</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {mounted && navItems.map((item) => {
            const isActive = (pathname || "") === item.href || (pathname || "").startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden ${
                  isActive 
                    ? "text-[var(--accent-primary)] font-bold bg-[var(--accent-primary)]/10" 
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-[var(--accent-primary)] rounded-r-full shadow-[0_0_10px_var(--accent-primary)]" />
                )}
                <span className={isActive ? "text-[var(--accent-primary)]" : "text-slate-400 group-hover:text-[var(--accent-primary)] transition-colors"}>
                  {item.icon}
                </span>
                <span className="text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* SIDEBAR USER INFO */}
        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-[var(--accent-primary)]/10 flex items-center justify-center text-[var(--accent-primary)] font-bold">
               {mounted ? (user?.name?.charAt(0) || "U") : "U"}
            </div>
            <div className="flex-1 truncate">
               <p className="text-xs font-bold text-slate-900 truncate">{mounted ? (user?.name || "User") : "User"}</p>
               <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${userIsAdmin ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : userIsDriver ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                                   {mounted ? (userIsAdmin ? "Admin" : userIsDriver ? "Driver" : "Passenger") : "..."}
               </span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-red-50 hover:text-red-500 rounded-lg transition-all text-sm font-medium"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <div className="lg:hidden fixed top-0 w-full glass-panel h-20 px-6 flex items-center justify-between z-50 border-b border-slate-200">
        <Link href="/" className="flex items-center gap-1 text-2xl font-bold">
          <span>Ride</span>
          <span className="text-[#10B981]">Flow</span>
        </Link>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 outline-none">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* MOBILE MENU OVERLAY */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-white z-40 pt-20 px-6 animate-in slide-in-from-top duration-300">
          <nav className="space-y-2">
            {mounted && navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-4 px-6 py-4 rounded-xl text-lg ${
                  pathname === item.href ? "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] font-bold" : "text-slate-600"
                }`}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-4 px-6 py-4 text-red-500 font-bold border-t border-slate-200 mt-4"
            >
              <LogOut size={24} />
              Logout
            </button>
          </nav>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 lg:ml-[280px] min-h-screen flex flex-col pt-20 lg:pt-0 relative z-10">
        {/* TOPBAR */}
        <header className="h-16 lg:h-24 glass border-b border-slate-200 px-6 lg:px-12 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              {mounted ? (navItems.find(item => (pathname || "") === item.href || (pathname || "").startsWith(`${item.href}/`))?.name || "Overview") : "Loading..."}
            </h2>
            {mounted && userIsAdmin && (
               <span className="bg-[#10B981]/5 text-[#10B981] text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full border border-[#10B981]/10">
                 Shield Active
               </span>
            )}
            {mounted && user?.gender === "female" && (
               <span className="bg-pink-50 text-pink-600 text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full border border-pink-100 flex items-center justify-center gap-1">
                 <ShieldCheck size={12}/> Women Safety Enabled
               </span>
            )}
          </div>

          <div className="flex items-center gap-4 lg:gap-6">
            <button className="btn-ghost p-2 relative outline-none" title="Notifications">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>

            <div className="relative">
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-3 p-1.5 pl-5 rounded-full border border-slate-200 hover:bg-slate-100 transition-all outline-none"
                title="User Menu"
              >
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-bold text-slate-800 leading-none">{mounted ? (user?.name || "Commuter") : "Commuter"}</p>
                  <div className="flex items-center justify-end gap-2 mt-1.5">
                    <p className="text-[10px] font-bold text-[var(--accent-primary)] uppercase tracking-wider">
                      {mounted ? (userIsAdmin ? "Admin" : userIsDriver ? "Driver" : "Passenger") : "..."}
                    </p>
                  </div>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] rounded-full flex items-center justify-center text-white font-bold shadow-md shadow-[var(--accent-primary)]/20">
                  {mounted ? (user?.name?.charAt(0) || <User size={18} />) : <User size={18} />}
                </div>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-4 w-60 bg-white border border-slate-200 rounded-2xl shadow-2xl py-3 z-50 animate-in fade-in zoom-in duration-200 origin-top-right">
                  <div className="px-5 py-3 mb-2">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Logged in as</p>
                     <p className="text-sm font-bold text-slate-800 break-all">{user?.email}</p>
                  </div>
                  <div className="h-px bg-slate-100 my-2" />
                  <Link href="/dashboard/settings" className="flex items-center gap-3 px-5 py-3 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                    <User size={16} /> Profile Settings
                  </Link>
                  <div className="h-px bg-slate-100 my-1" />
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-5 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors font-bold"
                  >
                    <LogOut size={16} /> Logout Account
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <section className="flex-1 p-6 lg:p-10">
          {children}
        </section>
      </main>
    </div>
  );
}
