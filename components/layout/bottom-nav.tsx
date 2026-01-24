"use client";

import { Home, Plus, Settings } from "lucide-react";
import { GlassBar } from "@/components/ui/glass-bar";
import { cn } from "@/lib/utils";

type BottomNavProps = {
  onAddClick?: () => void;
  activeTab?: "home" | "settings";
};

export const BottomNav = ({ onAddClick, activeTab = "home" }: BottomNavProps) => {
  return (
    <GlassBar position="bottom" as="nav">
      <div className="flex items-center justify-around px-4 py-2">
        {/* Home */}
        <button
          type="button"
          className={cn(
            "flex flex-col items-center gap-1 px-6 py-2 rounded-lg transition-colors",
            activeTab === "home"
              ? "text-accent-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Home className="size-6" />
          <span className="text-xs font-medium">Accueil</span>
        </button>

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
        <button
          type="button"
          className={cn(
            "flex flex-col items-center gap-1 px-6 py-2 rounded-lg transition-colors",
            activeTab === "settings"
              ? "text-accent-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Settings className="size-6" />
          <span className="text-xs font-medium">Params</span>
        </button>
      </div>
    </GlassBar>
  );
};
