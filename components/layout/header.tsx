"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { GlassBar } from "@/components/ui/glass-bar";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export const Header = () => {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <GlassBar position="top" as="header">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <svg
            width="32"
            height="32"
            viewBox="0 0 512 512"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="shrink-0"
          >
            <defs>
              <linearGradient
                id="headerGrad"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#2dd4bf" />
                <stop offset="100%" stopColor="#14b8a6" />
              </linearGradient>
            </defs>
            <rect width="512" height="512" rx="96" fill="url(#headerGrad)" />
            <g transform="translate(56, 80)">
              <ellipse cx="200" cy="280" rx="160" ry="100" fill="white" />
              <circle cx="320" cy="180" r="80" fill="white" />
              <path d="M380 180 L440 165 L440 195 L380 180 Z" fill="#fbbf24" />
              <circle cx="350" cy="165" r="12" fill="#0f172a" />
              <path
                d="M80 260 Q140 200 200 260 Q140 240 80 260 Z"
                fill="#e2e8f0"
              />
              <rect
                x="160"
                y="250"
                width="80"
                height="8"
                rx="4"
                fill="#0f172a"
                opacity="0.3"
              />
            </g>
          </svg>
          <h1 className="text-lg font-semibold text-foreground">
            Bank Account du Duck
          </h1>
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
