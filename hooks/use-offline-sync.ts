"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getAllPrelevements,
  setPrelevements,
  getAllPendingActions,
  clearPendingAction,
  addPendingAction,
  setLastSyncTime,
} from "@/lib/offline-db";

type PrelevementType = {
  id: number;
  title: string;
  day: number;
  amount: number;
  completed: boolean;
};

type SyncStatus = "online" | "offline" | "syncing";

export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("online");
  const [pendingCount, setPendingCount] = useState(0);

  // Monitor online status
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Update sync status based on online state
  useEffect(() => {
    if (!isOnline) {
      setSyncStatus("offline");
    } else if (pendingCount > 0) {
      setSyncStatus("syncing");
    } else {
      setSyncStatus("online");
    }
  }, [isOnline, pendingCount]);

  // Check pending actions count
  const updatePendingCount = useCallback(async () => {
    try {
      const actions = await getAllPendingActions();
      setPendingCount(actions.length);
    } catch {
      // IndexedDB not available
    }
  }, []);

  useEffect(() => {
    updatePendingCount();
  }, [updatePendingCount]);

  // Cache data from API response
  const cachePrelevements = useCallback(async (data: PrelevementType[]) => {
    try {
      await setPrelevements(data);
      await setLastSyncTime(Date.now());
    } catch {
      // IndexedDB not available
    }
  }, []);

  // Get cached data
  const getCachedPrelevements = useCallback(async (): Promise<PrelevementType[]> => {
    try {
      return await getAllPrelevements();
    } catch {
      return [];
    }
  }, []);

  // Queue action for later sync
  const queueAction = useCallback(
    async (type: "create" | "update" | "delete" | "toggle-all" | "reset", payload: unknown) => {
      try {
        await addPendingAction({ type, payload });
        await updatePendingCount();
      } catch {
        // IndexedDB not available
      }
    },
    [updatePendingCount]
  );

  // Sync pending actions when online
  const syncPendingActions = useCallback(async (): Promise<boolean> => {
    if (!isOnline) return false;

    try {
      const actions = await getAllPendingActions();
      if (actions.length === 0) return true;

      setSyncStatus("syncing");

      for (const action of actions) {
        let success = false;

        try {
          switch (action.type) {
            case "create": {
              const res = await fetch("/api/prelevements", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(action.payload),
              });
              success = res.ok;
              break;
            }
            case "update": {
              const payload = action.payload as { id: number; data: unknown };
              const res = await fetch(`/api/prelevements/${payload.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload.data),
              });
              success = res.ok;
              break;
            }
            case "delete": {
              const id = action.payload as number;
              const res = await fetch(`/api/prelevements/${id}`, {
                method: "DELETE",
              });
              success = res.ok;
              break;
            }
            case "toggle-all": {
              const res = await fetch("/api/prelevements/toggle-all", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(action.payload),
              });
              success = res.ok;
              break;
            }
            case "reset": {
              const res = await fetch("/api/prelevements/reset", {
                method: "POST",
              });
              success = res.ok;
              break;
            }
          }
        } catch {
          success = false;
        }

        if (success) {
          await clearPendingAction(action.id);
        }
      }

      await updatePendingCount();
      setSyncStatus("online");
      return true;
    } catch {
      setSyncStatus(isOnline ? "online" : "offline");
      return false;
    }
  }, [isOnline, updatePendingCount]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      syncPendingActions();
    }
  }, [isOnline, pendingCount, syncPendingActions]);

  return {
    isOnline,
    syncStatus,
    pendingCount,
    cachePrelevements,
    getCachedPrelevements,
    queueAction,
    syncPendingActions,
  };
};
