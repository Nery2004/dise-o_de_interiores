"use client";

import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useDecorObjects } from "@/components/use-decor-objects";
import { useEditor } from "@/components/editor-context";
import { clampObjectToImage, getInitialObjectSize, normalizeObjectZIndexes } from "@/lib/decor/objectPlacementGeometry";
import type { DecorObject } from "@/types/decor-object";
import type { ImagePoint } from "@/types/editor";
import type { ObjectInteractionMode, PlacedDecorObject } from "@/types/placed-decor-object";

type PlacementSnapshot = PlacedDecorObject[];

type DecorPlacementContextValue = {
  placedObjects: PlacedDecorObject[];
  selectedObjectId: string | null;
  pendingDecorObject: DecorObject | null;
  isPlacingObject: boolean;
  objectInteractionMode: ObjectInteractionMode;
  canUndo: boolean;
  canRedo: boolean;
  addPlacedObject: (object: DecorObject, point: ImagePoint) => PlacedDecorObject | null;
  updatePlacedObject: (id: string, changes: Partial<PlacedDecorObject>, recordHistory?: boolean) => void;
  deletePlacedObject: (id: string) => void;
  duplicatePlacedObject: (id: string) => void;
  selectPlacedObject: (id: string | null) => void;
  clearObjectSelection: () => void;
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  toggleObjectVisibility: (id: string) => void;
  toggleObjectLock: (id: string) => void;
  flipObjectHorizontal: (id: string) => void;
  flipObjectVertical: (id: string) => void;
  cancelPendingObject: () => void;
  setObjectInteractionMode: (mode: ObjectInteractionMode) => void;
  replacePlacedObjects: (objects: PlacedDecorObject[]) => void;
  prepareProjectRestore: (objects: PlacedDecorObject[]) => void;
  resetPlacedObjects: () => void;
  undo: () => void;
  redo: () => void;
  beginHistoryTransaction: () => void;
  commitHistoryTransaction: () => void;
};

const DecorPlacementContext = createContext<DecorPlacementContextValue | null>(null);

function cloneSnapshot(objects: PlacedDecorObject[]): PlacementSnapshot {
  return objects.map((object) => ({ ...object }));
}

function selectedId(objects: PlacedDecorObject[]) {
  return objects.find((object) => object.selected)?.id ?? null;
}

