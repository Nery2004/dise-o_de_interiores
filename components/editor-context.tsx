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
  BrushStroke,
  WhiteBaseSettings,
} from "@/types/editor";
import type { InteriorProject } from "@/types/project";
import { addRecentColor } from "@/lib/colors/colorPreferences";
import { validateImageUploadMetadata } from "@/lib/images/imageValidation";
import { withDefaultPaintSettings } from "@/lib/paint/paintSettings";
import { getStoredPaintPreferences } from "@/lib/paint/paintPreferences";
import {
  getHistoryShortcut,
  isTypingTarget,
} from "@/lib/editor/keyboardShortcuts";

type EditorContextValue = EditorState & {
  canUndo: boolean;
  canRedo: boolean;
  setActiveTool: (tool: EditorTool) => void;
  setZoom: (zoom: number) => void;
  setStatus: (status: EditorStatus) => void;
  addMask: (mask: WallMask) => void;
  updateMask: (id: string, data: Partial<WallMask>) => void;
  setWhiteBaseAnalysis: (id: string, settings: WhiteBaseSettings) => void;
  setWhiteBasePreview: (enabled: boolean) => void;
  updateMaskPoints: (id: string, points: ImagePoint[]) => void;
  deleteMask: (id: string) => void;
  selectMask: (id: string | null) => void;
  replaceMasks: (masks: WallMask[]) => void;
  toggleMaskVisibility: (id: string) => void;
  clearMasks: () => void;
  addBrushStroke: (maskId: string, stroke: BrushStroke) => void;
  undoLastBrushStroke: (maskId: string) => void;
  clearMaskRefinements: (maskId: string) => void;
  setBrushSize: (size: number) => void;
  setBrushHardness: (hardness: number) => void;
  setBrushOpacity: (opacity: number) => void;
  setMaskOnlyPreview: (enabled: boolean) => void;
  setInvertRefinementPreview: (enabled: boolean) => void;
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
  restoreProject: (project: InteriorProject) => Promise<void>;
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
  globalBlendMode: "paint-simulation",
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
  brushSize: 40,
  brushHardness: 0.7,
  brushOpacity: 1,
  maskOnlyPreview: false,
  invertRefinementPreview: false,
  whiteBasePreviewMaskId: null,
};

export const EditorContext = createContext<EditorContextValue | null>(null);
const MAX_EDITOR_HISTORY = 100;

function cloneMasks(masks: WallMask[]) {
  return masks.map((mask) => ({
    ...mask,
    points: clonePoints(mask.points),
    originalPoints: clonePoints(mask.originalPoints),
    refinement: mask.refinement ? {
      ...mask.refinement,
      addStrokes: mask.refinement.addStrokes.map((stroke) => ({ ...stroke, points: clonePoints(stroke.points) ?? [] })),
      removeStrokes: mask.refinement.removeStrokes.map((stroke) => ({ ...stroke, points: clonePoints(stroke.points) ?? [] })),
    } : undefined,
    whiteBaseSettings: mask.whiteBaseSettings
      ? { ...mask.whiteBaseSettings }
      : undefined,
  }));
}

