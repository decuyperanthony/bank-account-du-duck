"use client";

import Link from "next/link";
import { Home, Plus, Settings, BarChart3, CalendarDays } from "lucide-react";
import { GlassBar } from "@/components/ui/glass-bar";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/routes";

type BottomNavProps = {
  onAddClick?: () => void;
  activeTab?: "home" | "stats" | "calendar" | "settings";
};

export const BottomNav = ({ onAddClick, activeTab = "home" }: BottomNavProps) => {
  return (
    <GlassBar position="bottom" as="nav">
      <div className="flex items-center px-2 py-3">
        {/* Home */}
        <Link
          href={ROUTES.HOME}
          className={cn(
            "flex flex-1 flex-col items-center gap-1 py-1 rounded-lg transition-colors",
            activeTab === "home"
              ? "text-accent-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Home className="size-5" />
          <span className="text-[10px] font-medium">Accueil</span>
        </Link>

        {/* Stats */}
        <Link
          href={ROUTES.STATS}
          className={cn(
            "flex flex-1 flex-col items-center gap-1 py-1 rounded-lg transition-colors",
            activeTab === "stats"
              ? "text-accent-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <BarChart3 className="size-5" />
          <span className="text-[10px] font-medium">Stats</span>
        </Link>

        {/* Add button - elevated */}
        <div className="flex flex-1 justify-center">
          <button
            type="button"
            onClick={onAddClick}
            className={cn(
              "flex items-center justify-center",
              "size-14 -mt-6 rounded-full",
              "bg-accent-primary text-white shadow-lg",
              "hover:bg-accent-hover active:scale-95",
              "transition-all"
            )}
          >
            <Plus className="size-7" />
          </button>
        </div>

        {/* Calendar */}
        <Link
          href={ROUTES.CALENDAR}
          className={cn(
            "flex flex-1 flex-col items-center gap-1 py-1 rounded-lg transition-colors",
            activeTab === "calendar"
              ? "text-accent-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <CalendarDays className="size-5" />
          <span className="text-[10px] font-medium">Calendrier</span>
        </Link>

        {/* Settings */}
        <Link
          href={ROUTES.SETTINGS}
          className={cn(
            "flex flex-1 flex-col items-center gap-1 py-1 rounded-lg transition-colors",
            activeTab === "settings"
              ? "text-accent-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Settings className="size-5" />
          <span className="text-[10px] font-medium">Réglages</span>
        </Link>
      </div>
    </GlassBar>
  );
};