export function DecorPlacementProvider({ children }: { children: ReactNode }) {
  const editor = useEditor();
  const decor = useDecorObjects();
  const [placedObjects, setPlacedState] = useState<PlacedDecorObject[]>([]);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [objectInteractionMode, setObjectInteractionMode] = useState<ObjectInteractionMode>("idle");
  const [past, setPast] = useState<PlacementSnapshot[]>([]);
  const [future, setFuture] = useState<PlacementSnapshot[]>([]);
  const objectsRef = useRef(placedObjects);
  const preparedRestoreRef = useRef<PlacedDecorObject[] | null>(null);
  const previousImageRef = useRef<string | null | undefined>(undefined);
  const transactionRef = useRef<PlacementSnapshot | null>(null);

  const setObjects = useCallback((objects: PlacedDecorObject[]) => {
    objectsRef.current = objects;
    setPlacedState(objects);
    setSelectedObjectId(selectedId(objects));
  }, []);

  const commit = useCallback((operation: (current: PlacedDecorObject[]) => PlacedDecorObject[]) => {
    const current = objectsRef.current;
    const next = operation(cloneSnapshot(current));
    if (JSON.stringify(current) === JSON.stringify(next)) return;
    setPast((history) => [...history.slice(-49), cloneSnapshot(current)]);
    setFuture([]);
    setObjects(next);
  }, [setObjects]);

  useEffect(() => {
    const imageKey = editor.image?.url ?? null;
    if (previousImageRef.current === undefined) { previousImageRef.current = imageKey; return; }
    if (previousImageRef.current === imageKey) return;
    previousImageRef.current = imageKey;
    const restored = preparedRestoreRef.current;
    preparedRestoreRef.current = null;
    setObjects(restored ? normalizeObjectZIndexes(cloneSnapshot(restored)) : []);
    setPast([]); setFuture([]); setObjectInteractionMode("idle");
  }, [editor.image?.url, setObjects]);

  useEffect(() => {
    if (!decor.pendingDecorObject || editor.activeTool === "objects") return;
    const timer = window.setTimeout(() => editor.setActiveTool("objects"), 0);
    return () => window.clearTimeout(timer);
  }, [decor.pendingDecorObject, editor]);

  const selectPlacedObject = useCallback((id: string | null) => {
    const next = objectsRef.current.map((object) => ({ ...object, selected: object.id === id }));
    setObjects(next);
  }, [setObjects]);

  const updatePlacedObject = useCallback((id: string, changes: Partial<PlacedDecorObject>, recordHistory = true) => {
    const update = (current: PlacedDecorObject[]) => current.map((object) => object.id === id ? {
      ...object,
      ...changes,
      id,
      updatedAt: new Date().toISOString(),
      scaleX: changes.width !== undefined ? changes.width / object.originalWidth : changes.scaleX ?? object.scaleX,
      scaleY: changes.height !== undefined ? changes.height / object.originalHeight : changes.scaleY ?? object.scaleY,
    } : object);
    if (recordHistory) commit(update);
    else setObjects(update(cloneSnapshot(objectsRef.current)));
  }, [commit, setObjects]);

  const orderOperation = useCallback((id: string, direction: "forward" | "backward" | "front" | "back") => {
    commit((current) => {
      const ordered = normalizeObjectZIndexes(current);
      const index = ordered.findIndex((object) => object.id === id);
      if (index < 0) return current;
      if (direction === "front") ordered.push(ordered.splice(index, 1)[0]);
      else if (direction === "back") ordered.unshift(ordered.splice(index, 1)[0]);
      else {
        const target = direction === "forward" ? index + 1 : index - 1;
        if (target < 0 || target >= ordered.length) return current;
        [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
      }
      return normalizeObjectZIndexes(ordered);
    });
  }, [commit]);

  const resetPlacedObjects = useCallback(() => {
    preparedRestoreRef.current = null;
    transactionRef.current = null;
    setObjects([]); setPast([]); setFuture([]); setObjectInteractionMode("idle");
  }, [setObjects]);

  const value = useMemo<DecorPlacementContextValue>(() => ({
    placedObjects,
    selectedObjectId,
    pendingDecorObject: decor.pendingDecorObject,
    isPlacingObject: Boolean(decor.pendingDecorObject),
    objectInteractionMode: decor.pendingDecorObject ? "placing" : objectInteractionMode,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    addPlacedObject: (object, point) => {
      if (!editor.dimensions) return null;
      const size = getInitialObjectSize(object, editor.dimensions);
      const now = new Date().toISOString();
      const placed = clampObjectToImage<PlacedDecorObject>({
        id: crypto.randomUUID(), decorObjectId: object.id, name: object.name, assetUrl: object.assetUrl, assetType: object.assetType,
        originalWidth: object.width, originalHeight: object.height, x: point.x, y: point.y, width: size.width, height: size.height,
        scaleX: size.scaleX, scaleY: size.scaleY, rotation: 0, opacity: 1, visible: true, locked: false, selected: true,
        zIndex: objectsRef.current.length, flipX: false, flipY: false, lockAspectRatio: true, createdAt: now, updatedAt: now,
      }, editor.dimensions);
      commit((current) => [...current.map((item) => ({ ...item, selected: false })), placed]);
      void decor.clearPendingDecorObject();
      setObjectInteractionMode("idle");
      return placed;
    },
    updatePlacedObject,
    deletePlacedObject: (id) => commit((current) => normalizeObjectZIndexes(current.filter((object) => object.id !== id))),
    duplicatePlacedObject: (id) => {
      if (!editor.dimensions) return;
      commit((current) => {
        const source = current.find((object) => object.id === id);
        if (!source) return current;
        const now = new Date().toISOString();
        const duplicate = clampObjectToImage<PlacedDecorObject>({ ...source, id: crypto.randomUUID(), name: `${source.name} copia`, x: source.x + 20, y: source.y + 20, selected: true, locked: false, zIndex: current.length, createdAt: now, updatedAt: now }, editor.dimensions!);
        return normalizeObjectZIndexes([...current.map((object) => ({ ...object, selected: false })), duplicate]);
      });
    },
    selectPlacedObject,
    clearObjectSelection: () => selectPlacedObject(null),
    bringForward: (id) => orderOperation(id, "forward"),
    sendBackward: (id) => orderOperation(id, "backward"),
    bringToFront: (id) => orderOperation(id, "front"),
    sendToBack: (id) => orderOperation(id, "back"),
    toggleObjectVisibility: (id) => commit((current) => current.map((object) => object.id === id ? { ...object, visible: !object.visible, updatedAt: new Date().toISOString() } : object)),
    toggleObjectLock: (id) => commit((current) => current.map((object) => object.id === id ? { ...object, locked: !object.locked, updatedAt: new Date().toISOString() } : object)),
    flipObjectHorizontal: (id) => commit((current) => current.map((object) => object.id === id ? { ...object, flipX: !object.flipX, updatedAt: new Date().toISOString() } : object)),
    flipObjectVertical: (id) => commit((current) => current.map((object) => object.id === id ? { ...object, flipY: !object.flipY, updatedAt: new Date().toISOString() } : object)),
    cancelPendingObject: () => { void decor.clearPendingDecorObject(); setObjectInteractionMode("idle"); },
    setObjectInteractionMode,
    replacePlacedObjects: (objects) => { transactionRef.current = null; setObjects(normalizeObjectZIndexes(cloneSnapshot(objects))); setPast([]); setFuture([]); setObjectInteractionMode("idle"); },
    prepareProjectRestore: (objects) => { preparedRestoreRef.current = cloneSnapshot(objects); },
    resetPlacedObjects,
    undo: () => {
      const previous = past.at(-1); if (!previous) return;
      setFuture((history) => [cloneSnapshot(objectsRef.current), ...history].slice(0, 50));
      setPast((history) => history.slice(0, -1)); setObjects(cloneSnapshot(previous));
    },
    redo: () => {
      const next = future[0]; if (!next) return;
      setPast((history) => [...history.slice(-49), cloneSnapshot(objectsRef.current)]);
      setFuture((history) => history.slice(1)); setObjects(cloneSnapshot(next));
    },
    beginHistoryTransaction: () => { transactionRef.current ??= cloneSnapshot(objectsRef.current); },
    commitHistoryTransaction: () => {
      const snapshot = transactionRef.current; transactionRef.current = null;
      if (!snapshot || JSON.stringify(snapshot) === JSON.stringify(objectsRef.current)) return;
      setPast((history) => [...history.slice(-49), snapshot]); setFuture([]);
    },
  }), [commit, decor, editor.dimensions, future, objectInteractionMode, orderOperation, past, placedObjects, resetPlacedObjects, selectPlacedObject, selectedObjectId, setObjects, updatePlacedObject]);

  return <DecorPlacementContext.Provider value={value}>{children}</DecorPlacementContext.Provider>;
}

export function useDecorPlacement() {
  const context = useContext(DecorPlacementContext);
  if (!context) throw new Error("useDecorPlacement debe usarse dentro de DecorPlacementProvider.");
  return context;
}
