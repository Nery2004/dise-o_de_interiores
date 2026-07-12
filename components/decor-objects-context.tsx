"use client";

import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { decorObjectsById } from "@/data/decorObjects";
import { decorObjectFavoritesRepository, decorObjectRecentRepository, pendingDecorObjectRepository } from "@/lib/decor/decorObjectPreferences";
import { isSelectableDecorObject, type DecorObject } from "@/types/decor-object";

type DecorObjectsContextValue = {
  selectedDecorObject: DecorObject | null;
  pendingDecorObject: DecorObject | null;
  favorites: string[];
  recentObjects: DecorObject[];
  hydrated: boolean;
  setSelectedDecorObject: (object: DecorObject | null) => void;
  setPendingDecorObject: (object: DecorObject) => Promise<boolean>;
  clearPendingDecorObject: () => Promise<void>;
  toggleFavorite: (id: string) => Promise<boolean>;
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
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    void Promise.all([
      decorObjectFavoritesRepository.getFavorites(),
      decorObjectRecentRepository.getRecentObjects(),
      pendingDecorObjectRepository.getPendingObject(),
    ]).then(([favoriteIds, recentIds, pendingId]) => {
      if (!active) return;
      setFavorites(favoriteIds.filter((id) => decorObjectsById.has(id)));
      setRecentObjects(resolveObjects(recentIds));
      setPendingState(pendingId ? decorObjectsById.get(pendingId) ?? null : null);
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
    return true;
  }, []);

  const clearPendingDecorObject = useCallback(async () => {
    await pendingDecorObjectRepository.clearPendingObject();
    setPendingState(null);
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
    hydrated,
    setSelectedDecorObject,
    setPendingDecorObject,
    clearPendingDecorObject,
    toggleFavorite,
  }), [clearPendingDecorObject, favorites, hydrated, pendingDecorObject, recentObjects, selectedDecorObject, setPendingDecorObject, toggleFavorite]);

  return <DecorObjectsContext.Provider value={value}>{children}</DecorObjectsContext.Provider>;
}

export function useDecorObjects() {
  const context = useContext(DecorObjectsContext);
  if (!context) throw new Error("useDecorObjects debe usarse dentro de DecorObjectsProvider.");
  return context;
}
