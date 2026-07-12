import { openDB, type DBSchema } from "idb";

interface DecorObjectPreferencesDatabase extends DBSchema {
  favorites: { key: string; value: { objectId: string; createdAt: string } };
  recentObjects: { key: string; value: { objectId: string; selectedAt: string } };
  pending: { key: string; value: { key: "pending-object"; objectId: string; selectedAt: string } };
  usage: { key: string; value: { objectId: string; count: number; lastUsedAt: string } };
  folders: { key: string; value: import("@/types/decor-object").DecorObjectFolder };
}

const database = typeof indexedDB === "undefined" ? null : openDB<DecorObjectPreferencesDatabase>("interior-decor-object-preferences", 2, {
  upgrade(db) {
    if (!db.objectStoreNames.contains("favorites")) db.createObjectStore("favorites", { keyPath: "objectId" });
    if (!db.objectStoreNames.contains("recentObjects")) db.createObjectStore("recentObjects", { keyPath: "objectId" });
    if (!db.objectStoreNames.contains("pending")) db.createObjectStore("pending", { keyPath: "key" });
    if (!db.objectStoreNames.contains("usage")) db.createObjectStore("usage", { keyPath: "objectId" });
    if (!db.objectStoreNames.contains("folders")) db.createObjectStore("folders", { keyPath: "id" });
  },
});

function getDatabase() {
  if (!database) throw new Error("IndexedDB no está disponible en este navegador.");
  return database;
}

export interface DecorObjectFavoritesRepository {
  getFavorites(): Promise<string[]>;
  addFavorite(id: string): Promise<void>;
  removeFavorite(id: string): Promise<void>;
  toggleFavorite(id: string): Promise<boolean>;
  replaceFavorites(ids: string[]): Promise<void>;
}

export class IndexedDbDecorObjectFavoritesRepository implements DecorObjectFavoritesRepository {
  async getFavorites() {
    return (await (await getDatabase()).getAll("favorites"))
      .sort((first, second) => second.createdAt.localeCompare(first.createdAt))
      .map((item) => item.objectId);
  }

  async addFavorite(id: string) {
    await (await getDatabase()).put("favorites", { objectId: id, createdAt: new Date().toISOString() });
  }

  async removeFavorite(id: string) {
    await (await getDatabase()).delete("favorites", id);
  }

  async toggleFavorite(id: string) {
    const db = await getDatabase();
    const existing = await db.get("favorites", id);
    if (existing) await db.delete("favorites", id);
    else await db.put("favorites", { objectId: id, createdAt: new Date().toISOString() });
    return !existing;
  }
  async replaceFavorites(ids: string[]) {
    const db = await getDatabase();
    const transaction = db.transaction("favorites", "readwrite");
    await transaction.store.clear();
    const now = new Date().toISOString();
    await Promise.all(ids.map((objectId) => transaction.store.put({ objectId, createdAt: now })));
    await transaction.done;
  }
}

export class DecorObjectRecentRepository {
  async getRecentObjects() {
    return (await (await getDatabase()).getAll("recentObjects"))
      .sort((first, second) => second.selectedAt.localeCompare(first.selectedAt))
      .slice(0, 12)
      .map((item) => item.objectId);
  }

  async addRecentObject(id: string) {
    const db = await getDatabase();
    await db.put("recentObjects", { objectId: id, selectedAt: new Date().toISOString() });
    const items = (await db.getAll("recentObjects")).sort((first, second) => second.selectedAt.localeCompare(first.selectedAt));
    await Promise.all(items.slice(12).map((item) => db.delete("recentObjects", item.objectId)));
    const usage = await db.get("usage", id);
    await db.put("usage", { objectId: id, count: (usage?.count ?? 0) + 1, lastUsedAt: new Date().toISOString() });
  }
}

export class DecorObjectOrganizationRepository {
  async getMostUsed() {
    return (await (await getDatabase()).getAll("usage")).sort((a, b) => b.count - a.count || b.lastUsedAt.localeCompare(a.lastUsedAt)).slice(0, 12).map((item) => item.objectId);
  }
  async getFolders() {
    return (await (await getDatabase()).getAll("folders")).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
  async saveFolder(folder: import("@/types/decor-object").DecorObjectFolder) {
    await (await getDatabase()).put("folders", folder);
  }
  async deleteFolder(id: string) {
    await (await getDatabase()).delete("folders", id);
  }
}

export class PendingDecorObjectRepository {
  async getPendingObject() {
    return (await (await getDatabase()).get("pending", "pending-object"))?.objectId ?? null;
  }

  async setPendingObject(id: string) {
    await (await getDatabase()).put("pending", { key: "pending-object", objectId: id, selectedAt: new Date().toISOString() });
  }

  async clearPendingObject() {
    await (await getDatabase()).delete("pending", "pending-object");
  }
}

export const decorObjectFavoritesRepository = new IndexedDbDecorObjectFavoritesRepository();
export const decorObjectRecentRepository = new DecorObjectRecentRepository();
export const pendingDecorObjectRepository = new PendingDecorObjectRepository();
export const decorObjectOrganizationRepository = new DecorObjectOrganizationRepository();
