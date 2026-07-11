"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { clonePoints, hasMinimumPolygonPoints } from "@/lib/geometry/maskGeometry";
import type {
  BlendMode,
  EditorState,
  EditorStatus,
  EditorTool,
  ImageDimensions,
  ImagePoint,
  LoadedImage,
  WallMask,
} from "@/types/editor";

type EditorContextValue = EditorState & {
  canUndo: boolean;
  canRedo: boolean;
  setActiveTool: (tool: EditorTool) => void;
  setZoom: (zoom: number) => void;
  setStatus: (status: EditorStatus) => void;
  addMask: (mask: WallMask) => void;
  updateMask: (id: string, data: Partial<WallMask>) => void;
  updateMaskPoints: (id: string, points: ImagePoint[]) => void;
  deleteMask: (id: string) => void;
  selectMask: (id: string | null) => void;
  replaceMasks: (masks: WallMask[]) => void;
  toggleMaskVisibility: (id: string) => void;
  clearMasks: () => void;
  setSelectedPointIndexes: (indexes: number[]) => void;
  clearSelectedPoints: () => void;
  deleteSelectedPoints: () => void;
  setMoveWholeMask: (enabled: boolean) => void;
  saveMaskEditing: () => void;
  cancelMaskEditing: () => void;
  resetMaskShape: () => void;
  undo: () => void;
  redo: () => void;
  setActiveColor: (color: string | null) => void;
  setGlobalBlendMode: (blendMode: BlendMode) => void;
  applyColorToSelectedMask: (color: string) => void;
  removeColorFromMask: (id: string) => void;
  startManualMask: () => void;
  addManualPoint: (point: ImagePoint) => void;
  setCursorPreviewPoint: (point: ImagePoint | null) => void;
  finishManualMask: () => void;
  cancelManualMask: () => void;
  toggleBeforeAfter: () => void;
  toggleMaskPreview: () => void;
  uploadImage: (file: File) => Promise<void>;
  openImageDialog: () => void;
  resetImage: () => void;
};

const initialState: EditorState = {
  image: null,
  zoom: 1,
  activeTool: "select",
  originalFile: null,
  temporaryUrl: null,
  dimensions: null,
  status: "idle",
  masks: [],
  selectedMaskId: null,
  activeColor: null,
  maskPreviewEnabled: true,
  beforeAfterEnabled: false,
  globalBlendMode: "multiply",
  isDrawingMask: false,
  manualPoints: [],
  cursorPreviewPoint: null,
  selectedPointIndexes: [],
  editingMaskId: null,
  editingStartPoints: null,
  editingHistoryStart: 0,
  moveWholeMask: false,
  undoStack: [],
  redoStack: [],
};

export const EditorContext = createContext<EditorContextValue | null>(null);

function cloneMasks(masks: WallMask[]) {
  return masks.map((mask) => ({
    ...mask,
    points: clonePoints(mask.points),
    originalPoints: clonePoints(mask.originalPoints),
  }));
}

function prepareMask(mask: WallMask): WallMask {
  return {
    ...mask,
    points: clonePoints(mask.points),
    originalPoints: clonePoints(mask.originalPoints ?? mask.points),
  };
}

function withMaskHistory(
  current: EditorState,
  masks: WallMask[],
  additions: Partial<EditorState> = {},
): EditorState {
  return {
    ...current,
    ...additions,
    masks,
    undoStack: [...current.undoStack, cloneMasks(current.masks)],
    redoStack: [],
  };
}

function getImageDimensions(url: string): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () =>
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => reject(new Error("No se pudo leer la imagen."));
    image.src = url;
  });
}

function getImageFormat(file: File) {
  return file.type.split("/")[1]?.toUpperCase() ??
    file.name.split(".").pop()?.toUpperCase() ??
    "Desconocido";
}

function isTypingTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.tagName === "SELECT" ||
      target.isContentEditable)
  );
}

