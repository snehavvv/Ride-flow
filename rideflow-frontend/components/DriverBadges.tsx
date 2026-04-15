import React from "react";
import { Star, Clock, Moon, Shield, Zap, Heart } from "lucide-react";

interface DriverBadgesProps {
  badges: string[];
  size?: "sm" | "md";
}

const BADGE_MAP: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  "Top Rated": { label: "Top Rated", icon: Star, color: "text-amber-600", bg: "bg-amber-50" },
  "5+ Years Experience": { label: "5+ Years Exp", icon: Clock, color: "text-blue-600", bg: "bg-blue-50" },
  "Night Shift Pro": { label: "Night Pro", icon: Moon, color: "text-purple-600", bg: "bg-purple-50" },
  "Women-Friendly": { label: "Women-Friendly", icon: Heart, color: "text-pink-600", bg: "bg-pink-50" },
  "Fast Pickup": { label: "Fast Pickup", icon: Zap, color: "text-yellow-600", bg: "bg-yellow-50" },
  "Safety First": { label: "Safety First", icon: Shield, color: "text-[#10B981]", bg: "bg-[#10B981]/10" },
};

export default function DriverBadges({ badges, size = "sm" }: DriverBadgesProps) {
  if (!badges || badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((b) => {
        const config = BADGE_MAP[b];
        if (!config) return null;
        const Icon = config.icon;

        return (
          <div 
            key={b} 
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-current/10 ${config.bg} ${config.color} shadow-sm animate-in zoom-in-50 duration-300`}
          >
            <Icon size={size === "sm" ? 12 : 14} strokeWidth={2.5} />
            <span className={`font-black uppercase tracking-tighter ${size === "sm" ? "text-[9px]" : "text-[10px]"}`}>
              {config.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
