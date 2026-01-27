"use client";

import Link from "next/link";
import { Home, Plus, Settings, BarChart3 } from "lucide-react";
import { GlassBar } from "@/components/ui/glass-bar";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/routes";

type BottomNavProps = {
  onAddClick?: () => void;
  activeTab?: "home" | "stats" | "settings";
};

export const BottomNav = ({ onAddClick, activeTab = "home" }: BottomNavProps) => {
  return (
    <GlassBar position="bottom" as="nav">
      <div className="flex items-center justify-around px-4 py-2">
        {/* Home */}
        <Link
          href={ROUTES.HOME}
          className={cn(
            "flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors",
            activeTab === "home"
              ? "text-accent-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Home className="size-6" />
          <span className="text-xs font-medium">Accueil</span>
        </Link>

        {/* Stats */}
        <Link
          href={ROUTES.STATS}
          className={cn(
            "flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors",
            activeTab === "stats"
              ? "text-accent-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <BarChart3 className="size-6" />
          <span className="text-xs font-medium">Stats</span>
        </Link>

        {/* Add button - elevated */}
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

        {/* Settings */}
        <Link
          href={ROUTES.SETTINGS}
          className={cn(
            "flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors",
            activeTab === "settings"
              ? "text-accent-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Settings className="size-6" />
          <span className="text-xs font-medium">Réglages</span>
        </Link>
      </div>
    </GlassBar>
  );
};
