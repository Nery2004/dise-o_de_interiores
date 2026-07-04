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
  EditorState,
  EditorStatus,
  EditorTool,
  ImageDimensions,
  LoadedImage,
} from "@/types/editor";

type EditorContextValue = EditorState & {
  setActiveTool: (tool: EditorTool) => void;
  setZoom: (zoom: number) => void;
  setStatus: (status: EditorStatus) => void;
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
        setState((current) => ({ ...current, activeTool: tool })),
      setZoom: (zoom) => setState((current) => ({ ...current, zoom })),
      setStatus: (status) => setState((current) => ({ ...current, status })),
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
