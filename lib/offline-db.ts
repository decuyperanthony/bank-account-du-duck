import { openDB, type DBSchema, type IDBPDatabase } from "idb";

type PrelevementRecord = {
  id: number;
  title: string;
  day: number;
  amount: number;
  category: string;
  completed: boolean;
};

type PendingAction = {
  id: string;
  type: "create" | "update" | "delete" | "toggle-all" | "reset";
  payload: unknown;
  timestamp: number;
};

type OfflineDBSchema = DBSchema & {
  prelevements: {
    key: number;
    value: PrelevementRecord;
    indexes: { "by-day": number };
  };
  pendingActions: {
    key: string;
    value: PendingAction;
    indexes: { "by-timestamp": number };
  };
  meta: {
    key: string;
    value: { key: string; value: unknown };
  };
};

const DB_NAME = "bank-account-du-duck";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<OfflineDBSchema>> | null = null;

const getDB = () => {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("IndexedDB is not available on server"));
  }

  if (!dbPromise) {
    dbPromise = openDB<OfflineDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Prelevements store
        if (!db.objectStoreNames.contains("prelevements")) {
          const prelevementsStore = db.createObjectStore("prelevements", {
            keyPath: "id",
          });
          prelevementsStore.createIndex("by-day", "day");
        }

        // Pending actions store
        if (!db.objectStoreNames.contains("pendingActions")) {
          const actionsStore = db.createObjectStore("pendingActions", {
            keyPath: "id",
          });
          actionsStore.createIndex("by-timestamp", "timestamp");
        }

        // Meta store for sync state
        if (!db.objectStoreNames.contains("meta")) {
          db.createObjectStore("meta", { keyPath: "key" });
        }
      },
    });
  }

  return dbPromise;
};

// Prelevements operations
export const getAllPrelevements = async (): Promise<PrelevementRecord[]> => {
  const db = await getDB();
  return db.getAll("prelevements");
};

export const setPrelevements = async (prelevements: PrelevementRecord[]) => {
  const db = await getDB();
  const tx = db.transaction("prelevements", "readwrite");
  await tx.objectStore("prelevements").clear();
  for (const p of prelevements) {
    await tx.objectStore("prelevements").put(p);
  }
  await tx.done;
};

export const updatePrelevement = async (prelevement: PrelevementRecord) => {
  const db = await getDB();
  await db.put("prelevements", prelevement);
};

export const deletePrelevement = async (id: number) => {
  const db = await getDB();
  await db.delete("prelevements", id);
};

// Pending actions operations
export const addPendingAction = async (action: Omit<PendingAction, "id" | "timestamp">) => {
  const db = await getDB();
  const pendingAction: PendingAction = {
    ...action,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };
  await db.add("pendingActions", pendingAction);
  return pendingAction;
};

export const getAllPendingActions = async (): Promise<PendingAction[]> => {
  const db = await getDB();
  return db.getAllFromIndex("pendingActions", "by-timestamp");
};

export const clearPendingAction = async (id: string) => {
  const db = await getDB();
  await db.delete("pendingActions", id);
};

export const clearAllPendingActions = async () => {
  const db = await getDB();
  await db.clear("pendingActions");
};

// Meta operations
export const getLastSyncTime = async (): Promise<number | null> => {
  const db = await getDB();
  const meta = await db.get("meta", "lastSync");
  return (meta?.value ?? null) as number | null;
};

export const setLastSyncTime = async (timestamp: number) => {
  const db = await getDB();
  await db.put("meta", { key: "lastSync", value: timestamp });
};
