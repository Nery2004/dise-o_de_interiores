import { openDB, type DBSchema } from "idb";
import type { CustomInteriorColor } from "@/types/color";

interface ColorPreferencesDatabase extends DBSchema {
  favorites: { key: string; value: { colorId: string; createdAt: string } };
  customColors: { key: string; value: CustomInteriorColor };
  recentColors: { key: string; value: { hex: string; usedAt: string } };
  pending: { key: string; value: { key: string; hex: string; applyToSelection: boolean } };
}

const database = typeof indexedDB === "undefined" ? null : openDB<ColorPreferencesDatabase>("interior-color-preferences", 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains("favorites")) db.createObjectStore("favorites", { keyPath: "colorId" });
    if (!db.objectStoreNames.contains("customColors")) db.createObjectStore("customColors", { keyPath: "id" });
    if (!db.objectStoreNames.contains("recentColors")) db.createObjectStore("recentColors", { keyPath: "hex" });
    if (!db.objectStoreNames.contains("pending")) db.createObjectStore("pending", { keyPath: "key" });
  },
});

function getDatabase() { if (!database) throw new Error("IndexedDB unavailable"); return database; }

export interface ColorFavoritesRepository {
  getFavorites(): Promise<string[]>;
  addFavorite(colorId: string): Promise<void>;
  removeFavorite(colorId: string): Promise<void>;
  toggleFavorite(colorId: string): Promise<boolean>;
}

export class IndexedDbColorFavoritesRepository implements ColorFavoritesRepository {
  async getFavorites() { return (await (await getDatabase()).getAll("favorites")).map((item) => item.colorId); }
  async addFavorite(colorId: string) { await (await getDatabase()).put("favorites", { colorId, createdAt: new Date().toISOString() }); }
  async removeFavorite(colorId: string) { await (await getDatabase()).delete("favorites", colorId); }
  async toggleFavorite(colorId: string) {
    const db = await getDatabase();
    const exists = await db.get("favorites", colorId);
    if (exists) await db.delete("favorites", colorId); else await db.put("favorites", { colorId, createdAt: new Date().toISOString() });
    return !exists;
  }
}

export const colorFavoritesRepository = new IndexedDbColorFavoritesRepository();
export const getFavorites = () => colorFavoritesRepository.getFavorites();
export const addFavorite = (id: string) => colorFavoritesRepository.addFavorite(id);
export const removeFavorite = (id: string) => colorFavoritesRepository.removeFavorite(id);
export const toggleFavorite = (id: string) => colorFavoritesRepository.toggleFavorite(id);

export async function saveCustomColor(color: CustomInteriorColor) { await (await getDatabase()).put("customColors", color); }
export async function getCustomColors() { return (await getDatabase()).getAll("customColors"); }
export async function addRecentColor(hex: string) {
  const db = await getDatabase();
  await db.put("recentColors", { hex, usedAt: new Date().toISOString() });
  const items = (await db.getAll("recentColors")).sort((a, b) => b.usedAt.localeCompare(a.usedAt));
  await Promise.all(items.slice(12).map((item) => db.delete("recentColors", item.hex)));
}
export async function getRecentColors() { return (await (await getDatabase()).getAll("recentColors")).sort((a, b) => b.usedAt.localeCompare(a.usedAt)).map((item) => item.hex); }
export async function setPendingEditorColor(hex: string, applyToSelection = false) { await (await getDatabase()).put("pending", { key: "editor-color", hex, applyToSelection }); }
export async function consumePendingEditorColor() { const db = await getDatabase(); const value = await db.get("pending", "editor-color"); if (value) await db.delete("pending", "editor-color"); return value; }
