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
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useEditor } from "@/components/editor-context";
import { createProjectThumbnail } from "@/lib/projects/createProjectThumbnail";
import {
  createProject,
  getProjectById,
  updateProject,
} from "@/lib/projects/projectStorage";
import { migrateProject } from "@/lib/projects/projectValidation";
import { CURRENT_PROJECT_VERSION, type InteriorProject } from "@/types/project";
import { consumePendingEditorColor } from "@/lib/colors/colorPreferences";
import { createProposalThumbnail } from "@/lib/proposals/createProposalThumbnail";
import {
  applyProposalSnapshot,
  clonePerspectiveGuide,
  clonePlacedDecorObjects,
  clonePlacementSurfaces,
  createProposalSnapshot,
} from "@/lib/proposals/proposalUtils";
import type { DesignProposal } from "@/types/proposal";
import { useDecorPlacement } from "@/components/decor-placement-context";

export type ProjectSaveStatus = "unsaved" | "saving" | "saved" | "error";

type ProjectContextValue = {
  activeProjectId: string | null;
  activeProjectName: string | null;
  activeProjectDescription: string;
  isDirty: boolean;
  isSaving: boolean;
  lastSavedAt: string | null;
  autosaveEnabled: boolean;
  saveStatus: ProjectSaveStatus;
  saveDialogOpen: boolean;
  unsavedDialogOpen: boolean;
  setAutosaveEnabled: (enabled: boolean) => void;
  setSaveDialogOpen: (open: boolean) => void;
  setUnsavedDialogOpen: (open: boolean) => void;
  finishSaveDialog: () => void;
  cancelSaveDialog: () => void;
  cancelPendingAction: () => void;
  requestSave: () => void;
  saveCurrentProject: (
    metadata?: { name: string; description?: string },
    silent?: boolean,
  ) => Promise<boolean>;
  loadProject: (id: string) => Promise<void>;
  createNewProject: () => void;
  openImageAsNewProject: () => void;
  continueWithoutSaving: () => void;
  saveAndContinue: () => Promise<void>;
  navigateWithGuard: (href: string) => void;
  markDirty: () => void;
  proposals: DesignProposal[];
  activeProposalId: string | null;
  selectedProposalIds: string[];
  createProposal: (data: {
    name: string;
    description?: string;
    tags?: string[];
  }) => Promise<boolean>;
  updateProposal: (id: string, changes: Partial<DesignProposal>) => void;
  deleteProposal: (id: string) => void;
  duplicateProposal: (id: string) => void;
  applyProposal: (id: string) => boolean;
  toggleProposalSelection: (id: string) => void;
  compareProposals: () => boolean;
  clearProposalSelection: () => void;
};

const ProjectContext = createContext<ProjectContextValue | null>(null);

function storageErrorMessage(error: unknown) {
  if (error instanceof Error && error.message === "DECOR_ASSET_LOAD_FAILED")
    return "No se pudo cargar este objeto.";
  return error instanceof DOMException && error.name === "QuotaExceededError"
    ? "El almacenamiento local está lleno."
    : "No se pudo guardar el proyecto en este dispositivo.";
}

