"use client";

import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useDecorPlacement } from "@/components/decor-placement-context";
import { useEditor } from "@/components/editor-context";
import { createDefaultRoomLightProfile, sanitizeRoomLightProfile } from "@/lib/lighting/lightProfile";
import { loadRoomImageData } from "@/lib/lighting/loadRoomImageData";
import { sampleRoomLightingAroundObject } from "@/lib/lighting/localLightSampler";
import { getAutomaticObjectLighting } from "@/lib/lighting/objectLightMatcher";
import { analyzeRoomLighting } from "@/lib/lighting/roomLightAnalyzer";
import type { RoomLightProfile } from "@/types/lighting";
import type { PlacedDecorObject } from "@/types/placed-decor-object";
import { disposeLightingWorker } from "@/lib/lighting/lightingWorkerClient";

type PreparedLighting = { profiles: RoomLightProfile[]; activeId?: string };
type RoomLightingContextValue = {
  profiles: RoomLightProfile[];
  activeProfile: RoomLightProfile | undefined;
  activeProfileId?: string;
  analyzing: boolean;
  guideVisible: boolean;
  canUndo: boolean;
  canRedo: boolean;
  setGuideVisible: (visible: boolean) => void;
  setActiveProfileId: (id?: string) => void;
  updateProfile: (id: string, changes: Partial<RoomLightProfile>) => void;
  analyzeLighting: () => Promise<void>;
  adaptObject: (object: PlacedDecorObject) => Promise<void>;
  applyToAllObjects: () => Promise<void>;
  duplicateProfile: () => void;
  resetActiveProfile: () => void;
  prepareProjectRestore: (profiles?: RoomLightProfile[], activeId?: string) => void;
  replaceLighting: (profiles?: RoomLightProfile[], activeId?: string) => void;
  resetLighting: () => void;
  undo: () => void;
  redo: () => void;
};

const RoomLightingContext = createContext<RoomLightingContextValue | null>(null);

function cloneProfiles(profiles: RoomLightProfile[]) {
  return profiles.map((profile) => ({ ...profile, direction: { ...profile.direction } }));
}

