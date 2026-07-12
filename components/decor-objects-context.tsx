"use client";

import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { decorObjectsById } from "@/data/decorObjects";
import { decorObjectFavoritesRepository, decorObjectOrganizationRepository, decorObjectRecentRepository, pendingDecorObjectRepository } from "@/lib/decor/decorObjectPreferences";
import { isSelectableDecorObject, type DecorObject, type DecorObjectFolder } from "@/types/decor-object";

type DecorObjectsContextValue = {
  selectedDecorObject: DecorObject | null;
  pendingDecorObject: DecorObject | null;
  favorites: string[];
  recentObjects: DecorObject[];
  mostUsedObjects: DecorObject[];
  folders: DecorObjectFolder[];
  hydrated: boolean;
  setSelectedDecorObject: (object: DecorObject | null) => void;
  setPendingDecorObject: (object: DecorObject) => Promise<boolean>;
  clearPendingDecorObject: () => Promise<void>;
  toggleFavorite: (id: string) => Promise<boolean>;
  createFolder: (name: string) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  toggleObjectInFolder: (folderId: string, objectId: string) => Promise<void>;
  replaceFolders: (folders: DecorObjectFolder[]) => void;
  replaceFavorites: (ids: string[]) => Promise<void>;
};

const DecorObjectsContext = createContext<DecorObjectsContextValue | null>(null);

function resolveObjects(ids: string[]) {
  return ids.flatMap((id) => {
    const object = decorObjectsById.get(id);
    return object ? [object] : [];
  });
}

export function DecorObjectsProvider({ children }: { children: ReactNode }) {
  const [selectedDecorObject, setSelectedDecorObject] = useState<DecorObject | null>(null);
  const [pendingDecorObject, setPendingState] = useState<DecorObject | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recentObjects, setRecentObjects] = useState<DecorObject[]>([]);
  const [mostUsedObjects, setMostUsedObjects] = useState<DecorObject[]>([]);
  const [folders, setFolders] = useState<DecorObjectFolder[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    void Promise.all([
      decorObjectFavoritesRepository.getFavorites(),
      decorObjectRecentRepository.getRecentObjects(),
      pendingDecorObjectRepository.getPendingObject(),
      decorObjectOrganizationRepository.getMostUsed(),
      decorObjectOrganizationRepository.getFolders(),
    ]).then(([favoriteIds, recentIds, pendingId, mostUsedIds, storedFolders]) => {
      if (!active) return;
      setFavorites(favoriteIds.filter((id) => decorObjectsById.has(id)));
      setRecentObjects(resolveObjects(recentIds));
      setPendingState(pendingId ? decorObjectsById.get(pendingId) ?? null : null);
      setMostUsedObjects(resolveObjects(mostUsedIds));
      setFolders(storedFolders);
    }).catch(() => {
      if (active) setPendingState(null);
    }).finally(() => {
      if (active) setHydrated(true);
    });
    return () => { active = false; };
  }, []);

  const setPendingDecorObject = useCallback(async (object: DecorObject) => {
    if (!isSelectableDecorObject(object)) return false;
    await Promise.all([
      pendingDecorObjectRepository.setPendingObject(object.id),
      decorObjectRecentRepository.addRecentObject(object.id),
    ]);
    setPendingState(object);
    setRecentObjects((current) => [object, ...current.filter((item) => item.id !== object.id)].slice(0, 12));
    setMostUsedObjects(resolveObjects(await decorObjectOrganizationRepository.getMostUsed()));
    return true;
  }, []);

  const clearPendingDecorObject = useCallback(async () => {
    setPendingState(null);
    await pendingDecorObjectRepository.clearPendingObject();
  }, []);

  const toggleFavorite = useCallback(async (id: string) => {
    const enabled = await decorObjectFavoritesRepository.toggleFavorite(id);
    setFavorites((current) => enabled ? [id, ...current.filter((item) => item !== id)] : current.filter((item) => item !== id));
    return enabled;
  }, []);

  const value = useMemo<DecorObjectsContextValue>(() => ({
    selectedDecorObject,
    pendingDecorObject,
    favorites,
    recentObjects,
    mostUsedObjects,
    folders,
    hydrated,
    setSelectedDecorObject,
    setPendingDecorObject,
    clearPendingDecorObject,
    toggleFavorite,
    createFolder: async (name) => {
      const now = new Date().toISOString();
      const folder = { id: crypto.randomUUID(), name: name.trim().slice(0, 60) || "Nueva carpeta", objectIds: [], createdAt: now, updatedAt: now };
      await decorObjectOrganizationRepository.saveFolder(folder);
      setFolders((items) => [folder, ...items]);
    },
    deleteFolder: async (id) => { await decorObjectOrganizationRepository.deleteFolder(id); setFolders((items) => items.filter((item) => item.id !== id)); },
    toggleObjectInFolder: async (folderId, objectId) => {
      const folder = folders.find((item) => item.id === folderId);
      if (!folder) return;
      const next = { ...folder, objectIds: folder.objectIds.includes(objectId) ? folder.objectIds.filter((id) => id !== objectId) : [...folder.objectIds, objectId], updatedAt: new Date().toISOString() };
      await decorObjectOrganizationRepository.saveFolder(next);
      setFolders((items) => items.map((item) => item.id === folderId ? next : item));
    },
    replaceFolders: setFolders,
    replaceFavorites: async (ids) => {
      const valid = [...new Set(ids)].filter((id) => decorObjectsById.has(id));
      await decorObjectFavoritesRepository.replaceFavorites(valid);
      setFavorites(valid);
    },
  }), [clearPendingDecorObject, favorites, folders, hydrated, mostUsedObjects, pendingDecorObject, recentObjects, selectedDecorObject, setPendingDecorObject, toggleFavorite]);

  return <DecorObjectsContext.Provider value={value}>{children}</DecorObjectsContext.Provider>;
}

export function useDecorObjects() {
  const context = useContext(DecorObjectsContext);
  if (!context) throw new Error("useDecorObjects debe usarse dentro de DecorObjectsProvider.");
  return context;
}
