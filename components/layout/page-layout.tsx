"use client";

import { type ReactNode } from "react";
import { Header } from "./header";
import { BottomNav } from "./bottom-nav";
import { ConnectionStatus } from "@/components/ui/connection-status";
import { cn } from "@/lib/utils";

type PageLayoutProps = {
  children: ReactNode;
  onAddClick?: () => void;
  activeTab?: "home" | "stats" | "calendar" | "settings";
  showConnectionStatus?: boolean;
  className?: string;
  /** Petit texte affiché sous le titre du header, ex: le total à venir */
  headerSubtitle?: string;
};

export const PageLayout = ({
  children,
  onAddClick,
  activeTab = "home",
  showConnectionStatus = true,
  className,
  headerSubtitle,
}: PageLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <Header subtitle={headerSubtitle} />

      {showConnectionStatus && <ConnectionStatus />}

      <main
        className={cn(
          "pt-header pb-nav-safe",
          "px-4",
          className
        )}
      >
        {children}
      </main>

      <BottomNav onAddClick={onAddClick} activeTab={activeTab} />
    </div>
  );
};