export function RoomLightingProvider({ children }: { children: ReactNode }) {
  const editor = useEditor();
  const placement = useDecorPlacement();
  const [profiles, setProfiles] = useState<RoomLightProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string>();
  const [analyzing, setAnalyzing] = useState(false);
  const [guideVisible, setGuideVisible] = useState(false);
  const [past, setPast] = useState<PreparedLighting[]>([]);
  const [future, setFuture] = useState<PreparedLighting[]>([]);
  const preparedRef = useRef<PreparedLighting | null>(null);
  const previousImageRef = useRef<string | null | undefined>(undefined);
  const profilesRef = useRef(profiles);
  const activeIdRef = useRef(activeProfileId);
  const profileTransactionRef = useRef<PreparedLighting | null>(null);
  const profileTimerRef = useRef<number | null>(null);

  useEffect(() => {
    profilesRef.current = profiles;
  }, [profiles]);
  useEffect(() => {
    activeIdRef.current = activeProfileId;
  }, [activeProfileId]);
  useEffect(() => () => {
    if (profileTimerRef.current) window.clearTimeout(profileTimerRef.current);
    disposeLightingWorker();
  }, []);

  useEffect(() => {
    const imageKey = editor.image?.url ?? null;
    if (previousImageRef.current === undefined) {
      previousImageRef.current = imageKey;
      return;
    }
    if (previousImageRef.current === imageKey) return;
    previousImageRef.current = imageKey;
    const prepared = preparedRef.current;
    preparedRef.current = null;
    setProfiles(cloneProfiles(prepared?.profiles ?? []));
    setActiveProfileId(prepared?.activeId);
    setGuideVisible(false);
    setPast([]);
    setFuture([]);
  }, [editor.image?.url]);

  const applyProfile = useCallback(async (profile: RoomLightProfile, objects: PlacedDecorObject[]) => {
    if (!editor.image) return;
    const imageData = await loadRoomImageData(editor.image);
    placement.beginHistoryTransaction();
    for (const object of objects) {
      if (object.lightingMode !== "auto" || object.lightingLocked) continue;
      const sample = sampleRoomLightingAroundObject(imageData, object);
      placement.updatePlacedObject(object.id, getAutomaticObjectLighting(object, sample, profile), false);
    }
    placement.commitHistoryTransaction();
  }, [editor.image, placement]);

  const analyzeLighting = useCallback(async () => {
    if (!editor.image || analyzing) return;
    setAnalyzing(true);
    try {
      const imageData = await loadRoomImageData(editor.image);
      const current = profilesRef.current.find((profile) => profile.id === activeProfileId);
      const analyzed = analyzeRoomLighting(imageData, current);
      setPast((items) => [...items.slice(-29), { profiles: cloneProfiles(profilesRef.current), activeId: activeProfileId }]);
      setFuture([]);
      setProfiles((items) => current ? items.map((item) => item.id === current.id ? analyzed : item) : [...items, analyzed]);
      setActiveProfileId(analyzed.id);
      await applyProfile(analyzed, placement.placedObjects);
      toast.success("Iluminación analizada. Puedes ajustar el resultado.");
    } catch {
      toast.error("No se pudo analizar la iluminación de la habitación.");
    } finally {
      setAnalyzing(false);
    }
  }, [activeProfileId, analyzing, applyProfile, editor.image, placement.placedObjects]);

  const updateProfile = useCallback((id: string, changes: Partial<RoomLightProfile>) => {
    profileTransactionRef.current ??= { profiles: cloneProfiles(profilesRef.current), activeId: activeIdRef.current };
    const current = profilesRef.current.find((profile) => profile.id === id);
    if (!current) return;
    const updated = sanitizeRoomLightProfile({ ...current, ...changes, id, mode: "manual", updatedAt: new Date().toISOString() });
    const next = profilesRef.current.map((profile) => profile.id === id ? updated : profile);
    profilesRef.current = next;
    setProfiles(next);
    if (profileTimerRef.current) window.clearTimeout(profileTimerRef.current);
    profileTimerRef.current = window.setTimeout(() => {
      const snapshot = profileTransactionRef.current;
      profileTransactionRef.current = null;
      if (snapshot) setPast((items) => [...items.slice(-29), snapshot]);
      setFuture([]);
      profileTimerRef.current = null;
      void applyProfile(updated, placement.placedObjects);
    }, 450);
  }, [applyProfile, placement.placedObjects]);

  const value = useMemo<RoomLightingContextValue>(() => ({
    profiles,
    activeProfile: profiles.find((profile) => profile.id === activeProfileId),
    activeProfileId,
    analyzing,
    guideVisible,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    setGuideVisible,
    setActiveProfileId,
    updateProfile,
    analyzeLighting,
    adaptObject: async (object) => {
      if (!editor.image) return;
      try {
        const imageData = await loadRoomImageData(editor.image);
        const profile = profiles.find((item) => item.id === activeProfileId);
        const sample = sampleRoomLightingAroundObject(imageData, object);
        placement.updatePlacedObject(object.id, getAutomaticObjectLighting(object, sample, profile));
      } catch {
        toast.error("No se pudo adaptar el objeto a esta zona.");
      }
    },
    applyToAllObjects: async () => {
      const profile = profiles.find((item) => item.id === activeProfileId);
      if (!profile) return;
      try {
        await applyProfile(profile, placement.placedObjects);
        toast.success("Iluminación aplicada a los objetos en modo Auto.");
      } catch {
        toast.error("No se pudo aplicar la iluminación.");
      }
    },
    duplicateProfile: () => {
      const profile = profiles.find((item) => item.id === activeProfileId);
      if (!profile) return;
      const now = new Date().toISOString();
      const duplicate = { ...profile, direction: { ...profile.direction }, id: crypto.randomUUID(), name: `${profile.name} copia`, mode: "manual" as const, createdAt: now, updatedAt: now };
      setPast((items) => [...items.slice(-29), { profiles: cloneProfiles(profiles), activeId: activeProfileId }]);
      setFuture([]);
      setProfiles((items) => [...items, duplicate]);
      setActiveProfileId(duplicate.id);
    },
    resetActiveProfile: () => {
      const fresh = createDefaultRoomLightProfile();
      const id = activeProfileId ?? fresh.id;
      const replacement = { ...fresh, id };
      setPast((items) => [...items.slice(-29), { profiles: cloneProfiles(profiles), activeId: activeProfileId }]);
      setFuture([]);
      setProfiles((items) => items.some((item) => item.id === id) ? items.map((item) => item.id === id ? replacement : item) : [...items, replacement]);
      setActiveProfileId(id);
    },
    prepareProjectRestore: (items = [], activeId) => { preparedRef.current = { profiles: cloneProfiles(items), activeId }; },
    replaceLighting: (items = [], activeId) => {
      setProfiles(cloneProfiles(items));
      setActiveProfileId(activeId);
      setPast([]);
      setFuture([]);
    },
    resetLighting: () => {
      preparedRef.current = null;
      setProfiles([]);
      setActiveProfileId(undefined);
      setGuideVisible(false);
      setPast([]);
      setFuture([]);
    },
    undo: () => {
      const previous = past.at(-1);
      if (!previous) return;
      setFuture((items) => [{ profiles: cloneProfiles(profiles), activeId: activeProfileId }, ...items].slice(0, 30));
      setPast((items) => items.slice(0, -1));
      setProfiles(cloneProfiles(previous.profiles));
      setActiveProfileId(previous.activeId);
      const profile = previous.profiles.find((item) => item.id === previous.activeId);
      if (profile) void applyProfile(profile, placement.placedObjects);
    },
    redo: () => {
      const next = future[0];
      if (!next) return;
      setPast((items) => [...items.slice(-29), { profiles: cloneProfiles(profiles), activeId: activeProfileId }]);
      setFuture((items) => items.slice(1));
      setProfiles(cloneProfiles(next.profiles));
      setActiveProfileId(next.activeId);
      const profile = next.profiles.find((item) => item.id === next.activeId);
      if (profile) void applyProfile(profile, placement.placedObjects);
    },
  }), [activeProfileId, analyzeLighting, analyzing, applyProfile, editor.image, future, guideVisible, past, placement, profiles, updateProfile]);

  return <RoomLightingContext.Provider value={value}>{children}</RoomLightingContext.Provider>;
}

export function useRoomLighting() {
  const context = useContext(RoomLightingContext);
  if (!context) throw new Error("useRoomLighting debe usarse dentro de RoomLightingProvider.");
  return context;
}
