"use client";

import Link from "next/link";
import { Home, Plus, BarChart3, CalendarDays, Landmark } from "lucide-react";
import { GlassBar } from "@/components/ui/glass-bar";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/routes";

export type NavTab = "home" | "stats" | "credits" | "calendar" | "settings";

type BottomNavProps = {
  onAddClick?: () => void;
  activeTab?: NavTab;
};

const NavLink = ({
  href,
  active,
  icon,
  label,
}: {
  href: string;
  active: boolean;
  icon: React.ReactNode;
  label: string;
}) => (
  <Link
    href={href}
    aria-current={active ? "page" : undefined}
    className={cn(
      "flex flex-1 flex-col items-center gap-1 py-1 rounded-lg transition-colors",
      active ? "text-accent-primary" : "text-muted-foreground hover:text-foreground"
    )}
  >
    {icon}
    <span className="text-[10px] font-medium">{label}</span>
  </Link>
);

export const BottomNav = ({ onAddClick, activeTab = "home" }: BottomNavProps) => {
  return (
    <GlassBar position="bottom" as="nav">
      <div className="flex items-center px-2 py-3">
        <NavLink href={ROUTES.HOME} active={activeTab === "home"} icon={<Home className="size-5" />} label="Accueil" />
        <NavLink href={ROUTES.CREDITS} active={activeTab === "credits"} icon={<Landmark className="size-5" />} label="Crédits" />

        {/* Bouton d'ajout surélevé */}
        <div className="flex flex-1 justify-center">
          <button
            type="button"
            onClick={onAddClick}
            aria-label="Ajouter un prélèvement"
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

        <NavLink href={ROUTES.CALENDAR} active={activeTab === "calendar"} icon={<CalendarDays className="size-5" />} label="Calendrier" />
        <NavLink href={ROUTES.STATS} active={activeTab === "stats"} icon={<BarChart3 className="size-5" />} label="Stats" />
      </div>
    </GlassBar>
  );
};
