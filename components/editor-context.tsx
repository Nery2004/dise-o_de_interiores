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
  setActiveTool: (tool: EditorTool) => void;
  setZoom: (zoom: number) => void;
  setStatus: (status: EditorStatus) => void;
  addMask: (mask: WallMask) => void;
  updateMask: (id: string, data: Partial<WallMask>) => void;
  deleteMask: (id: string) => void;
  selectMask: (id: string | null) => void;
  replaceMasks: (masks: WallMask[]) => void;
  toggleMaskVisibility: (id: string) => void;
  clearMasks: () => void;
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
};

export const EditorContext = createContext<EditorContextValue | null>(null);

function getImageDimensions(url: string): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => {
      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
    };
    image.onerror = () => reject(new Error("No se pudo leer la imagen."));
    image.src = url;
  });
}

function getImageFormat(file: File) {
  const mimeFormat = file.type.split("/")[1];

  if (mimeFormat) {
    return mimeFormat.toUpperCase();
  }

  return file.name.split(".").pop()?.toUpperCase() ?? "Desconocido";
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

      if (temporaryUrlRef.current) {
        URL.revokeObjectURL(temporaryUrlRef.current);
      }

      temporaryUrlRef.current = objectUrl;

      const image: LoadedImage = {
        name: file.name,
        size: file.size,
        type: file.type,
        format: getImageFormat(file),
        url: objectUrl,
        dimensions,
      };

      setState({
        image,
        zoom: 1,
        activeTool: "select",
        originalFile: file,
        temporaryUrl: objectUrl,
        dimensions,
        status: "ready",
        masks: [],
        selectedMaskId: null,
        activeColor: null,
        maskPreviewEnabled: true,
        beforeAfterEnabled: false,
        globalBlendMode: "multiply",
        isDrawingMask: false,
        manualPoints: [],
        cursorPreviewPoint: null,
      });
      toast.success("Imagen cargada.");
    } catch {
      URL.revokeObjectURL(objectUrl);
      setState((current) => ({ ...current, status: "error" }));
      toast.error("No se pudo cargar la imagen.");
    }
  }, []);

  const openImageDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const resetImage = useCallback(() => {
    if (temporaryUrlRef.current) {
      URL.revokeObjectURL(temporaryUrlRef.current);
      temporaryUrlRef.current = null;
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setState(initialState);
    toast.message("Lienzo listo para una nueva imagen.");
  }, []);

  useEffect(() => {
    return () => {
      if (temporaryUrlRef.current) {
        URL.revokeObjectURL(temporaryUrlRef.current);
      }
    };
  }, []);

  const value = useMemo<EditorContextValue>(
    () => ({
      ...state,
      setActiveTool: (tool) =>
        setState((current) => ({
          ...current,
          activeTool: tool,
          isDrawingMask: tool === "manual-select" && Boolean(current.image),
          manualPoints: tool === "manual-select" ? current.manualPoints : [],
          cursorPreviewPoint:
            tool === "manual-select" ? current.cursorPreviewPoint : null,
        })),
      setZoom: (zoom) => setState((current) => ({ ...current, zoom })),
      setStatus: (status) => setState((current) => ({ ...current, status })),
      addMask: (mask) =>
        setState((current) => ({
          ...current,
          masks: [
            ...current.masks.map((item) => ({ ...item, selected: false })),
            { ...mask, selected: true },
          ],
          selectedMaskId: mask.id,
        })),
      updateMask: (id, data) =>
        setState((current) => ({
          ...current,
          masks: current.masks.map((mask) =>
            mask.id === id ? { ...mask, ...data } : mask,
          ),
        })),
      deleteMask: (id) =>
        setState((current) => {
          const masks = current.masks.filter((mask) => mask.id !== id);
          const selectedMaskId =
            current.selectedMaskId === id ? null : current.selectedMaskId;

          return {
            ...current,
            masks,
            selectedMaskId,
          };
        }),
      selectMask: (id) =>
        setState((current) => ({
          ...current,
          selectedMaskId: id,
          masks: current.masks.map((mask) => ({
            ...mask,
            selected: mask.id === id,
          })),
        })),
      replaceMasks: (masks) =>
        setState((current) => ({
          ...current,
          masks,
          selectedMaskId: null,
        })),
      toggleMaskVisibility: (id) =>
        setState((current) => ({
          ...current,
          masks: current.masks.map((mask) =>
            mask.id === id ? { ...mask, visible: !mask.visible } : mask,
          ),
        })),
      clearMasks: () =>
        setState((current) => ({
          ...current,
          masks: [],
          selectedMaskId: null,
        })),
      setActiveColor: (color) =>
        setState((current) => ({ ...current, activeColor: color })),
      setGlobalBlendMode: (blendMode) =>
        setState((current) => ({ ...current, globalBlendMode: blendMode })),
      applyColorToSelectedMask: (color) =>
        setState((current) => {
          if (!current.selectedMaskId) {
            toast.error("Selecciona una pared antes de aplicar color.");
            return current;
          }

          return {
            ...current,
            activeColor: color,
            masks: current.masks.map((mask) =>
              mask.id === current.selectedMaskId
                ? {
                    ...mask,
                    color,
                    blendMode: mask.blendMode ?? current.globalBlendMode,
                  }
                : mask,
            ),
          };
        }),
      removeColorFromMask: (id) =>
        setState((current) => ({
          ...current,
          masks: current.masks.map((mask) => {
            if (mask.id !== id) {
              return mask;
            }

            const nextMask = { ...mask };
            delete nextMask.color;
            return nextMask;
          }),
        })),
      startManualMask: () =>
        setState((current) => ({
          ...current,
          isDrawingMask: Boolean(current.image),
          manualPoints: [],
          cursorPreviewPoint: null,
        })),
      addManualPoint: (point) =>
        setState((current) => ({
          ...current,
          isDrawingMask: true,
          manualPoints: [...current.manualPoints, point],
        })),
      setCursorPreviewPoint: (point) =>
        setState((current) => ({ ...current, cursorPreviewPoint: point })),
      finishManualMask: () =>
        setState((current) => {
          if (current.manualPoints.length < 3) {
            toast.error("Selecciona al menos 3 puntos para crear una pared.");
            return current;
          }

          const manualCount =
            current.masks.filter((mask) => mask.type === "manual").length + 1;
          const mask: WallMask = {
            id:
              globalThis.crypto?.randomUUID?.() ??
              `manual-mask-${Date.now()}`,
            name: `Seleccion manual ${manualCount}`,
            type: "manual",
            visible: true,
            selected: true,
            opacity: 0.45,
            points: current.manualPoints,
            createdAt: new Date().toISOString(),
          };

          return {
            ...current,
            masks: [
              ...current.masks.map((item) => ({ ...item, selected: false })),
              mask,
            ],
            selectedMaskId: mask.id,
            isDrawingMask: false,
            manualPoints: [],
            cursorPreviewPoint: null,
          };
        }),
      cancelManualMask: () =>
        setState((current) => ({
          ...current,
          isDrawingMask: false,
          manualPoints: [],
          cursorPreviewPoint: null,
        })),
      toggleBeforeAfter: () =>
        setState((current) => ({
          ...current,
          beforeAfterEnabled: !current.beforeAfterEnabled,
        })),
      toggleMaskPreview: () =>
        setState((current) => ({
          ...current,
          maskPreviewEnabled: !current.maskPreviewEnabled,
        })),
      uploadImage,
      openImageDialog,
      resetImage,
    }),
    [openImageDialog, resetImage, state, uploadImage],
  );

  return (
    <EditorContext.Provider value={value}>
      {children}
      <input
        ref={fileInputRef}
        className="sr-only"
        type="file"
        accept="image/*"
        onChange={(event) => {
          const file = event.target.files?.[0];

          if (file) {
            void uploadImage(file);
          }
        }}
      />
    </EditorContext.Provider>
  );
}

export function useEditor() {
  const context = useContext(EditorContext);

  if (!context) {
    throw new Error("useEditor debe usarse dentro de EditorProvider.");
  }

  return context;
}
