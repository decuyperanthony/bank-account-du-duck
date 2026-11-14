"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { GlassBar } from "@/components/ui/glass-bar";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/routes";

type HeaderProps = {
  /** Petit texte affiché sous le titre, ex: le total à venir */
  subtitle?: string;
};

export const Header = ({ subtitle }: HeaderProps = {}) => {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push(ROUTES.LOGIN);
    router.refresh();
  };

  return (
    <GlassBar position="top" as="header">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/icon-192x192.png?v=2"
            alt=""
            width={32}
            height={32}
            className="size-8 rounded-lg"
          />
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-foreground leading-tight">
              Bank Account du Duck
            </h1>
            {subtitle && (
              <p className="text-xs text-accent-primary font-medium leading-tight truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          aria-label="Logout"
        >
          <LogOut className="size-5" />
        </Button>
      </div>
    </GlassBar>
  );
};
