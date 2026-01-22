"use client";

import { useEffect, useState } from "react";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

type ConnectionStatusProps = {
  className?: string;
};

export const ConnectionStatus = ({ className }: ConnectionStatusProps) => {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      // Show briefly then hide
      setIsVisible(true);
      setTimeout(() => setIsVisible(false), 2000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsVisible(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Show if offline on mount
    if (!navigator.onLine) {
      setIsVisible(true);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Check pending count from IDB
  useEffect(() => {
    const checkPending = async () => {
      try {
        const { getAllPendingActions } = await import("@/lib/offline-db");
        const actions = await getAllPendingActions();
        setPendingCount(actions.length);
        if (actions.length > 0) {
          setIsVisible(true);
        }
      } catch {
        // IndexedDB not available
      }
    };

    checkPending();
    const interval = setInterval(checkPending, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!isVisible && isOnline && pendingCount === 0) {
    return null;
  }

  const isSyncing = isOnline && pendingCount > 0;

  return (
    <div
      className={cn(
        "fixed top-[calc(env(safe-area-inset-top)+60px)] left-1/2 -translate-x-1/2 z-40",
        "px-4 py-2 rounded-full shadow-lg",
        "flex items-center gap-2 text-sm font-medium",
        "transition-all duration-300",
        !isOnline && "bg-amber-500 text-white",
        isSyncing && "bg-blue-500 text-white",
        isOnline && !isSyncing && "bg-green-500 text-white",
        className
      )}
    >
      {!isOnline && (
        <>
          <WifiOff className="size-4" />
          <span>Hors ligne</span>
        </>
      )}
      {isSyncing && (
        <>
          <RefreshCw className="size-4 animate-spin" />
          <span>Synchronisation ({pendingCount})</span>
        </>
      )}
      {isOnline && !isSyncing && (
        <>
          <Wifi className="size-4" />
          <span>En ligne</span>
        </>
      )}
    </div>
  );
};