function prepareMask(mask: WallMask): WallMask {
  return {
    ...withDefaultPaintSettings(mask),
    points: clonePoints(mask.points),
    originalPoints: clonePoints(mask.originalPoints ?? mask.points),
    refinement: mask.refinement ? {
      ...mask.refinement,
      addStrokes: mask.refinement.addStrokes.map((stroke) => ({ ...stroke, points: clonePoints(stroke.points) ?? [] })),
      removeStrokes: mask.refinement.removeStrokes.map((stroke) => ({ ...stroke, points: clonePoints(stroke.points) ?? [] })),
    } : undefined,
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
    undoStack: [
      ...current.undoStack.slice(-(MAX_EDITOR_HISTORY - 1)),
      cloneMasks(current.masks),
    ],
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

function getValidToolForImageWithoutMasks(tool: EditorTool): EditorTool {
  return tool === "edit-mask" ||
    tool === "add-to-mask" ||
    tool === "remove-from-mask"
    ? "select"
    : tool;
}

export function EditorProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<EditorState>(initialState);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const temporaryUrlRef = useRef<string | null>(null);

  const uploadImage = useCallback(async (file: File) => {
    const validation = validateImageUploadMetadata(file);
    if (!validation.valid) {
      toast.error(validation.message);
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

      setState((current) => {
        const activeTool = getValidToolForImageWithoutMasks(current.activeTool);
        return {
          ...initialState,
          image,
          originalFile: file,
          temporaryUrl: objectUrl,
          dimensions,
          status: "ready",
          activeTool,
          isDrawingMask: activeTool === "manual-select",
        };
      });
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

  const restoreProject = useCallback(async (project: InteriorProject) => {
    const blob = project.originalImageBlob;
    if (!blob) throw new Error("No se pudo cargar la imagen del proyecto.");
    const objectUrl = URL.createObjectURL(blob);
    let dimensions: ImageDimensions;
    try {
      dimensions = await getImageDimensions(objectUrl);
    } catch {
      URL.revokeObjectURL(objectUrl);
      throw new Error("No se pudo cargar la imagen del proyecto.");
    }
    if (temporaryUrlRef.current) URL.revokeObjectURL(temporaryUrlRef.current);
    temporaryUrlRef.current = objectUrl;
    const file = new File([blob], project.originalImage.name, { type: project.originalImage.type });
    const selectedMaskId = project.masks.some((mask) => mask.id === project.selectedMaskId) ? project.selectedMaskId : null;
    setState({
      ...initialState,
      image: { name: project.originalImage.name, size: project.originalImage.size, type: project.originalImage.type, format: getImageFormat(file), url: objectUrl, dimensions },
      originalFile: file,
      temporaryUrl: objectUrl,
      dimensions,
      status: "ready",
      masks: project.masks.map((mask) => ({ ...prepareMask(mask), selected: mask.id === selectedMaskId })),
      selectedMaskId,
      activeColor: project.activeColor,
      globalBlendMode: project.globalBlendMode,
      zoom: project.editorSettings.zoom,
      beforeAfterEnabled: project.editorSettings.beforeAfterEnabled,
      maskPreviewEnabled: project.editorSettings.maskPreviewEnabled,
      brushSize: project.editorSettings.brushSize,
      brushHardness: project.editorSettings.brushHardness,
      brushOpacity: project.editorSettings.brushOpacity,
    });
  }, []);

  useEffect(() => () => {
    if (temporaryUrlRef.current) URL.revokeObjectURL(temporaryUrlRef.current);
  }, []);

  const value = useMemo<EditorContextValue>(() => ({
    ...state,
    canUndo: state.undoStack.length > 0,
    canRedo: state.redoStack.length > 0,
    setActiveTool: (tool) => setState((current) => {
      const isBrushTool = tool === "add-to-mask" || tool === "remove-from-mask";
      if (isBrushTool && !current.image) {
        toast.error("Primero sube una imagen.");
        return current;
      }
      const selected = current.masks.find((mask) => mask.id === current.selectedMaskId);
      if (isBrushTool && !selected) {
        toast.error("Selecciona una pared antes de refinarla.");
        return current;
      }
      if (isBrushTool && selected && !selected.visible) {
        toast.error("Muestra la máscara antes de editarla.");
        return current;
      }
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
        beforeAfterEnabled: isBrushTool ? false : current.beforeAfterEnabled,
        maskOnlyPreview: isBrushTool ? current.maskOnlyPreview : false,
        invertRefinementPreview: isBrushTool ? current.invertRefinementPreview : false,
      };
    }),
    setZoom: (zoom) => setState((current) => ({ ...current, zoom })),
    setStatus: (status) => setState((current) => ({ ...current, status })),
    addMask: (mask) => setState((current) => withMaskHistory(current, [
      ...current.masks.map((item) => ({ ...item, selected: false })),
      { ...prepareMask(mask), selected: true },
    ], { selectedMaskId: mask.id, whiteBasePreviewMaskId: null })),
    updateMask: (id, data) => setState((current) => {
      const shouldRecord = [
        "points",
        "opacity",
        "color",
        "blendMode",
        "paintMode",
        "primerCoverage",
        "paintIntensity",
        "edgeFeather",
        "renderQuality",
        "whiteBaseSettings",
      ].some((key) => key in data);
      const masks = current.masks.map((mask) => mask.id === id
        ? { ...mask, ...data, updatedAt: new Date().toISOString() }
        : mask);
      return shouldRecord ? withMaskHistory(current, masks) : { ...current, masks };
    }),
    setWhiteBaseAnalysis: (id, settings) => setState((current) => ({
      ...current,
      masks: current.masks.map((mask) =>
        mask.id === id
          ? { ...mask, whiteBaseSettings: settings }
          : mask),
    })),
    setWhiteBasePreview: (enabled) => setState((current) => ({
      ...current,
      whiteBasePreviewMaskId:
        enabled && current.selectedMaskId ? current.selectedMaskId : null,
    })),
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
        maskOnlyPreview: current.selectedMaskId === id ? false : current.maskOnlyPreview,
        invertRefinementPreview: current.selectedMaskId === id ? false : current.invertRefinementPreview,
        whiteBasePreviewMaskId:
          current.whiteBasePreviewMaskId === id
            ? null
            : current.whiteBasePreviewMaskId,
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
        whiteBasePreviewMaskId:
          current.whiteBasePreviewMaskId === id
            ? current.whiteBasePreviewMaskId
            : null,
      };
    }),
    replaceMasks: (masks) => setState((current) => withMaskHistory(current, masks.map(prepareMask), {
      selectedMaskId: null,
      selectedPointIndexes: [],
      editingMaskId: null,
      editingStartPoints: null,
      maskOnlyPreview: false,
      invertRefinementPreview: false,
      whiteBasePreviewMaskId: null,
    })),
    toggleMaskVisibility: (id) => setState((current) => ({ ...current, masks: current.masks.map((mask) =>
      mask.id === id ? { ...mask, visible: !mask.visible } : mask),
    })),
    clearMasks: () => setState((current) => withMaskHistory(current, [], {
      selectedMaskId: null,
      selectedPointIndexes: [],
      editingMaskId: null,
      editingStartPoints: null,
      maskOnlyPreview: false,
      invertRefinementPreview: false,
      whiteBasePreviewMaskId: null,
    })),
    addBrushStroke: (maskId, stroke) => setState((current) => {
      const mask = current.masks.find((item) => item.id === maskId);
      if (!mask || !current.dimensions) return current;
      const refinement = mask.refinement ?? {
        width: current.dimensions.width,
        height: current.dimensions.height,
        addStrokes: [],
        removeStrokes: [],
      };
      const key = stroke.mode === "add" ? "addStrokes" : "removeStrokes";
      return withMaskHistory(current, current.masks.map((item) => item.id === maskId ? {
        ...item,
        refinement: { ...refinement, [key]: [...refinement[key], { ...stroke, points: clonePoints(stroke.points) ?? [] }] },
        updatedAt: new Date().toISOString(),
      } : item));
    }),
    undoLastBrushStroke: (maskId) => setState((current) => {
      const mask = current.masks.find((item) => item.id === maskId);
      if (!mask?.refinement) return current;
      const strokes = [...mask.refinement.addStrokes, ...mask.refinement.removeStrokes]
        .sort((first, second) => second.createdAt.localeCompare(first.createdAt));
      const lastStroke = strokes[0];
      if (!lastStroke) return current;
      return withMaskHistory(current, current.masks.map((item) => item.id === maskId ? {
        ...item,
        refinement: {
          ...mask.refinement!,
          addStrokes: mask.refinement!.addStrokes.filter((stroke) => stroke.id !== lastStroke.id),
          removeStrokes: mask.refinement!.removeStrokes.filter((stroke) => stroke.id !== lastStroke.id),
        },
        updatedAt: new Date().toISOString(),
      } : item));
    }),
    clearMaskRefinements: (maskId) => setState((current) => {
      const mask = current.masks.find((item) => item.id === maskId);
      if (!mask?.refinement || (mask.refinement.addStrokes.length === 0 && mask.refinement.removeStrokes.length === 0)) return current;
      return withMaskHistory(current, current.masks.map((item) => item.id === maskId ? {
        ...item,
        refinement: { ...mask.refinement!, addStrokes: [], removeStrokes: [] },
        updatedAt: new Date().toISOString(),
      } : item));
    }),
    setBrushSize: (brushSize) => setState((current) => ({ ...current, brushSize })),
    setBrushHardness: (brushHardness) => setState((current) => ({ ...current, brushHardness })),
    setBrushOpacity: (brushOpacity) => setState((current) => ({ ...current, brushOpacity })),
    setMaskOnlyPreview: (maskOnlyPreview) => setState((current) => ({ ...current, maskOnlyPreview })),
    setInvertRefinementPreview: (invertRefinementPreview) => setState((current) => ({ ...current, invertRefinementPreview })),
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
        redoStack: [
          ...current.redoStack.slice(-(MAX_EDITOR_HISTORY - 1)),
          cloneMasks(current.masks),
        ],
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
        undoStack: [
          ...current.undoStack.slice(-(MAX_EDITOR_HISTORY - 1)),
          cloneMasks(current.masks),
        ],
        redoStack: current.redoStack.slice(0, -1),
        selectedPointIndexes: [],
      };
    }),
    setActiveColor: (activeColor) => {
      setState((current) => ({ ...current, activeColor }));
      if (activeColor) void addRecentColor(activeColor);
    },
    setGlobalBlendMode: (globalBlendMode) => setState((current) => ({ ...current, globalBlendMode })),
    applyColorToSelectedMask: (color) => {
      const preferences = getStoredPaintPreferences();
      setState((current) => {
        if (!current.selectedMaskId) {
          toast.error("Selecciona una pared antes de aplicar color.");
          return current;
        }
        return withMaskHistory(current, current.masks.map((mask) => mask.id === current.selectedMaskId
          ? {
              ...mask,
              color,
              ...preferences,
              updatedAt: new Date().toISOString(),
            }
          : mask), { activeColor: color });
      });
    },
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
    restoreProject,
  }), [openImageDialog, resetImage, restoreProject, state, uploadImage]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented) return;
      if (isTypingTarget(event.target)) return;
      const shortcut = getHistoryShortcut(event);
      if (shortcut === "undo") {
        event.preventDefault();
        value.undo();
        return;
      }
      if (shortcut === "redo") {
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