export function ProjectProvider({
  children,
  initialProjectId,
}: {
  children: ReactNode;
  initialProjectId?: string;
}) {
  const editor = useEditor();
  const placement = useDecorPlacement();
  const router = useRouter();
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeProjectName, setActiveProjectName] = useState<string | null>(
    null,
  );
  const [activeProjectDescription, setActiveProjectDescription] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [autosaveEnabled, setAutosaveEnabled] = useState(true);
  const [saveStatus, setSaveStatus] = useState<ProjectSaveStatus>("saved");
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [unsavedDialogOpen, setUnsavedDialogOpen] = useState(false);
  const [revision, setRevision] = useState(0);
  const [proposals, setProposals] = useState<DesignProposal[]>([]);
  const [activeProposalId, setActiveProposalId] = useState<string | null>(null);
  const [selectedProposalIds, setSelectedProposalIds] = useState<string[]>([]);
  const signatureRef = useRef<string | null>(null);
  const skipDirtyRef = useRef(false);
  const pendingActionRef = useRef<(() => void) | null>(null);
  const savePromiseRef = useRef<Promise<boolean> | null>(null);
  const activeProjectIdRef = useRef<string | null>(null);
  const restoringProjectRef = useRef(false);

  const signature = useMemo(
    () =>
      JSON.stringify({
        image: editor.image
          ? [editor.image.name, editor.image.size, editor.image.dimensions]
          : null,
        masks: editor.masks,
        activeColor: editor.activeColor,
        selectedMaskId: editor.selectedMaskId,
        globalBlendMode: editor.globalBlendMode,
        placedObjects: placement.placedObjects.map((object) => ({
          ...object,
          selected: false,
        })),
        placementSurfaces: clonePlacementSurfaces(placement.placementSurfaces),
        perspectiveGuide: clonePerspectiveGuide(placement.perspectiveGuide),
        settings: [
          editor.zoom,
          editor.beforeAfterEnabled,
          editor.maskPreviewEnabled,
          editor.brushSize,
          editor.brushHardness,
          editor.brushOpacity,
        ],
        proposals,
      }),
    [
      editor.activeColor,
      editor.beforeAfterEnabled,
      editor.brushHardness,
      editor.brushOpacity,
      editor.brushSize,
      editor.globalBlendMode,
      editor.image,
      editor.maskPreviewEnabled,
      editor.masks,
      editor.selectedMaskId,
      editor.zoom,
      placement.perspectiveGuide,
      placement.placedObjects,
      placement.placementSurfaces,
      proposals,
    ],
  );

  useEffect(() => {
    if (
      signatureRef.current === null ||
      skipDirtyRef.current ||
      restoringProjectRef.current
    ) {
      signatureRef.current = signature;
      skipDirtyRef.current = false;
      return;
    }
    if (signatureRef.current !== signature) {
      signatureRef.current = signature;
      setIsDirty(true);
      setSaveStatus("unsaved");
      setRevision((current) => current + 1);
    }
  }, [signature]);

  const loadProject = useCallback(
    async (id: string) => {
      try {
        const stored = await getProjectById(id);
        if (!stored) throw new Error("MISSING_PROJECT");
        const project = migrateProject(stored);
        if (
          !project.originalImageBlob ||
          !Array.isArray(project.masks) ||
          project.originalImage.width <= 0 ||
          project.originalImage.height <= 0
        )
          throw new Error("CORRUPT_PROJECT");
        skipDirtyRef.current = true;
        restoringProjectRef.current = true;
        placement.prepareProjectRestore(
          project.placedObjects,
          project.placementSurfaces,
          project.perspectiveGuide,
        );
        await editor.restoreProject(project);
        const pendingColor = await consumePendingEditorColor();
        if (pendingColor) {
          editor.setActiveColor(pendingColor.hex);
          if (pendingColor.applyToSelection)
            editor.applyColorToSelectedMask(pendingColor.hex);
        }
        setActiveProjectId(project.id);
        activeProjectIdRef.current = project.id;
        setActiveProjectName(project.name);
        setActiveProjectDescription(project.description ?? "");
        setProposals(project.proposals);
        setActiveProposalId(null);
        setSelectedProposalIds([]);
        setLastSavedAt(project.updatedAt);
        setIsDirty(false);
        setSaveStatus("saved");
        if (pendingColor) {
          setIsDirty(true);
          setSaveStatus("unsaved");
          setRevision((current) => current + 1);
        }
        window.setTimeout(() => {
          restoringProjectRef.current = false;
        }, 0);
      } catch (error) {
        restoringProjectRef.current = false;
        toast.error(
          error instanceof Error && error.message === "INCOMPATIBLE_VERSION"
            ? "Este proyecto fue creado con una versión incompatible."
            : "No se pudo cargar la imagen del proyecto.",
        );
      }
    },
    [editor, placement],
  );

  useEffect(() => {
    if (!initialProjectId) return;
    const timer = window.setTimeout(
      () => void loadProject(initialProjectId),
      0,
    );
    return () => window.clearTimeout(timer);
    // initial project must only load once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialProjectId]);

  const saveCurrentProject = useCallback(
    async (
      metadata?: { name: string; description?: string },
      silent = false,
    ) => {
      if (savePromiseRef.current) return savePromiseRef.current;
      if (!editor.image || !editor.originalFile) {
        toast.error("Primero sube una imagen.");
        return false;
      }
      const name = metadata?.name.trim() || activeProjectName;
      if (!name) {
        setSaveDialogOpen(true);
        return false;
      }
      const startSignature = signatureRef.current;
      const operation = (async () => {
        setIsSaving(true);
        setSaveStatus("saving");
        try {
          const existing = activeProjectId
            ? await getProjectById(activeProjectId)
            : undefined;
          const now = new Date().toISOString();
          const imageUnchanged =
            existing?.originalImage.name === editor.image!.name &&
            existing.originalImage.size === editor.image!.size &&
            existing.originalImage.type === editor.image!.type;
          const visualUnchanged =
            imageUnchanged &&
            existing?.globalBlendMode === editor.globalBlendMode &&
            JSON.stringify(existing?.masks) === JSON.stringify(editor.masks) &&
            JSON.stringify(existing?.placedObjects) ===
              JSON.stringify(clonePlacedDecorObjects(placement.placedObjects));
          const thumbnail =
            visualUnchanged && existing?.thumbnail
              ? existing.thumbnail
              : await createProjectThumbnail(
                  editor.image!,
                  editor.masks,
                  editor.globalBlendMode,
                  placement.placedObjects,
                );
          const id = existing?.id ?? crypto.randomUUID();
          const project: InteriorProject = {
            id,
            name: name.slice(0, 80),
            description:
              (metadata?.description ?? activeProjectDescription).slice(
                0,
                300,
              ) || undefined,
            version: CURRENT_PROJECT_VERSION,
            createdAt: existing?.createdAt ?? now,
            updatedAt: now,
            thumbnail,
            originalImage: {
              name: editor.image!.name,
              type: editor.image!.type,
              width: editor.image!.dimensions.width,
              height: editor.image!.dimensions.height,
              size: editor.image!.size,
            },
            originalImageBlob:
              imageUnchanged && existing?.originalImageBlob
                ? existing.originalImageBlob
                : editor.originalFile!,
            masks: editor.masks,
            placedObjects: clonePlacedDecorObjects(placement.placedObjects),
            placementSurfaces: clonePlacementSurfaces(
              placement.placementSurfaces,
            ),
            perspectiveGuide: clonePerspectiveGuide(placement.perspectiveGuide),
            activeColor: editor.activeColor,
            selectedMaskId: editor.selectedMaskId,
            globalBlendMode: editor.globalBlendMode,
            editorSettings: {
              zoom: editor.zoom,
              beforeAfterEnabled: editor.beforeAfterEnabled,
              maskPreviewEnabled: editor.maskPreviewEnabled,
              brushSize: editor.brushSize,
              brushHardness: editor.brushHardness,
              brushOpacity: editor.brushOpacity,
            },
            proposals,
          };
          if (existing) await updateProject(id, project);
          else await createProject(project);
          setActiveProjectId(id);
          activeProjectIdRef.current = id;
          setActiveProjectName(project.name);
          setActiveProjectDescription(project.description ?? "");
          setLastSavedAt(now);
          if (signatureRef.current === startSignature) setIsDirty(false);
          setSaveStatus(
            signatureRef.current === startSignature ? "saved" : "unsaved",
          );
          if (!silent) toast.success("Proyecto guardado correctamente.");
          return true;
        } catch (error) {
          setSaveStatus("error");
          toast.error(storageErrorMessage(error));
          return false;
        } finally {
          setIsSaving(false);
          savePromiseRef.current = null;
        }
      })();
      savePromiseRef.current = operation;
      return operation;
    },
    [
      activeProjectDescription,
      activeProjectId,
      activeProjectName,
      editor,
      placement.perspectiveGuide,
      placement.placedObjects,
      placement.placementSurfaces,
      proposals,
    ],
  );

  useEffect(() => {
    if (!autosaveEnabled || !activeProjectId || !isDirty || isSaving) return;
    const timer = window.setTimeout(
      () => void saveCurrentProject(undefined, true),
      2000,
    );
    return () => window.clearTimeout(timer);
  }, [
    activeProjectId,
    autosaveEnabled,
    isDirty,
    isSaving,
    revision,
    saveCurrentProject,
  ]);

  useEffect(() => {
    function handleSaveShortcut(event: KeyboardEvent) {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "s")
        return;
      event.preventDefault();
      if (activeProjectId) void saveCurrentProject();
      else setSaveDialogOpen(true);
    }
    window.addEventListener("keydown", handleSaveShortcut);
    return () => window.removeEventListener("keydown", handleSaveShortcut);
  }, [activeProjectId, saveCurrentProject]);

  useEffect(() => {
    function beforeUnload(event: BeforeUnloadEvent) {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [isDirty]);

  const executePending = useCallback(() => {
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    setUnsavedDialogOpen(false);
    action?.();
  }, []);

  const resetProject = useCallback(() => {
    skipDirtyRef.current = true;
    editor.resetImage();
    placement.resetPlacedObjects();
    setActiveProjectId(null);
    activeProjectIdRef.current = null;
    setActiveProjectName(null);
    setActiveProjectDescription("");
    setProposals([]);
    setActiveProposalId(null);
    setSelectedProposalIds([]);
    setLastSavedAt(null);
    setIsDirty(false);
    setSaveStatus("saved");
  }, [editor, placement]);

  const guardAction = useCallback(
    (action: () => void) => {
      if (!isDirty) {
        action();
        return;
      }
      pendingActionRef.current = action;
      setUnsavedDialogOpen(true);
    },
    [isDirty],
  );

  const createProposal = useCallback(
    async (data: { name: string; description?: string; tags?: string[] }) => {
      if (!editor.image || !data.name.trim()) return false;
      try {
        const now = new Date().toISOString();
        const snapshot = createProposalSnapshot(editor.masks);
        const objectsSnapshot = clonePlacedDecorObjects(
          placement.placedObjects,
        );
        const surfacesSnapshot = clonePlacementSurfaces(
          placement.placementSurfaces,
        );
        const guideSnapshot = clonePerspectiveGuide(placement.perspectiveGuide);
        const thumbnail = await createProposalThumbnail(
          editor.image,
          snapshot,
          editor.globalBlendMode,
          objectsSnapshot,
        );
        const proposal: DesignProposal = {
          id: crypto.randomUUID(),
          name: data.name.trim().slice(0, 80),
          description: data.description?.trim().slice(0, 300) || undefined,
          tags: data.tags,
          createdAt: now,
          updatedAt: now,
          thumbnail,
          masksSnapshot: snapshot,
          placedObjectsSnapshot: objectsSnapshot,
          placementSurfacesSnapshot: surfacesSnapshot,
          perspectiveGuideSnapshot: guideSnapshot,
          activeColor: editor.activeColor,
        };
        setProposals((current) => [...current, proposal]);
        setActiveProposalId(proposal.id);
        toast.success("Propuesta guardada correctamente.");
        return true;
      } catch (error) {
        toast.error(
          error instanceof Error && error.message === "DECOR_ASSET_LOAD_FAILED"
            ? "No se pudo cargar este objeto."
            : "No se pudo generar esta propuesta.",
        );
        return false;
      }
    },
    [
      editor,
      placement.perspectiveGuide,
      placement.placedObjects,
      placement.placementSurfaces,
    ],
  );

  const value = useMemo<ProjectContextValue>(
    () => ({
      activeProjectId,
      activeProjectName,
      activeProjectDescription,
      isDirty,
      isSaving,
      lastSavedAt,
      autosaveEnabled,
      saveStatus,
      saveDialogOpen,
      unsavedDialogOpen,
      setAutosaveEnabled,
      setSaveDialogOpen,
      setUnsavedDialogOpen,
      finishSaveDialog: () => {
        setSaveDialogOpen(false);
        if (pendingActionRef.current) executePending();
      },
      cancelSaveDialog: () => {
        pendingActionRef.current = null;
        setSaveDialogOpen(false);
      },
      cancelPendingAction: () => {
        pendingActionRef.current = null;
        setUnsavedDialogOpen(false);
      },
      requestSave: () =>
        activeProjectId ? void saveCurrentProject() : setSaveDialogOpen(true),
      saveCurrentProject,
      loadProject,
      createNewProject: () => guardAction(resetProject),
      openImageAsNewProject: () =>
        guardAction(() => {
          resetProject();
          window.setTimeout(editor.openImageDialog, 0);
        }),
      continueWithoutSaving: executePending,
      saveAndContinue: async () => {
        if (!activeProjectId) {
          setUnsavedDialogOpen(false);
          setSaveDialogOpen(true);
          return;
        }
        if (await saveCurrentProject()) executePending();
      },
      navigateWithGuard: (href) =>
        guardAction(() => {
          const destination =
            href === "/colors" && activeProjectIdRef.current
              ? `/colors?project=${encodeURIComponent(activeProjectIdRef.current)}`
              : href;
          router.push(destination);
        }),
      markDirty: () => {
        setIsDirty(true);
        setSaveStatus("unsaved");
        setRevision((current) => current + 1);
      },
      proposals,
      activeProposalId,
      selectedProposalIds,
      createProposal,
      updateProposal: (id, changes) =>
        setProposals((current) =>
          current.map((proposal) =>
            proposal.id === id
              ? {
                  ...proposal,
                  ...changes,
                  id,
                  updatedAt: new Date().toISOString(),
                }
              : proposal,
          ),
        ),
      deleteProposal: (id) => {
        setProposals((current) =>
          current.filter((proposal) => proposal.id !== id),
        );
        setSelectedProposalIds((current) =>
          current.filter((item) => item !== id),
        );
        if (activeProposalId === id) setActiveProposalId(null);
      },
      duplicateProposal: (id) =>
        setProposals((current) => {
          const source = current.find((proposal) => proposal.id === id);
          if (!source) return current;
          const now = new Date().toISOString();
          return [
            ...current,
            {
              ...source,
              id: crypto.randomUUID(),
              name: `${source.name} (copia)`,
              createdAt: now,
              updatedAt: now,
              masksSnapshot: createProposalSnapshot(source.masksSnapshot),
              placedObjectsSnapshot: clonePlacedDecorObjects(
                source.placedObjectsSnapshot,
              ),
              placementSurfacesSnapshot: clonePlacementSurfaces(
                source.placementSurfacesSnapshot,
              ),
              perspectiveGuideSnapshot: clonePerspectiveGuide(
                source.perspectiveGuideSnapshot,
              ),
            },
          ];
        }),
      applyProposal: (id) => {
        const proposal = proposals.find((item) => item.id === id);
        if (!proposal) {
          toast.error("No se pudo cargar esta propuesta.");
          return false;
        }
        editor.replaceMasks(applyProposalSnapshot(proposal));
        placement.replacePlacementScene({
          objects: clonePlacedDecorObjects(proposal.placedObjectsSnapshot),
          surfaces: clonePlacementSurfaces(proposal.placementSurfacesSnapshot),
          guide: clonePerspectiveGuide(proposal.perspectiveGuideSnapshot),
        });
        editor.setActiveColor(proposal.activeColor ?? null);
        setActiveProposalId(id);
        return true;
      },
      toggleProposalSelection: (id) =>
        setSelectedProposalIds((current) => {
          if (current.includes(id))
            return current.filter((item) => item !== id);
          if (current.length >= 4) {
            toast.error("Selecciona entre 2 y 4 propuestas.");
            return current;
          }
          return [...current, id];
        }),
      compareProposals: () => {
        if (selectedProposalIds.length < 2 || selectedProposalIds.length > 4) {
          toast.error("Selecciona entre 2 y 4 propuestas.");
          return false;
        }
        return true;
      },
      clearProposalSelection: () => setSelectedProposalIds([]),
    }),
    [
      activeProjectDescription,
      activeProjectId,
      activeProjectName,
      activeProposalId,
      autosaveEnabled,
      createProposal,
      editor,
      executePending,
      guardAction,
      isDirty,
      isSaving,
      lastSavedAt,
      loadProject,
      placement,
      proposals,
      resetProject,
      router,
      saveCurrentProject,
      saveDialogOpen,
      saveStatus,
      selectedProposalIds,
      unsavedDialogOpen,
    ],
  );

  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context)
    throw new Error("useProject debe usarse dentro de ProjectProvider.");
  return context;
}