export function EditorProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<EditorState>(initialState);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const temporaryUrlRef = useRef<string | null>(null);

  const uploadImage = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Selecciona un archivo de imagen valido.");
      return;
    }

    setState((current) => ({ ...current, status: "loading" }));
    const objectUrl = URL.createObjectURL(file);

    try {
      const dimensions = await getImageDimensions(objectUrl);
      if (temporaryUrlRef.current) URL.revokeObjectURL(temporaryUrlRef.current);
      temporaryUrlRef.current = objectUrl;
      const image: LoadedImage = {
        name: file.name,
        size: file.size,
        type: file.type,
        format: getImageFormat(file),
        url: objectUrl,
        dimensions,
      };

      setState({ ...initialState, image, originalFile: file, temporaryUrl: objectUrl, dimensions, status: "ready" });
      toast.success("Imagen cargada.");
    } catch {
      URL.revokeObjectURL(objectUrl);
      setState((current) => ({ ...current, status: "error" }));
      toast.error("No se pudo cargar la imagen.");
    }
  }, []);

  const openImageDialog = useCallback(() => fileInputRef.current?.click(), []);
  const resetImage = useCallback(() => {
    if (temporaryUrlRef.current) {
      URL.revokeObjectURL(temporaryUrlRef.current);
      temporaryUrlRef.current = null;
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
    setState(initialState);
    toast.message("Lienzo listo para una nueva imagen.");
  }, []);

  useEffect(() => () => {
    if (temporaryUrlRef.current) URL.revokeObjectURL(temporaryUrlRef.current);
  }, []);

  const value = useMemo<EditorContextValue>(() => ({
    ...state,
    canUndo: state.undoStack.length > 0,
    canRedo: state.redoStack.length > 0,
    setActiveTool: (tool) => setState((current) => {
      const selected = current.masks.find((mask) => mask.id === current.selectedMaskId);
      const startsEditing = tool === "edit-mask" && selected?.points;
      if (tool === "edit-mask" && selected && !selected.points) {
        toast.error("Esta mascara debe convertirse a puntos antes de editarse.");
      }
      return {
        ...current,
        activeTool: tool,
        isDrawingMask: tool === "manual-select" && Boolean(current.image),
        manualPoints: tool === "manual-select" ? current.manualPoints : [],
        cursorPreviewPoint: tool === "manual-select" ? current.cursorPreviewPoint : null,
        selectedPointIndexes: [],
        editingMaskId: startsEditing ? selected.id : null,
        editingStartPoints: startsEditing ? clonePoints(selected.points) ?? null : null,
        editingHistoryStart: startsEditing ? current.undoStack.length : 0,
        moveWholeMask: false,
      };
    }),
    setZoom: (zoom) => setState((current) => ({ ...current, zoom })),
    setStatus: (status) => setState((current) => ({ ...current, status })),
    addMask: (mask) => setState((current) => withMaskHistory(current, [
      ...current.masks.map((item) => ({ ...item, selected: false })),
      { ...prepareMask(mask), selected: true },
    ], { selectedMaskId: mask.id })),
    updateMask: (id, data) => setState((current) => {
      const shouldRecord = ["points", "opacity", "color", "blendMode"].some((key) => key in data);
      const masks = current.masks.map((mask) => mask.id === id
        ? { ...mask, ...data, updatedAt: new Date().toISOString() }
        : mask);
      return shouldRecord ? withMaskHistory(current, masks) : { ...current, masks };
    }),
    updateMaskPoints: (id, points) => setState((current) => {
      const mask = current.masks.find((item) => item.id === id);
      if (!mask?.points || JSON.stringify(mask.points) === JSON.stringify(points)) return current;
      return withMaskHistory(current, current.masks.map((item) => item.id === id
        ? { ...item, points: clonePoints(points), updatedAt: new Date().toISOString() }
        : item));
    }),
    deleteMask: (id) => setState((current) => withMaskHistory(
      current,
      current.masks.filter((mask) => mask.id !== id),
      {
        selectedMaskId: current.selectedMaskId === id ? null : current.selectedMaskId,
        selectedPointIndexes: [],
        editingMaskId: current.editingMaskId === id ? null : current.editingMaskId,
        editingStartPoints: current.editingMaskId === id ? null : current.editingStartPoints,
      },
    )),
    selectMask: (id) => setState((current) => {
      const selected = current.masks.find((mask) => mask.id === id);
      const startsEditing = current.activeTool === "edit-mask" && selected?.points;
      if (current.activeTool === "edit-mask" && selected && !selected.points) {
        toast.error("Esta mascara debe convertirse a puntos antes de editarse.");
      }
      return {
        ...current,
        selectedMaskId: id,
        masks: current.masks.map((mask) => ({ ...mask, selected: mask.id === id })),
        selectedPointIndexes: [],
        editingMaskId: startsEditing ? selected.id : null,
        editingStartPoints: startsEditing ? clonePoints(selected.points) ?? null : null,
        editingHistoryStart: startsEditing ? current.undoStack.length : 0,
        moveWholeMask: false,
      };
    }),
    replaceMasks: (masks) => setState((current) => withMaskHistory(current, masks.map(prepareMask), {
      selectedMaskId: null,
      selectedPointIndexes: [],
      editingMaskId: null,
      editingStartPoints: null,
    })),
    toggleMaskVisibility: (id) => setState((current) => ({ ...current, masks: current.masks.map((mask) =>
      mask.id === id ? { ...mask, visible: !mask.visible } : mask),
    })),
    clearMasks: () => setState((current) => withMaskHistory(current, [], {
      selectedMaskId: null,
      selectedPointIndexes: [],
      editingMaskId: null,
      editingStartPoints: null,
    })),
    setSelectedPointIndexes: (indexes) => setState((current) => ({ ...current, selectedPointIndexes: [...new Set(indexes)] })),
    clearSelectedPoints: () => setState((current) => ({ ...current, selectedPointIndexes: [] })),
    deleteSelectedPoints: () => setState((current) => {
      const mask = current.masks.find((item) => item.id === current.selectedMaskId);
      if (!mask?.points || current.selectedPointIndexes.length === 0) return current;
      const points = mask.points.filter((_, index) => !current.selectedPointIndexes.includes(index));
      if (!hasMinimumPolygonPoints(points)) {
        toast.error("La mascara debe conservar al menos 3 puntos.");
        return current;
      }
      return withMaskHistory(current, current.masks.map((item) => item.id === mask.id
        ? { ...item, points, updatedAt: new Date().toISOString() }
        : item), { selectedPointIndexes: [] });
    }),
    setMoveWholeMask: (enabled) => setState((current) => ({ ...current, moveWholeMask: enabled, selectedPointIndexes: [] })),
    saveMaskEditing: () => setState((current) => ({
      ...current,
      activeTool: "select",
      editingMaskId: null,
      editingStartPoints: null,
      editingHistoryStart: 0,
      selectedPointIndexes: [],
      moveWholeMask: false,
    })),
    cancelMaskEditing: () => setState((current) => {
      if (!current.editingMaskId || !current.editingStartPoints) return current;
      return {
        ...current,
        activeTool: "select",
        masks: current.masks.map((mask) => mask.id === current.editingMaskId
          ? { ...mask, points: clonePoints(current.editingStartPoints ?? undefined) }
          : mask),
        undoStack: current.undoStack.slice(0, current.editingHistoryStart),
        redoStack: [],
        editingMaskId: null,
        editingStartPoints: null,
        editingHistoryStart: 0,
        selectedPointIndexes: [],
        moveWholeMask: false,
      };
    }),
    resetMaskShape: () => setState((current) => {
      const mask = current.masks.find((item) => item.id === current.selectedMaskId);
      if (!mask?.originalPoints) return current;
      return withMaskHistory(current, current.masks.map((item) => item.id === mask.id
        ? { ...item, points: clonePoints(mask.originalPoints), updatedAt: new Date().toISOString() }
        : item), { selectedPointIndexes: [] });
    }),
    undo: () => setState((current) => {
      const previous = current.undoStack.at(-1);
      if (!previous) return current;
      const selectedMaskId = previous.find((mask) => mask.selected)?.id ??
        (previous.some((mask) => mask.id === current.selectedMaskId) ? current.selectedMaskId : null);
      return {
        ...current,
        masks: cloneMasks(previous),
        selectedMaskId,
        undoStack: current.undoStack.slice(0, -1),
        redoStack: [...current.redoStack, cloneMasks(current.masks)],
        selectedPointIndexes: [],
      };
    }),
    redo: () => setState((current) => {
      const next = current.redoStack.at(-1);
      if (!next) return current;
      const selectedMaskId = next.find((mask) => mask.selected)?.id ??
        (next.some((mask) => mask.id === current.selectedMaskId) ? current.selectedMaskId : null);
      return {
        ...current,
        masks: cloneMasks(next),
        selectedMaskId,
        undoStack: [...current.undoStack, cloneMasks(current.masks)],
        redoStack: current.redoStack.slice(0, -1),
        selectedPointIndexes: [],
      };
    }),
    setActiveColor: (activeColor) => setState((current) => ({ ...current, activeColor })),
    setGlobalBlendMode: (globalBlendMode) => setState((current) => ({ ...current, globalBlendMode })),
    applyColorToSelectedMask: (color) => setState((current) => {
      if (!current.selectedMaskId) {
        toast.error("Selecciona una pared antes de aplicar color.");
        return current;
      }
      return withMaskHistory(current, current.masks.map((mask) => mask.id === current.selectedMaskId
        ? { ...mask, color, blendMode: mask.blendMode ?? current.globalBlendMode, updatedAt: new Date().toISOString() }
        : mask), { activeColor: color });
    }),
    removeColorFromMask: (id) => setState((current) => withMaskHistory(current, current.masks.map((mask) => {
      if (mask.id !== id) return mask;
      const next = { ...mask, updatedAt: new Date().toISOString() };
      delete next.color;
      return next;
    }))),
    startManualMask: () => setState((current) => ({ ...current, isDrawingMask: Boolean(current.image), manualPoints: [], cursorPreviewPoint: null })),
    addManualPoint: (point) => setState((current) => ({ ...current, isDrawingMask: true, manualPoints: [...current.manualPoints, point] })),
    setCursorPreviewPoint: (cursorPreviewPoint) => setState((current) => ({ ...current, cursorPreviewPoint })),
    finishManualMask: () => setState((current) => {
      if (current.manualPoints.length < 3) {
        toast.error("Selecciona al menos 3 puntos para crear una pared.");
        return current;
      }
      const manualCount = current.masks.filter((mask) => mask.type === "manual").length + 1;
      const mask: WallMask = prepareMask({
        id: globalThis.crypto?.randomUUID?.() ?? `manual-mask-${Date.now()}`,
        name: `Seleccion manual ${manualCount}`,
        type: "manual",
        visible: true,
        selected: true,
        opacity: 0.45,
        points: current.manualPoints,
        createdAt: new Date().toISOString(),
      });
      return withMaskHistory(current, [
        ...current.masks.map((item) => ({ ...item, selected: false })),
        mask,
      ], { selectedMaskId: mask.id, isDrawingMask: false, manualPoints: [], cursorPreviewPoint: null });
    }),
    cancelManualMask: () => setState((current) => ({ ...current, isDrawingMask: false, manualPoints: [], cursorPreviewPoint: null })),
    toggleBeforeAfter: () => setState((current) => ({ ...current, beforeAfterEnabled: !current.beforeAfterEnabled })),
    toggleMaskPreview: () => setState((current) => ({ ...current, maskPreviewEnabled: !current.maskPreviewEnabled })),
    uploadImage,
    openImageDialog,
    resetImage,
  }), [openImageDialog, resetImage, state, uploadImage]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isTypingTarget(event.target)) return;
      const modifier = event.metaKey || event.ctrlKey;
      if (modifier && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) value.redo(); else value.undo();
        return;
      }
      if (modifier && event.key.toLowerCase() === "y") {
        event.preventDefault();
        value.redo();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [value]);

  return (
    <EditorContext.Provider value={value}>
      {children}
      <input ref={fileInputRef} className="sr-only" type="file" accept="image/*" onChange={(event) => {
        const file = event.target.files?.[0];
        if (file) void uploadImage(file);
      }} />
    </EditorContext.Provider>
  );
}

export function useEditor() {
  const context = useContext(EditorContext);
  if (!context) throw new Error("useEditor debe usarse dentro de EditorProvider.");
  return context;
}
